import type {BBox, Position} from 'geojson';

export function bboxOfRing(ring: Position[]): BBox {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of ring) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
    }
    return [x0, y0, x1, y1];
}

export function pointInRing(pt: Position, ring: Position[]): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if ((yi > pt[1]) !== (yj > pt[1]) &&
            pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}

/** Intersection point of the open segments [p,q] and [a,b], or null. */
export function segmentIntersection(p: Position, q: Position, a: Position, b: Position): Position | null {
    const d1x = q[0] - p[0], d1y = q[1] - p[1];
    const d2x = b[0] - a[0], d2y = b[1] - a[1];
    const den = d1x * d2y - d1y * d2x;
    if (den === 0) return null;
    const t = ((a[0] - p[0]) * d2y - (a[1] - p[1]) * d2x) / den;
    const u = ((a[0] - p[0]) * d1y - (a[1] - p[1]) * d1x) / den;
    return t > 0 && t < 1 && u > 0 && u < 1 ? [p[0] + t * d1x, p[1] + t * d1y] : null;
}

const EARTH_RADIUS = 6371008.8;
export const M_PER_DEG_LAT = Math.PI * EARTH_RADIUS / 180;
export const mPerDegLng = (lat: number): number => M_PER_DEG_LAT * Math.cos(lat * Math.PI / 180);

export function distanceInMeters(a: Position, b: Position): number {
    return Math.hypot((b[0] - a[0]) * mPerDegLng(a[1]), (b[1] - a[1]) * M_PER_DEG_LAT);
}

export function pointToSegmentMeters(p: Position, a: Position, b: Position): number {
    const kx = mPerDegLng(p[1]), ky = M_PER_DEG_LAT;
    const ax = (a[0] - p[0]) * kx, ay = (a[1] - p[1]) * ky;
    const bx = (b[0] - p[0]) * kx, by = (b[1] - p[1]) * ky;
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(ax + t * dx, ay + t * dy);
}
