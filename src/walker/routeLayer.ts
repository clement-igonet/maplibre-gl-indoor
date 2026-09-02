import type {FeatureCollection} from 'geojson';
import type {LayerSpecification} from 'maplibre-gl';
import type {Route} from '../routing';
import type {Level} from '../Types';

export const ROUTE_SOURCE_ID = 'indoor-route';
export const ROUTE_LAYER_ID = 'indoor-route';

export function routeToGeoJSON(route: Route): FeatureCollection {
    return {
        type: 'FeatureCollection',
        features: route.legs.map(leg => ({
            type: 'Feature',
            properties: {level: leg.level},
            geometry: {type: 'LineString', coordinates: leg.coordinates}
        }))
    };
}

/** The route of the current level, dashed, above the indoor layers. */
export function routeLayer(level: Level): LayerSpecification {
    return {
        id: ROUTE_LAYER_ID,
        type: 'line',
        source: ROUTE_SOURCE_ID,
        filter: ['==', ['get', 'level'], level],
        layout: {'line-cap': 'round', 'line-join': 'round'},
        paint: {
            'line-color': '#0b6fb8',
            'line-width': 4,
            'line-dasharray': [0.8, 1.6]
        }
    };
}
