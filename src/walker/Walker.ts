import {Marker} from 'maplibre-gl';
import {startState, advance} from './follow';
import type {Map as MapGL, LngLatLike} from 'maplibre-gl';
import type {Route} from '../routing';
import type {WalkState} from './follow';
import type {MapGLWithIndoor} from '../Types';

export type WalkerOptions = {
    /** Walking speed in meters per second. Default 1.4. */
    speed?: number,
    /** A custom marker element; defaults to a small round badge. */
    element?: HTMLElement,
    /** Switch the displayed level to follow the walker. Default true. */
    followLevel?: boolean
};

const defaultElement = (): HTMLElement => {
    const el = document.createElement('div');
    el.style.cssText =
        'width:18px;height:18px;border-radius:50%;background:#0b6fb8;' +
        'border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.4)';
    return el;
};

/**
 * A marker that walks a route from the routing core, switching the displayed
 * level when the route takes stairs, an escalator or an elevator.
 */
export default class Walker {
    _map: MapGL;
    _marker: Marker | null = null;
    _frame: number | null = null;
    _options: Required<Pick<WalkerOptions, 'speed' | 'followLevel'>> & WalkerOptions;

    constructor(map: MapGL, options: WalkerOptions = {}) {
        this._map = map;
        this._options = {speed: 1.4, followLevel: true, ...options};
    }

    follow(route: Route): Promise<void> {
        this.stop();
        const element = this._options.element ?? defaultElement();
        let state = startState(route);
        this._marker = new Marker({element})
            .setLngLat(state.position as LngLatLike)
            .addTo(this._map);
        this._setLevel(state.level);
        this._fire('indoor.walker.started', {level: state.level});

        return new Promise(resolve => {
            let last = performance.now();
            const step = (now: number) => {
                const dt = Math.min(0.1, (now - last) / 1000);
                last = now;
                const next: WalkState = advance(route, state, dt * this._options.speed);
                if (next.level !== state.level) {
                    this._setLevel(next.level);
                    this._fire('indoor.walker.level.changed', {level: next.level});
                }
                state = next;
                this._marker?.setLngLat(state.position as LngLatLike);
                if (state.done) {
                    this._fire('indoor.walker.arrived', {level: state.level});
                    this._frame = null;
                    resolve();
                    return;
                }
                this._frame = requestAnimationFrame(step);
            };
            this._frame = requestAnimationFrame(step);
        });
    }

    stop(): void {
        if (this._frame !== null) cancelAnimationFrame(this._frame);
        this._frame = null;
        this._marker?.remove();
        this._marker = null;
    }

    _setLevel(level: number): void {
        if (!this._options.followLevel) return;
        const indoor = (this._map as MapGLWithIndoor).indoor;
        if (indoor && indoor.getSelectedMap()) indoor.setLevel(level);
    }

    _fire(type: string, payload: object): void {
        this._map.fire(type as never, payload as never);
    }
}
