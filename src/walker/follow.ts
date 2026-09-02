import {distanceInMeters} from '../routing/geometry';
import type {Position} from 'geojson';
import type {Route} from '../routing';
import type {Level} from '../Types';

export type WalkState = {
    /** Index of the current leg. */
    leg: number,
    /** Index of the segment start inside the leg. */
    segment: number,
    /** Meters already walked inside the current segment. */
    intoSegment: number,
    position: Position,
    level: Level,
    done: boolean
};

export function startState(route: Route): WalkState {
    const leg = route.legs[0];
    return {
        leg: 0, segment: 0, intoSegment: 0,
        position: leg.coordinates[0], level: leg.level, done: route.legs.length === 0
    };
}

const along = (a: Position, b: Position, meters: number): Position => {
    const total = distanceInMeters(a, b);
    if (total === 0) return a;
    const t = Math.min(1, meters / total);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
};

/**
 * Advances the walk by the given number of meters. Level changes happen
 * between legs; the returned state carries the new level so the caller can
 * switch the displayed level and continue.
 */
export function advance(route: Route, state: WalkState, meters: number): WalkState {
    if (state.done) return state;
    let {leg, segment, intoSegment} = state;
    let budget = meters;
    while (budget > 0) {
        const coordinates = route.legs[leg].coordinates;
        if (segment + 1 >= coordinates.length) {
            if (leg + 1 >= route.legs.length) {
                return {leg, segment, intoSegment, position: coordinates[coordinates.length - 1],
                    level: route.legs[leg].level, done: true};
            }
            leg += 1;
            segment = 0;
            intoSegment = 0;
            continue;
        }
        const a = coordinates[segment];
        const b = coordinates[segment + 1];
        const length = distanceInMeters(a, b);
        if (intoSegment + budget >= length) {
            budget -= (length - intoSegment);
            segment += 1;
            intoSegment = 0;
        } else {
            intoSegment += budget;
            budget = 0;
        }
    }
    const coordinates = route.legs[leg].coordinates;
    const position = segment + 1 < coordinates.length ?
        along(coordinates[segment], coordinates[segment + 1], intoSegment) :
        coordinates[coordinates.length - 1];
    return {leg, segment, intoSegment, position, level: route.legs[leg].level, done: false};
}
