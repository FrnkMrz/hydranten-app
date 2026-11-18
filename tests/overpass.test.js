// tests/overpass.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { overpass } from '../src/services/overpass.js';
import { regionalData } from '../src/services/regional-data.js';

// Mock Bounds Object
let boundsOffset = 0;
const mockBounds = {
    getSouth: () => 40.0 + boundsOffset,
    getNorth: () => 40.1 + boundsOffset,
    getWest: () => -4.0 + boundsOffset,
    getEast: () => -3.9 + boundsOffset
};

function makeBounds(south, west, north, east) {
    return {
        getSouth: () => south,
        getWest: () => west,
        getNorth: () => north,
        getEast: () => east
    };
}

global.fetch = vi.fn();

describe('Overpass Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(regionalData, 'fetchRegionalNodes').mockResolvedValue(null);
        overpass.clearCache();
        // Each test uses a distinct area so the service's in-memory area cache
        // cannot reuse a previous test's mocked network response.
        boundsOffset += 0.2;
    });

    it('uses the regional base and merges the Overpass delta by OSM node id', async () => {
        regionalData.fetchRegionalNodes.mockResolvedValueOnce(Object.assign([
            { type: 'node', id: 7, lat: 40.05, lon: -3.95, tags: { emergency: 'fire_hydrant' } },
            { type: 'node', id: 8, lat: 40.06, lon: -3.94, tags: { emergency: 'fire_hydrant' } }
        ], { dataSource: { type: 'regional', osmDataUntil: '2026-10-14T20:21:00Z' } }));
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ elements: [
                { type: 'node', id: 7, lat: 40.05, lon: -3.95, tags: { emergency: 'defibrillator' } }
            ] })
        });

        const nodes = await overpass.fetchHydrants(mockBounds, { zoom: 15 });
        expect(nodes).toHaveLength(2);
        expect(nodes.find(node => node.id === 7).tags.emergency).toBe('defibrillator');
        expect(nodes.dataSource).toMatchObject({ type: 'regional', liveDelta: true });
        expect(fetch.mock.calls[0][1].body).toContain('newer%3A%222026-10-14T20%3A21%3A00Z%22');
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

    it('does not retry a malformed query rejected with HTTP 400', async () => {
        fetch.mockResolvedValueOnce({ ok: false, status: 400 });

        await expect(overpass.fetchHydrants(mockBounds)).rejects.toThrow('Bad Request (400)');
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('fails over when one instance rejects the request with HTTP 403', async () => {
        fetch.mockResolvedValueOnce({ ok: false, status: 403 });
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ elements: [] }) });

        await expect(overpass.fetchHydrants(mockBounds)).resolves.toEqual([]);
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('retries a temporary server error on the next instance', async () => {
        fetch.mockResolvedValueOnce({ ok: false, status: 503 });
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ elements: [] }) });

        await expect(overpass.fetchHydrants(mockBounds)).resolves.toEqual([]);
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('throws error if all servers fail', async () => {
        // Mock all 3 servers failing
        fetch.mockRejectedValue(new Error("Down"));

        await expect(overpass.fetchHydrants(mockBounds)).rejects.toThrow("Alle Overpass-Server sind nicht erreichbar");
    });

    it('updates cached nodes when an edited node moves between cached areas', async () => {
        const oldBounds = makeBounds(40, -4, 41, -3);
        const newBounds = makeBounds(42, 2, 43, 3);
        fetch
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    elements: [{
                        type: 'node', id: 42, lat: 40.5, lon: -3.5,
                        tags: { emergency: 'fire_hydrant' }
                    }]
                })
            })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ elements: [] }) });

        await overpass.fetchHydrants(oldBounds);
        await overpass.fetchHydrants(newBounds);
        overpass.updateCachedNode({
            id: '42', lat: 42.5, lon: 2.5,
            tags: { emergency: 'defibrillator', access: 'yes' }
        });

        await expect(overpass.fetchHydrants(oldBounds)).resolves.toEqual([]);
        await expect(overpass.fetchHydrants(newBounds)).resolves.toMatchObject([
            { id: 42, lat: 42.5, lon: 2.5, tags: { emergency: 'defibrillator', access: 'yes' } }
        ]);
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('does not try another server after the request is cancelled', async () => {
        fetch.mockImplementation((_url, { signal }) => new Promise((_, reject) => {
            signal.addEventListener('abort', () => {
                const error = new Error('Aborted');
                error.name = 'AbortError';
                reject(error);
            });
        }));

        const controller = new AbortController();
        const request = overpass.fetchHydrants(mockBounds, { signal: controller.signal });
        await Promise.resolve(); // Let the regional source decline before cancelling the Overpass request.
        controller.abort();

        await expect(request).rejects.toMatchObject({ name: 'AbortError' });
        expect(fetch).toHaveBeenCalledTimes(1);
    });
});
