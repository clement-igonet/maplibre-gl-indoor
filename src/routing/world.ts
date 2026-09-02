import GeoJsonHelper from '../GeojsonHelper';
import {bboxOfRing, pointInRing, segmentIntersection, distanceInMeters, pointToSegmentMeters} from './geometry';
import type {BBox, Feature, Position} from 'geojson';
import type {IndoorMapGeoJSON, Level} from '../Types';

export type LevelLink = {
    position: Position,
    levels: Level[],
    kind: 'stairs' | 'escalator' | 'elevator'
};

type Shape = {ring: Position[], bbox: BBox};

export type RoutingWorld = {
    walkable: Map<Level, Shape[]>,
    blocking: Map<Level, Shape[]>,
    /** Room outlines: crossable only near a door. */
    roomWalls: Map<Level, Shape[]>,
    doors: Map<Level, Position[]>,
    links: LevelLink[]
};

const WALKABLE_INDOOR = new Set(['room', 'corridor', 'area', 'level', 'yes', 'hall']);
const WALKABLE_HIGHWAY = new Set(['footway', 'pedestrian']);
const BLOCKING_INDOOR = new Set(['wall', 'column', 'block']);

const levelsOf = (feature: Feature): Level[] => {
    const level = GeoJsonHelper.extractLevelFromFeature(feature);
    if (level === null) return [];
    if (typeof level === 'number') return [level];
    const out: Level[] = [];
    for (let l = Math.ceil(level.min); l <= level.max; l++) out.push(l);
    if (!out.includes(level.min)) out.unshift(level.min);
    if (!out.includes(level.max)) out.push(level.max);
    return out;
};

const centroid = (ring: Position[]): Position =>
    [ring.reduce((s, c) => s + c[0], 0) / ring.length,
        ring.reduce((s, c) => s + c[1], 0) / ring.length];

/** Builds the routing view of an indoor GeoJSON, per Simple Indoor Tagging. */
export function buildRoutingWorld(geojson: IndoorMapGeoJSON): RoutingWorld {
    const world: RoutingWorld = {
        walkable: new Map(), blocking: new Map(), roomWalls: new Map(),
        doors: new Map(), links: []
    };
    const push = (target: Map<Level, Shape[]>, level: Level, ring: Position[]) => {
        if (!target.has(level)) target.set(level, []);
        target.get(level)!.push({ring, bbox: bboxOfRing(ring)});
    };

    for (const feature of geojson.features) {
        const props = feature.properties ?? {};
        const geometry = feature.geometry;
        const levels = levelsOf(feature);

        if (props['highway'] === 'steps' || props['highway'] === 'elevator') {
            if (levels.length < 2) continue;
            const position = geometry.type === 'Point' ? geometry.coordinates :
                geometry.type === 'LineString' ? geometry.coordinates[Math.floor(geometry.coordinates.length / 2)] :
                    geometry.type === 'Polygon' ? centroid(geometry.coordinates[0]) : null;
            if (!position) continue;
            world.links.push({
                position,
                levels,
                kind: props['highway'] === 'elevator' ? 'elevator' :
                    props['conveying'] ? 'escalator' : 'stairs'
            });
            continue;
        }

        if ((props['door'] !== undefined && props['door'] !== 'no') || props['entrance'] !== undefined) {
            const position = geometry.type === 'Point' ? geometry.coordinates : null;
            if (!position) continue;
            for (const level of (levels.length ? levels : [0])) {
                if (!world.doors.has(level)) world.doors.set(level, []);
                world.doors.get(level)!.push(position);
            }
            continue;
        }

        if (geometry.type !== 'Polygon') continue;
        const ring = geometry.coordinates[0];

        if (BLOCKING_INDOOR.has(String(props['indoor']))) {
            for (const level of levels) push(world.blocking, level, ring);
            continue;
        }
        if (WALKABLE_INDOOR.has(String(props['indoor'])) ||
            WALKABLE_HIGHWAY.has(String(props['highway'])) ||
            props['railway'] === 'platform') {
            for (const level of levels) {
                push(world.walkable, level, ring);
                if (props['indoor'] === 'room') push(world.roomWalls, level, ring);
            }
        }
    }
    return world;
}

const hit = (pt: Position, shape: Shape): boolean =>
    pt[0] >= shape.bbox[0] && pt[0] <= shape.bbox[2] &&
    pt[1] >= shape.bbox[1] && pt[1] <= shape.bbox[3] && pointInRing(pt, shape.ring);

export function canStand(world: RoutingWorld, pt: Position, level: Level): boolean {
    const floors = world.walkable.get(level);
    if (!floors || !floors.some(s => hit(pt, s))) return false;
    const blocks = world.blocking.get(level);
    return !(blocks && blocks.some(s => hit(pt, s)));
}

/** A move crosses a room outline only within doorRadius of a door of that level. */
export function edgeBlocked(world: RoutingWorld, p: Position, q: Position, level: Level, doorRadius: number): boolean {
    const rooms = world.roomWalls.get(level);
    if (!rooms) return false;
    const doors = world.doors.get(level) ?? [];
    for (const room of rooms) {
        const ring = room.ring;
        // a room with no door near its outline stays open: incomplete data must not seal it
        const hasDoor = doors.some(d => {
            for (let i = 0; i + 1 < ring.length; i++) {
                if (pointToSegmentMeters(d, ring[i], ring[i + 1]) < doorRadius * 2) return true;
            }
            return false;
        });
        if (!hasDoor) continue;
        for (let i = 0; i + 1 < ring.length; i++) {
            const x = segmentIntersection(p, q, ring[i], ring[i + 1]);
            if (x && !doors.some(d => distanceInMeters(x, d) <= doorRadius)) return true;
        }
    }
    return false;
}
