import { describe, expect, it } from 'vitest';
import { isRegionalCoverage } from './regional-data.js';

function bounds(south, west, north, east) {
    return { getSouth: () => south, getWest: () => west, getNorth: () => north, getEast: () => east };
}

describe('regional data coverage', () => {
    it('accepts a viewport fully inside the DACHLiLu coverage', () => {
        expect(isRegionalCoverage(bounds(48.13, 11.55, 48.15, 11.59))).toBe(true);
    });

    it('rejects a viewport outside the regional coverage', () => {
        expect(isRegionalCoverage(bounds(40, -4, 40.1, -3.9))).toBe(false);
    });

    it('rejects a viewport that crosses the regional coverage edge', () => {
        expect(isRegionalCoverage(bounds(48.13, 11.55, 48.15, 11.59))).toBe(true);
        expect(isRegionalCoverage(bounds(48.13, 11.55, 48.15, 20.0))).toBe(false);
    });
});
