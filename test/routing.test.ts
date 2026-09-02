import {describe, expect, test} from 'vitest';
import {buildRoutingWorld, canStand, edgeBlocked, findRoute} from '../src/routing';
import type {Position} from 'geojson';
import type {IndoorMapGeoJSON} from '../src/Types';

// A synthetic two-level building near the origin, sized in degrees so that
// 0.00001 lng at this latitude is about 1.11 m.
const M = 0.00001;
const rect = (x: number, y: number, w: number, h: number): Position[] => [
    [x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];

const polygon = (ring: Position[], properties: object) => ({
    type: 'Feature' as const, properties, geometry: {type: 'Polygon' as const, coordinates: [ring]}});
const point = (position: Position, properties: object) => ({
    type: 'Feature' as const, properties, geometry: {type: 'Point' as const, coordinates: position}});

const building: IndoorMapGeoJSON = {
    type: 'FeatureCollection',
    features: [
        // level 0: a corridor 40 m x 10 m, a room at its east end with one door
        polygon(rect(0, 0, 40 * M, 10 * M), {indoor: 'corridor', level: '0'}),
        polygon(rect(40 * M, 0, 12 * M, 10 * M), {indoor: 'room', level: '0', name: 'shop'}),
        point([40 * M, 5 * M], {door: 'yes', level: '0'}),
        // a wall in the middle of the corridor with a gap at the south
        polygon(rect(18 * M, 4 * M, 2 * M, 6 * M), {indoor: 'wall', level: '0'}),
        // level 1: a corridor above
        polygon(rect(0, 0, 40 * M, 10 * M), {indoor: 'corridor', level: '1'}),
        // stairs linking 0 and 1 at the west end
        point([4 * M, 5 * M], {highway: 'steps', level: '0;1'}),
        // an elevator linking 0 and 1 at mid-corridor
        point([30 * M, 5 * M], {highway: 'elevator', level: '0;1'})
    ]
};

const world = buildRoutingWorld(building);

describe('buildRoutingWorld', () => {
    test('classifies the SIT features', () => {
        expect(world.walkable.get(0)).toHaveLength(2);
        expect(world.walkable.get(1)).toHaveLength(1);
        expect(world.blocking.get(0)).toHaveLength(1);
        expect(world.roomWalls.get(0)).toHaveLength(1);
        expect(world.doors.get(0)).toHaveLength(1);
        expect(world.links.map(l => l.kind).sort()).toEqual(['elevator', 'stairs']);
    });
});

describe('canStand', () => {
    test('inside the corridor', () => {
        expect(canStand(world, [10 * M, 5 * M], 0)).toBe(true);
    });
    test('inside the wall', () => {
        expect(canStand(world, [19 * M, 7 * M], 0)).toBe(false);
    });
    test('outside every floor', () => {
        expect(canStand(world, [10 * M, 20 * M], 0)).toBe(false);
    });
    test('level without a floor there', () => {
        expect(canStand(world, [45 * M, 5 * M], 1)).toBe(false);
    });
});

describe('edgeBlocked', () => {
    test('crossing the room outline far from its door is blocked', () => {
        expect(edgeBlocked(world, [39 * M, 9 * M], [43 * M, 9 * M], 0, 2)).toBe(true);
    });
    test('crossing at the door is allowed', () => {
        expect(edgeBlocked(world, [38 * M, 5 * M], [42 * M, 5 * M], 0, 2)).toBe(false);
    });
});

describe('findRoute', () => {
    const from = {position: [2 * M, 2 * M] as Position, level: 0};

    test('same level, around the wall', () => {
        const route = findRoute(world, from, {position: [36 * M, 8 * M], level: 0});
        expect(route).not.toBeNull();
        expect(route!.legs).toHaveLength(1);
        expect(route!.links).toHaveLength(0);
        // must be longer than the straight line, since the wall forces a detour
        expect(route!.distanceMeters).toBeGreaterThan(38);
    });

    test('into the room, through its door', () => {
        const route = findRoute(world, from, {position: [46 * M, 5 * M], level: 0});
        expect(route).not.toBeNull();
        const nearDoor = route!.nodes.some(n =>
            Math.abs(n.position[0] - 40 * M) < 3 * M && Math.abs(n.position[1] - 5 * M) < 3 * M);
        expect(nearDoor).toBe(true);
    });

    test('cross level via a link, with the level change reported', () => {
        const route = findRoute(world, from, {position: [10 * M, 5 * M], level: 1});
        expect(route).not.toBeNull();
        expect(route!.legs.map(l => l.level)).toEqual([0, 1]);
        expect(route!.links).toHaveLength(1);
        expect(route!.links[0].fromLevel).toBe(0);
        expect(route!.links[0].toLevel).toBe(1);
    });

    test('unreachable target is null', () => {
        const route = findRoute(world, from, {position: [100 * M, 100 * M], level: 0});
        expect(route).toBeNull();
    });

    test('a tiny budget gives up', () => {
        const route = findRoute(world, from, {position: [36 * M, 8 * M], level: 0}, {budget: 3});
        expect(route).toBeNull();
    });
});
