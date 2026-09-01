import { Map as MapLibreMap } from 'maplibre-gl';
import osmtogeojson from 'osmtogeojson';

import { addIndoorTo, IndoorControl, IndoorMap, MaplibreMapWithIndoor } from '../src/index';

import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!

const map = new MapLibreMap({
    container: app,
    zoom: 18,
    center: [5.723078, 45.183754],
    style: 'https://tiles.openfreemap.org/styles/liberty',
    hash: true
}) as MaplibreMapWithIndoor;

/**
 * Indoor specific
 */

addIndoorTo(map);

// Retrieve the geojson from the osm path
const osmString = await (await fetch('maps/caserne.osm')).text();
const osmXml = (new window.DOMParser()).parseFromString(osmString, "text/xml");
const geojson = osmtogeojson(osmXml);
map.indoor.addMap(IndoorMap.fromGeojson(geojson));

// Add the specific control
map.addControl(new IndoorControl());
