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

MapServerHandler.manage(SERVER_URL, map);

// No server on this static demo: say it instead of failing silently.
fetch(SERVER_URL, {mode: 'no-cors'}).catch(() => {
    const note = document.querySelector('.explainer');
    if (note) note.innerHTML += '<p><b>No map server reachable here</b> — run one at localhost:4001 to see maps load around the viewport.</p>';
});

// Add the specific control
map.addControl(new IndoorControl());
