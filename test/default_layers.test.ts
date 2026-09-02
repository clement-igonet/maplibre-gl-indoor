import {describe, expect, test} from 'vitest';
import layers from '../src/style/DefaultLayers';

describe('default layers', () => {
    test('layer ids are unique', () => {
        const ids = layers.map((l: {id: string}) => l.id);
        expect(new Set(ids).size).toBe(ids.length);
    });
    test('the poi template was expanded into concrete poi layers', () => {
        const ids = layers.map((l: {id: string}) => l.id);
        expect(ids).not.toContain('poi-indoor');
        expect(ids.filter((id: string) => id.startsWith('poi-indoor-')).length).toBeGreaterThan(3);
    });
    test('doors are drawn', () => {
        expect(layers.find((l: {id: string}) => l.id === 'indoor-doors')).toBeTruthy();
    });
    test('vertical circulation is drawn', () => {
        const ids = layers.map((l: {id: string}) => l.id);
        for (const id of ['indoor-stairs', 'indoor-steps', 'indoor-conveying']) {
            expect(ids).toContain(id);
        }
    });
    test('room names have a label layer', () => {
        const label = layers.find((l: {id: string}) => l.id === 'poi-indoor-text-ref');
        expect(label.layout['text-field']).toBe('{name}');
    });
});
