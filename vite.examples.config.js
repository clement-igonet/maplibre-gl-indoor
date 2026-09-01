// vite.config.js

import { resolve } from 'path';
import { defineConfig } from 'vite';
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'fs';

function copyFiles(from, to, overwrite = false, pattern = null) {
    return {
        name: 'copy-files',
        generateBundle() {
            if (!existsSync(to)) mkdirSync(to, { recursive: true });
            const log = msg => console.log('\x1b[36m%s\x1b[0m', msg)
            log(`copy files: ${from} → ${to}`);
            readdirSync(from).filter(f => !pattern || pattern.test(f)).forEach(file => {
                const fromFile = `${from}/${file}`;
                const toFile = `${to}/${file}`;
                if (existsSync(toFile) && !overwrite)
                    return
                log(`• ${fromFile} → ${toFile}`)
                copyFileSync(
                    resolve(fromFile),
                    resolve(toFile)
                )
            })
        }
    }
}

const examplesPath = resolve(__dirname, './examples');
const dirCont = readdirSync(examplesPath);
const htmlFiles = dirCont
    .filter((elm) => elm.match(/.*\.(html?)/ig))
    .map(file => resolve(examplesPath, file));

const outDir = resolve(__dirname, 'dist', 'examples');


export default defineConfig({
    root: examplesPath,
    // relative asset paths, so the built examples work from any subpath
    base: './',
    build: {
        outDir,
        sourcemap: true,
        target: 'esnext',
        rollupOptions: {
            input: htmlFiles,
            plugins: [
                copyFiles(resolve(examplesPath, 'img'), resolve(outDir, 'img')),
                copyFiles(resolve(examplesPath, 'maps'), resolve(outDir, 'maps')),
                // maplibre-gl resolves its worker at runtime and the worker imports the
                // shared chunk; the bundler sees neither, so ship both next to the assets
                copyFiles(resolve(__dirname, 'node_modules/maplibre-gl/dist'),
                          resolve(outDir, 'assets'), false, /maplibre-gl-(worker|shared)\.mjs$/)
            ]
        }
    }
});
