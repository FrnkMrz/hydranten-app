import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateFilename } from './photo-service';

// Mock version.js USER_AGENT constant
vi.mock('../version.js', () => ({
    USER_AGENT: 'HydrantenApp/Test'
}));

describe('photo-service', () => {
    describe('generateFilename', () => {

        beforeEach(() => {
            // Mock Global Fetch
            global.fetch = vi.fn();
            // Mock Date to ensure consistent timestamps
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2023-10-05T12:00:00Z'));
        });

        afterEach(() => {
            vi.restoreAllMocks();
            vi.useRealTimers();
        });

        it('should generate filename with city and street from API', async () => {
            // Mock Successful Response
            const mockResponse = {
                ok: true,
                json: async () => ({
                    address: {
                        city: 'Munich',
                        road: 'Marienplatz'
                    }
                })
            };
            global.fetch.mockResolvedValue(mockResponse);

            const location = { lat: 48.137, lng: 11.576 };
            const tags = { emergency: 'fire_hydrant' };

            // Adjust for timezone offset if necessary, but here we just check pattern
            // Note: getHours() depends on local timezone of test runner. 
            // We use simple regex matching to allow loose timestamp check.

            const filename = await generateFilename(location, tags);

            expect(filename).toMatch(/^Munich_Marienplatz_Hydrant_\d{6}\.jpg$/);
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it('should fallback to coordinates if API fails', async () => {
            // Mock Failed Response
            global.fetch.mockRejectedValue(new Error('Network Error'));

            const location = { lat: 48.1370, lng: 11.5760 };
            const filename = await generateFilename(location, {});

            // Hydrant_48_1370_11_5760_120000.jpg (Timestamp depends on timezone)
            expect(filename).toContain('Hydrant_48_1370_11_5760_');
            expect(filename).toMatch(/\.jpg$/);
        });

        it('should use special label for cisterns', async () => {
            // Mock Successful Response
            const mockResponse = {
                ok: true,
                json: async () => ({ address: { city: 'Berlin' } }) // No street
            };
            global.fetch.mockResolvedValue(mockResponse);

            const location = { lat: 52.0, lng: 13.0 };
            const tags = { emergency: 'water_tank' };

            const filename = await generateFilename(location, tags);

            expect(filename).toMatch(/^Berlin_Zisterne_\d{6}\.jpg$/);
        });
    });
});
