import {describe, expect, test} from 'vitest';
import GeoJsonHelper from '../src/GeojsonHelper';
import type {Feature} from 'geojson';

const feature = (level: unknown): Feature =>
    ({type: 'Feature', properties: {level}, geometry: {type: 'Point', coordinates: [0, 0]}} as Feature);

describe('extractLevelFromFeature', () => {
    test('single level', () => {
        expect(GeoJsonHelper.extractLevelFromFeature(feature('2'))).toBe(2);
    });
    test('negative level', () => {
        expect(GeoJsonHelper.extractLevelFromFeature(feature('-1'))).toBe(-1);
    });
    test('half floor', () => {
        expect(GeoJsonHelper.extractLevelFromFeature(feature('0.5'))).toBe(0.5);
    });
    test('numeric property', () => {
        expect(GeoJsonHelper.extractLevelFromFeature(feature(3))).toBe(3);
    });
    test('two-item list', () => {
        expect(GeoJsonHelper.extractLevelFromFeature(feature('0;5'))).toEqual({min: 0, max: 5});
    });
    test('list longer than two items', () => {
        expect(GeoJsonHelper.extractLevelFromFeature(feature('1;3;5'))).toEqual({min: 1, max: 5});
    });
    test('unordered list', () => {
        expect(GeoJsonHelper.extractLevelFromFeature(feature('5;0'))).toEqual({min: 0, max: 5});
    });
    test('range', () => {
        expect(GeoJsonHelper.extractLevelFromFeature(feature('-1-3'))).toEqual({min: -1, max: 3});
    });
    test('negative range', () => {
        expect(GeoJsonHelper.extractLevelFromFeature(feature('-4--3'))).toEqual({min: -4, max: -3});
    });
    test('list of one level repeated collapses to a number', () => {
        expect(GeoJsonHelper.extractLevelFromFeature(feature('2;2'))).toBe(2);
    });
    test('garbage is null', () => {
        expect(GeoJsonHelper.extractLevelFromFeature(feature('mezzanine'))).toBeNull();
    });
    test('missing level is null', () => {
        expect(GeoJsonHelper.extractLevelFromFeature(
            {type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: [0, 0]}} as Feature)).toBeNull();
    });
});

describe('extractLevelsRangeAndBounds', () => {
    test('range and bounds across features', () => {
        const {levelsRange, bounds} = GeoJsonHelper.extractLevelsRangeAndBounds({
            type: 'FeatureCollection',
            features: [feature('0'), feature('1;3'), feature('-1')]
        });
        expect(levelsRange).toEqual({min: -1, max: 3});
        expect(bounds).toHaveLength(4);
    });
});
