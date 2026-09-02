import { Map as MapLibreMap } from 'maplibre-gl';

import { addIndoorTo, IndoorControl, IndoorMap, MaplibreMapWithIndoor,
         buildRoutingWorld, findRoute, Walker,
         routeToGeoJSON, routeLayer, ROUTE_SOURCE_ID, ROUTE_LAYER_ID } from '../src/index';

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

addIndoorTo(map);

const geojson = await (await fetch('maps/gare-de-l-est.geojson')).json();
map.indoor.addMap(IndoorMap.fromGeojson(geojson));
map.addControl(new IndoorControl());

const world = buildRoutingWorld(geojson);
const walker = new Walker(map);
const start = {position: [2.3592843, 48.8767904] as [number, number], level: 0};

map.on('click', async (event) => {
    const level = map.indoor.getLevel() ?? 0;
    const route = findRoute(world, start, {position: [event.lngLat.lng, event.lngLat.lat], level});
    if (!route) return;

    if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID);
    if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);
    map.addSource(ROUTE_SOURCE_ID, {type: 'geojson', data: routeToGeoJSON(route)});
    map.addLayer(routeLayer(level));
    map.on('indoor.level.changed' as never, (() => {
        const current = map.indoor.getLevel();
        if (map.getLayer(ROUTE_LAYER_ID) && current !== null) {
            map.setFilter(ROUTE_LAYER_ID, ['==', ['get', 'level'], current]);
        }
    }) as never);

    await walker.follow(route);
});
