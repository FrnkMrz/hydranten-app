// tests/overpass.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { overpass } from '../src/services/overpass.js';

// Mock Bounds Object
const mockBounds = {
    getSouth: () => 48.0,
    getNorth: () => 48.1,
    getWest: () => 11.0,
    getEast: () => 11.1
};

global.fetch = vi.fn();

describe('Overpass Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches hydrants successfully from first server', async () => {
        const mockData = {
            elements: [
                { type: 'node', id: 1, lat: 48.05, lon: 11.05, tags: { emergency: 'fire_hydrant' } }
            ]
        };

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockData
        });

        const nodes = await overpass.fetchHydrants(mockBounds);
        expect(nodes).toHaveLength(1);
        expect(nodes[0].id).toBe(1);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('fails over to second server on error', async () => {
        // 1. First server fails
        fetch.mockRejectedValueOnce(new Error("Network Error"));
        // 2. Second server succeeds
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ elements: [] })
        });

        await overpass.fetchHydrants(mockBounds);
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('throws error if all servers fail', async () => {
        // Mock all 3 servers failing
        fetch.mockRejectedValue(new Error("Down"));

        await expect(overpass.fetchHydrants(mockBounds)).rejects.toThrow("Alle Overpass-Server sind nicht erreichbar");
    });
});
