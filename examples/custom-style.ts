import { Map as MapLibreMap } from 'maplibre-gl';
import type { LayerSpecification } from 'maplibre-gl';

import { addIndoorTo, IndoorControl, IndoorMap, MaplibreMapWithIndoor } from '../src/index';

import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!

const map = new MapLibreMap({
    container: app,
    zoom: 18,
    center: [2.3592843, 48.8767904],
    style: 'https://tiles.openfreemap.org/styles/liberty',
    hash: true
}) as MaplibreMapWithIndoor;

/**
 * Indoor specific
 */

addIndoorTo(map);

const layers = [
    {
        "filter": [
            "filter-==",
            "indoor",
            "room"
        ],
        "id": "indoor-rooms",
        "type": "fill",
        "source": "indoor",
        "paint": {
            "fill-color": "#FF0000",
            "fill-opacity": 0.5
        }
    },
    {
        "filter": [
            "filter-==",
            "indoor",
            "area"
        ],
        "id": "indoor-areas",
        "type": "fill",
        "source": "indoor",
        "paint": {
            "fill-color": "#0000FF",
            "fill-opacity": 0.5
        }
    }
]


// Retrieve the geojson from the path and add the map
const geojson = await (await fetch('maps/gare-de-l-est.geojson')).json();
map.indoor.addMap(IndoorMap.fromGeojson(geojson, { layers: layers as unknown as LayerSpecification[] }));

// Add the specific control
map.addControl(new IndoorControl());
