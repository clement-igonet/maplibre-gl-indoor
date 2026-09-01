import { Map as MapLibreMap } from 'maplibre-gl';

import { IndoorControl, MapServerHandler } from '../src/index';

import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!

const map = new MapLibreMap({
    container: app,
    zoom: 18,
    center: [2.3592843, 48.8767904],
    style: 'https://tiles.openfreemap.org/styles/liberty',
    hash: true
});

/**
 * Indoor specific
 */
const SERVER_URL = 'https://localhost:4001';

const indoorMapsOptions = {
    beforeLayerId: 'housenum-label',
    layersToHide: ['poi-scalerank4-l15', 'poi-scalerank4-l1', 'poi-scalerank3', 'road-label-small']
}

MapServerHandler.manage(SERVER_URL, map, indoorMapsOptions);

// Add the specific control
map.addControl(new IndoorControl());
