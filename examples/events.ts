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

const log = document.createElement('div');
log.id = 'event-log';
document.body.appendChild(log);
const logEvent = (name: string) => (ev: unknown) => {
    const line = document.createElement('div');
    const detail = ev && typeof ev === 'object' && 'level' in (ev as object)
        ? ` level=${(ev as {level: unknown}).level}` : '';
    line.textContent = `${new Date().toLocaleTimeString()}  ${name}${detail}`;
    log.prepend(line);
};
map.on('indoor.map.loaded', logEvent('indoor.map.loaded'));
map.on('indoor.map.unloaded', logEvent('indoor.map.unloaded'));
map.on('indoor.level.changed', logEvent('indoor.level.changed'));
map.on('indoor.control.clicked', logEvent('indoor.control.clicked'));
