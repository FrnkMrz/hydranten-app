import { describe, it, expect } from 'vitest';
import { calculateOffsetPosition, hasReliableGpsFix } from './geo';

describe('geo service', () => {
    describe('hasReliableGpsFix', () => {
        const now = 1_700_000_000_000;
        const validFix = {
            lat: 48.137,
            lng: 11.576,
            accuracy: 40,
            timestamp: now,
            timestampIsDevice: true
        };

        it('accepts a recent device fix at the accuracy threshold', () => {
            expect(hasReliableGpsFix(validFix, now)).toBe(true);
        });

        it('rejects inaccurate, stale, future, or synthetic-time fixes', () => {
            expect(hasReliableGpsFix({ ...validFix, accuracy: 40.1 }, now)).toBe(false);
            expect(hasReliableGpsFix({ ...validFix, timestamp: now - 20_001 }, now)).toBe(false);
            expect(hasReliableGpsFix({ ...validFix, timestamp: now + 1 }, now)).toBe(false);
            expect(hasReliableGpsFix({ ...validFix, timestampIsDevice: false }, now)).toBe(false);
        });

        it('rejects missing or invalid coordinates and accuracy', () => {
            expect(hasReliableGpsFix(null, now)).toBe(false);
            expect(hasReliableGpsFix({ ...validFix, lat: NaN }, now)).toBe(false);
            expect(hasReliableGpsFix({ ...validFix, accuracy: undefined }, now)).toBe(false);
        });
    });

    describe('calculateOffsetPosition', () => {
        it('should return original position if bearing is null', () => {
            const result = calculateOffsetPosition(48.137, 11.576, 3, null);
            expect(result.lat).toBe(48.137);
            expect(result.lng).toBe(11.576);
            expect(result.offsetApplied).toBe(false);
        });

        it('should calculate a new position if bearing is provided', () => {
            // Moving North (0 degrees) from equator
            const startLat = 0;
            const startLng = 0;
            const distance = 111320; // approx 1 degree latitude in meters
            const bearing = 0;

            const result = calculateOffsetPosition(startLat, startLng, distance, bearing);

            expect(result.offsetApplied).toBe(true);
            expect(result.lat).toBeCloseTo(1.0, 1); // Should be approx 1 degree North
            expect(result.lng).toBeCloseTo(0, 5); // Longitude should stick to 0
        });

        it('should return object with original coordinates preserved', () => {
            const result = calculateOffsetPosition(50.0, 10.0, 5, 90);
            expect(result.originalLat).toBe(50.0);
            expect(result.originalLng).toBe(10.0);
            expect(result.headingUsed).toBe(90);
        });
    });
});
