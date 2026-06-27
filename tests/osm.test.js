// tests/osm.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHydrant } from '../src/services/osm.js';
import * as Auth from '../src/services/auth.js';

global.fetch = vi.fn();

// Mock Auth wrapper to avoid real token logic
vi.spyOn(Auth, 'getAuthHeaderAsync').mockResolvedValue({ 'Authorization': 'Bearer test' });

describe('OSM Service - createHydrant', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('successfully creates a hydrant', async () => {
        // 1. Nominatim
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ address: { city: 'TestCity' } })
        });
        // 2. Changeset Create
        fetch.mockResolvedValueOnce({ ok: true, text: async () => '12345' });
        // 3. Node Create
        fetch.mockResolvedValueOnce({ ok: true, text: async () => '999' });
        // 4. Changeset Close
        fetch.mockResolvedValueOnce({ ok: true });

        const data = { lat: 50, lng: 10, tags: { emergency: 'fire_hydrant' } };
        const result = await createHydrant(data, () => { });

        expect(result).toEqual({ id: '999', changeset: '12345' });
    });

    it('handles changeset creation failure', async () => {
        // 1. Nominatim
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
        // 2. Changeset Fail
        fetch.mockResolvedValueOnce({ ok: false, status: 401, text: async () => 'Unauthorized' });

        const data = { lat: 50, lng: 10, tags: {} };
        await expect(createHydrant(data, () => { })).rejects.toThrow('CS Init Failed: 401');
    });

    it('closes the changeset when node creation fails', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ address: { city: 'TestCity' } })
        });
        fetch.mockResolvedValueOnce({ ok: true, text: async () => '12345' });
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            text: async () => 'Invalid node'
        });
        fetch.mockResolvedValueOnce({ ok: true });

        const data = { lat: 50, lng: 10, tags: { emergency: 'fire_hydrant' } };
        await expect(createHydrant(data, () => {})).rejects.toThrow('Node Create Failed: 400');

        expect(fetch).toHaveBeenLastCalledWith(
            'https://api.openstreetmap.org/api/0.6/changeset/12345/close',
            expect.objectContaining({ method: 'PUT' })
        );
    });
});
