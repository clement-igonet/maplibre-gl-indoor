import { Map as MapLibreMap } from 'maplibre-gl';

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

// Retrieve the geojson from the path and add the map
const geojson = await (await fetch('maps/gare-de-l-est.geojson')).json();
map.indoor.addMap(IndoorMap.fromGeojson(geojson));

// Add the specific control
map.addControl(new IndoorControl());

map.on('indoor.map.loaded', console.log);
map.on('indoor.map.unloaded', console.log);
map.on('indoor.level.changed', console.log);
map.on('indoor.control.clicked', console.log);
