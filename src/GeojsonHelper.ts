import bbox from '@turf/bbox';

import type { BBox, Feature } from 'geojson';
import type { LevelsRange, IndoorMapGeoJSON } from './Types';

/**
 * Helper for Geojson data
 */
class GeoJsonHelper {

    /**
     * Extract level from feature
     *
     * @param {GeoJSONFeature} feature geojson feature
     * @returns {LevelsRange | number | null} the level or the range of level.
     */
    static extractLevelFromFeature(feature: Feature): (LevelsRange | number | null) {
        const raw = feature.properties ? feature.properties['level'] : null;
        if (raw === undefined || raw === null) {
            return null;
        }
        if (typeof raw === 'number') {
            return isNaN(raw) ? null : raw;
        }
        if (typeof raw !== 'string') {
            return null;
        }
        // Simple Indoor Tagging: level is a ";"-separated list of levels, where each
        // item is a number (half floors like 0.5 included) or an "a-b" range.
        // https://wiki.openstreetmap.org/wiki/Simple_Indoor_Tagging
        let min = Infinity;
        let max = -Infinity;
        const range = /^(-?\d+(?:\.\d+)?)-(-?\d+(?:\.\d+)?)$/;
        const plain = /^-?\d+(?:\.\d+)?$/;
        for (const token of raw.split(';')) {
            const item = token.trim();
            if (plain.test(item)) {
                const level = parseFloat(item);
                min = Math.min(min, level);
                max = Math.max(max, level);
                continue;
            }
            const match = range.exec(item);
            if (match) {
                const a = parseFloat(match[1]);
                const b = parseFloat(match[2]);
                min = Math.min(min, a, b);
                max = Math.max(max, a, b);
            }
        }
        if (min === Infinity) {
            return null;
        }
        return min === max ? min : {min, max};
    }

    /**
     * Extract levels range and bounds from geojson
     *
     * @param {IndoorMapGeoJSON} geojson the geojson
     * @returns {Object} the levels range and bounds.
     */
    static extractLevelsRangeAndBounds(geojson: IndoorMapGeoJSON)
        : ({ levelsRange: LevelsRange, bounds: BBox }) {

        let minLevel = Infinity;
        let maxLevel = -Infinity;

        const bounds = bbox(geojson);

        const parseFeature = (feature: Feature): void => {
            const level = this.extractLevelFromFeature(feature);
            if (level === null) {
                return;
            }
            if (typeof level === 'number') {
                minLevel = Math.min(minLevel, level);
                maxLevel = Math.max(maxLevel, level);
            } else if (typeof level === 'object') {
                minLevel = Math.min(minLevel, level.min);
                maxLevel = Math.max(maxLevel, level.max);
            }
        };

        if (geojson.type === 'FeatureCollection') {
            geojson.features.forEach(parseFeature);
        }

        if (minLevel === Infinity || maxLevel === -Infinity) {
            throw new Error('No level found');
        }
        return {
            levelsRange: { min: minLevel, max: maxLevel },
            bounds
        };
    }
}
export default GeoJsonHelper;
