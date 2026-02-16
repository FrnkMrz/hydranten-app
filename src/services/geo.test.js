import { describe, it, expect } from 'vitest';
import { calculateOffsetPosition } from './geo';

describe('geo service', () => {
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
