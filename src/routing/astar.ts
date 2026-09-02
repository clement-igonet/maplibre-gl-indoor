import {canStand, edgeBlocked} from './world';
import {distanceInMeters, mPerDegLng, M_PER_DEG_LAT} from './geometry';
import type {Position} from 'geojson';
import type {Level} from '../Types';
import type {RoutingWorld} from './world';

export type RouteNode = {position: Position, level: Level};

export type RouteLinkStep = {
    kind: 'stairs' | 'escalator' | 'elevator',
    fromLevel: Level,
    toLevel: Level,
    position: Position
};

export type Route = {
    nodes: RouteNode[],
    /** One LineString worth of positions per level crossed, in travel order. */
    legs: {level: Level, coordinates: Position[]}[],
    links: RouteLinkStep[],
    /** Walked distance in meters, level changes excluded. */
    distanceMeters: number
};

export type RouteOptions = {
    /** Grid pitch in meters. Default 2.5. */
    cellSize?: number,
    /** How close to a door a wall crossing may be, in meters. Default 1.6 * cellSize. */
    doorRadius?: number,
    /** Cost in meters equivalent for taking stairs / an escalator / an elevator. */
    linkCosts?: {stairs?: number, escalator?: number, elevator?: number},
    /** Max explored cells before giving up. Default 30000. */
    budget?: number
};

const DEFAULTS = {cellSize: 2.5, budget: 30000, linkCosts: {stairs: 14, escalator: 12, elevator: 10}};

export function findRoute(
    world: RoutingWorld,
    from: {position: Position, level: Level},
    to: {position: Position, level: Level},
    options: RouteOptions = {}
): Route | null {
    const cell = options.cellSize ?? DEFAULTS.cellSize;
    const doorRadius = options.doorRadius ?? cell * 1.6;
    const budget = options.budget ?? DEFAULTS.budget;
    const linkCosts = {...DEFAULTS.linkCosts, ...options.linkCosts};

    const origin = from.position;
    const toCell = (p: Position, level: Level): string =>
        `${level}|${Math.round((p[0] - origin[0]) * mPerDegLng(p[1]) / cell)}|${Math.round((p[1] - origin[1]) * M_PER_DEG_LAT / cell)}`;
    const fromCell = (key: string): RouteNode => {
        const [level, ix, iy] = key.split('|').map(Number);
        const lat = origin[1] + iy * cell / M_PER_DEG_LAT;
        return {level, position: [origin[0] + ix * cell / mPerDegLng(lat), lat]};
    };

    const standCache = new Map<string, boolean>();
    const cellOk = (key: string): boolean => {
        let v = standCache.get(key);
        if (v === undefined) {
            const n = fromCell(key);
            v = canStand(world, n.position, n.level);
            standCache.set(key, v);
        }
        return v;
    };

    const linkCells = new Map<string, typeof world.links>();
    for (const link of world.links) {
        for (const level of link.levels) {
            const key = toCell(link.position, level);
            if (!linkCells.has(key)) linkCells.set(key, []);
            linkCells.get(key)!.push(link);
        }
    }

    const start = toCell(from.position, from.level);
    const goal = toCell(to.position, to.level);
    const goalNode = fromCell(goal);
    if (!cellOk(goal) || !cellOk(start)) return null;

    const h = (key: string): number => {
        const n = fromCell(key);
        return distanceInMeters(n.position, goalNode.position) + Math.abs(n.level - goalNode.level) * 12;
    };

    const open: {key: string, f: number}[] = [{key: start, f: h(start)}];
    const came = new Map<string, string>();
    const g = new Map<string, number>([[start, 0]]);
    const blockCache = new Map<string, boolean>();
    let explored = 0;

    while (open.length) {
        open.sort((a, b) => a.f - b.f);
        const current = open.shift()!;
        if (current.key === goal) return assemble(current.key);
        if (++explored > budget) break;

        const [level, ix, iy] = current.key.split('|').map(Number);
        const neighbors: [string, number][] = [];
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
            if (dx || dy) neighbors.push([`${level}|${ix + dx}|${iy + dy}`, cell * Math.hypot(dx, dy)]);
        }
        for (const link of linkCells.get(current.key) ?? []) {
            for (const other of link.levels) {
                if (other !== level) neighbors.push([toCell(link.position, other), linkCosts[link.kind]]);
            }
        }
        for (const [next, cost] of neighbors) {
            if (!cellOk(next)) continue;
            const sameLevel = next.split('|')[0] === String(level);
            if (sameLevel) {
                const cacheKey = current.key < next ? `${current.key}>${next}` : `${next}>${current.key}`;
                let blocked = blockCache.get(cacheKey);
                if (blocked === undefined) {
                    blocked = edgeBlocked(world, fromCell(current.key).position, fromCell(next).position, level, doorRadius);
                    blockCache.set(cacheKey, blocked);
                }
                if (blocked) continue;
            }
            const tentative = g.get(current.key)! + cost;
            if (tentative < (g.get(next) ?? Infinity)) {
                g.set(next, tentative);
                came.set(next, current.key);
                open.push({key: next, f: tentative + h(next)});
            }
        }
    }
    return null;

    function assemble(endKey: string): Route {
        const keys = [endKey];
        let key = endKey;
        while (came.has(key)) {
            key = came.get(key)!;
            keys.push(key);
        }
        keys.reverse();
        const nodes = keys.map(fromCell);
        nodes[0] = {...nodes[0], position: from.position};
        nodes[nodes.length - 1] = {...nodes[nodes.length - 1], position: to.position};

        const legs: Route['legs'] = [];
        const links: RouteLinkStep[] = [];
        let distanceMeters = 0;
        for (const node of nodes) {
            const leg = legs[legs.length - 1];
            if (!leg || leg.level !== node.level) {
                if (leg) {
                    const linkHere = (linkCells.get(toCell(node.position, leg.level)) ?? [])[0];
                    links.push({
                        kind: linkHere?.kind ?? 'stairs',
                        fromLevel: leg.level,
                        toLevel: node.level,
                        position: node.position
                    });
                }
                legs.push({level: node.level, coordinates: [node.position]});
            } else {
                distanceMeters += distanceInMeters(leg.coordinates[leg.coordinates.length - 1], node.position);
                leg.coordinates.push(node.position);
            }
        }
        return {nodes, legs, links, distanceMeters: Math.round(distanceMeters * 10) / 10};
    }
}
