import { Map as MapLibreMap, Popup } from 'maplibre-gl';

import { addIndoorTo, IndoorControl, IndoorMap, MaplibreMapWithIndoor } from '../src/index';

import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';
import { Point } from 'geojson';

const app = document.querySelector<HTMLDivElement>('#app')!

const map = new MapLibreMap({
    container: app,
    zoom: 18,
    center: [2.3592843, 48.8767904],
    style: 'https://tiles.openfreemap.org/styles/liberty',
    hash: true
}) as MaplibreMapWithIndoor;

const mapLoadedPr = new Promise(resolve => map.on('load', resolve));

/**
 * Indoor specific
 */

addIndoorTo(map);

// Retrieve the geojson from the path and add the map
const geojson = await (await fetch('maps/gare-de-l-est.geojson')).json();
map.indoor.addMap(IndoorMap.fromGeojson(geojson));

// Add the specific control
map.addControl(new IndoorControl());

await mapLoadedPr;

const image = (await map.loadImage('./img/red-marker.png')).data;
map.addImage('poi', image);

map.addSource('pois', {
    type: 'geojson',
    data: {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [2.359497, 48.87688]
                },
                properties: {
                    level: '-1',
                    name: 'Paul'
                }
            },
            {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [2.358508, 48.877255]
                },
                properties: {
                    level: '0',
                    name: 'Relay'
                }
            }
        ]
    }
});

map.indoor.addLayerForFiltering({
    'id': 'pois',
    'type': 'symbol',
    'source': 'pois',
    'layout': {
        'icon-image': 'poi'
    }
});

map.on('click', 'pois', (e) => {

    const { geometry, properties } = e.features![0];
    const coordinates = (geometry as Point).coordinates.slice();
    const description = properties?.name + ' (level: ' + properties?.level + ')';

    new Popup()
        .setLngLat(coordinates as [number, number])
        .setHTML(description)
        .addTo(map);
});

map.on('mouseenter', 'pois', () => {
    map.getCanvas().style.cursor = 'pointer';
});

map.on('mouseleave', 'pois', () => {
    map.getCanvas().style.cursor = '';
});

