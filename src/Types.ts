import type { FeatureCollection, Geometry } from 'geojson';
import type {
    Map as MaplibreMap,
    ExpressionSpecification as MaplibreExpressionSpecification,
    LayerSpecification as MaplibreLayerSpecification
} from 'maplibre-gl';

import type IndoorLayer from './IndoorLayer';

export type Level = number;

export type LevelsRange = {
    min: Level,
    max: Level
};

export type IndoorMapOptions = {
    beforeLayerId?: string,
    defaultLevel?: number,
    layers?: Array<LayerSpecification>,
    layersToHide?: Array<string>,
    showFeaturesWithEmptyLevel?: boolean
}

export type IndoorMapGeoJSON = FeatureCollection<Geometry>;

export type LayerSpecification = MaplibreLayerSpecification;
export type ExpressionSpecification = MaplibreExpressionSpecification;

export type MapGL = MaplibreMap;

export type IndoorMapEvent = 'indoor.map.loaded'
    | 'indoor.map.unloaded'
    | 'indoor.level.changed'
    | 'indoor.control.clicked';

export type MaplibreMapWithIndoor = MaplibreMap & {
    indoor: IndoorLayer,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(type: IndoorMapEvent, listener: (ev: any) => void): MaplibreMap;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    off(type: IndoorMapEvent, listener: (ev: any) => void): MaplibreMap;
};

/** @deprecated mapbox-gl support was dropped; kept as an alias for old imports. */
export type MapboxMapWithIndoor = MaplibreMapWithIndoor;

export type MapGLWithIndoor = MaplibreMapWithIndoor;
