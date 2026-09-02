import {describe, expect, test} from 'vitest';
import {overlap, filterWithLevel, bboxContains} from '../src/Utils';

describe('overlap', () => {
    test('overlapping boxes', () => {
        expect(overlap([0, 0, 2, 2], [1, 1, 3, 3])).toBe(true);
    });
    test('disjoint boxes', () => {
        expect(overlap([0, 0, 1, 1], [2, 2, 3, 3])).toBe(false);
    });
});

describe('bboxContains', () => {
    test('inside', () => {
        expect(bboxContains([0, 0, 2, 2], [1, 1])).toBe(true);
    });
    test('outside', () => {
        expect(bboxContains([0, 0, 2, 2], [3, 1])).toBe(false);
    });
});

describe('filterWithLevel', () => {
    test('wraps the initial filter and matches the exact level string', () => {
        const filter = filterWithLevel(['all'], 1);
        expect(filter[0]).toBe('all');
        expect(JSON.stringify(filter)).toContain('"1"');
    });
});
