import { Map as MapLibreMap } from 'maplibre-gl';

import { addIndoorTo, IndoorControl, IndoorMap, MaplibreMapWithIndoor } from '../src/index';

import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!

const map = new MapLibreMap({
    container: app,
    style: 'https://tiles.openfreemap.org/styles/liberty',
    zoom: 18,
    center: [2.3592843, 48.8767904],
    hash: true
}) as MaplibreMapWithIndoor;

addIndoorTo(map);

const geojson = await (await fetch('maps/gare-de-l-est.geojson')).json();
map.indoor.addMap(IndoorMap.fromGeojson(geojson));
map.addControl(new IndoorControl());

/**
 * A small search over the named indoor features, instead of a remote geocoder:
 * everything this example needs is already in the geojson.
 */
const box = document.createElement('div');
box.style.cssText = 'position:absolute;top:10px;left:10px;z-index:5;background:#fff;' +
    'padding:8px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,.2);font:13px sans-serif';
box.innerHTML = '<input placeholder="search a place..." style="width:180px"><div class="hits"></div>';
document.body.appendChild(box);
const input = box.querySelector('input')!;
const hits = box.querySelector<HTMLDivElement>('.hits')!;

type Named = {name: string; level: string; center: [number, number]};
const named: Named[] = [];
for (const f of geojson.features) {
    if (!f.properties?.name || !f.geometry) continue;
    let lng = 0, lat = 0, n = 0;
    JSON.stringify(f.geometry.coordinates).replace(/\[(-?[\d.]+),(-?[\d.]+)/g,
        (_m: string, x: string, y: string) => { lng += +x; lat += +y; n++; return ''; });
    if (n) named.push({name: f.properties.name, level: String(f.properties.level ?? '?'),
                       center: [lng / n, lat / n]});
}

input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    hits.innerHTML = '';
    if (!q) return;
    for (const item of named.filter(i => i.name.toLowerCase().includes(q)).slice(0, 8)) {
        const row = document.createElement('div');
        row.textContent = `${item.name} (level ${item.level})`;
        row.style.cssText = 'padding:3px 2px;cursor:pointer';
        row.onclick = () => {
            map.flyTo({center: item.center, zoom: 19});
            const lvl = parseFloat(item.level);
            if (!isNaN(lvl)) map.indoor.setLevel(lvl);
        };
        hits.appendChild(row);
    }
});
