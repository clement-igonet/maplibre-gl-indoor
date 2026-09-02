import {describe, expect, test} from 'vitest';
import {startState, advance} from '../src/walker/follow';
import {routeToGeoJSON, routeLayer} from '../src/walker/routeLayer';
import type {Route} from '../src/routing';
import type {Position} from 'geojson';

// ~1.11 m per unit at the equator
const M = 0.00001;
const p = (x: number, y: number): Position => [x * M, y * M];

const route: Route = {
    nodes: [],
    legs: [
        {level: 0, coordinates: [p(0, 0), p(10, 0), p(10, 10)]},
        {level: 1, coordinates: [p(10, 10), p(20, 10)]}
    ],
    links: [{kind: 'stairs', fromLevel: 0, toLevel: 1, position: p(10, 10)}],
    distanceMeters: 33.3
};

describe('advance', () => {
    test('starts at the first coordinate on the first level', () => {
        const s = startState(route);
        expect(s.position).toEqual(p(0, 0));
        expect(s.level).toBe(0);
        expect(s.done).toBe(false);
    });

    test('walks along the first segment', () => {
        const s = advance(route, startState(route), 5.55);
        expect(s.level).toBe(0);
        expect(s.position[1]).toBeCloseTo(0, 10);
        expect(s.position[0]).toBeGreaterThan(4 * M);
        expect(s.position[0]).toBeLessThan(6 * M);
    });

    test('turns the corner within one advance', () => {
        const s = advance(route, startState(route), 16.65); // 11.1 + 5.55
        expect(s.level).toBe(0);
        expect(s.position[0]).toBeCloseTo(10 * M, 10);
        expect(s.position[1]).toBeGreaterThan(4 * M);
    });

    test('changes level between the legs', () => {
        const s = advance(route, startState(route), 23.0); // past 22.2 = end of leg 0
        expect(s.level).toBe(1);
        expect(s.done).toBe(false);
    });

    test('arrives and stays done', () => {
        const s = advance(route, startState(route), 1000);
        expect(s.done).toBe(true);
        expect(s.level).toBe(1);
        expect(s.position).toEqual(p(20, 10));
        expect(advance(route, s, 10)).toBe(s);
    });

    test('many small steps agree with one big step', () => {
        let s = startState(route);
        for (let i = 0; i < 100; i++) s = advance(route, s, 0.25);
        const big = advance(route, startState(route), 25);
        expect(s.level).toBe(big.level);
        expect(s.position[0]).toBeCloseTo(big.position[0], 9);
        expect(s.position[1]).toBeCloseTo(big.position[1], 9);
    });
});

describe('route layer', () => {
    test('one feature per leg, carrying its level', () => {
        const fc = routeToGeoJSON(route);
        expect(fc.features).toHaveLength(2);
        expect(fc.features.map(f => f.properties!.level)).toEqual([0, 1]);
    });
    test('the layer filters by level', () => {
        const layer = routeLayer(1);
        expect(layer.type).toBe('line');
        expect(JSON.stringify(layer.filter)).toContain('level');
    });
});
