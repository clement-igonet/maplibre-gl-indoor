// vite.config.js
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'maplibregl_indoor',
            fileName: (format) => `maplibre-gl-indoor.${format}.js`
        },
        outDir: resolve(__dirname, 'dist', 'lib'),
    }
});
