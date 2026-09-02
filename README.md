# maplibre-gl-indoor

A [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) plugin for multi-floor indoor maps:
give it an indoor GeoJSON, get a level selector and per-level filtering of your layers.

This is the MapLibre successor of [map-gl-indoor](https://github.com/map-gl-indoor/map-gl-indoor)
by [Thibaud Michel](https://github.com/ThibaudM), modernized with his blessing and in its spirit:
**small, readable, easy to understand**. Mapbox GL support is dropped; the target is
`maplibre-gl >= 4`, and the examples run on keyless [OpenFreeMap](https://openfreemap.org) styles.

## Install

```sh
npm install maplibre-gl-indoor
```

Installing straight from GitHub also works — `dist/` is built on install:

```sh
npm install github:map-gl-indoor/maplibre-gl-indoor
```

## Use

```ts
import {addIndoorTo, IndoorControl, IndoorMap} from 'maplibre-gl-indoor';
import type {MaplibreMapWithIndoor} from 'maplibre-gl-indoor';

const map = new maplibregl.Map({...}) as MaplibreMapWithIndoor;
addIndoorTo(map);

const geojson = await (await fetch('building.geojson')).json();
map.indoor.addMap(IndoorMap.fromGeojson(geojson));
map.addControl(new IndoorControl());

map.on('indoor.level.changed', ({level}) => console.log('level', level));
```

Events: `indoor.map.loaded`, `indoor.map.unloaded`, `indoor.level.changed`,
`indoor.control.clicked`.

## Build and run

The compose file is the reference way to build, test and run — docker or podman, no local
node toolchain needed:

```sh
docker compose run test      # unit tests          (podman-compose works the same)
docker compose run build     # lib + examples + typings into dist/
docker compose up dev        # examples with live reload on :5173
docker compose up preview    # the built examples on :4173
```

`npm install` + `npm run dev` / `npm test` remain available for a local toolchain.

## Data

Features carry a `level` property: a number (`0`, `1.5`) or a `"min;max"` range (`"0;2"`).
GeoJSON from OpenStreetMap works well — see `examples/from-osm-file` and the
[osmtogeojson](https://github.com/tyrasd/osmtogeojson) tool.

## License

MIT. Original work © Thibaud Michel and map-gl-indoor contributors; modernization by
[Clément Igonet](https://github.com/clement-igonet).
