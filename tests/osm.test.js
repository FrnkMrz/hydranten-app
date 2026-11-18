// tests/osm.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHydrant, updateHydrant, deleteHydrant, fetchNodeData } from '../src/services/osm.js';
import * as Auth from '../src/services/auth.js';

global.fetch = vi.fn();

// Mock Auth wrapper to avoid real token logic
vi.spyOn(Auth, 'getAuthHeaderAsync').mockResolvedValue({ 'Authorization': 'Bearer test' });

describe('OSM Service - createHydrant', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
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

    it('stores a successful node edit for immediate map reconciliation', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ address: { city: 'TestCity' } }) });
        fetch.mockResolvedValueOnce({ ok: true, text: async () => '12345' });
        fetch.mockResolvedValueOnce({ ok: true, text: async () => '8' });
        fetch.mockResolvedValueOnce({ ok: true });

        await updateHydrant('777', '7', { emergency: 'defibrillator', access: 'yes' }, 50, 10, () => {});

        expect(JSON.parse(localStorage.getItem('updated_hydrants'))).toEqual([
            expect.objectContaining({
                id: '777', lat: 50, lon: 10,
                tags: { emergency: 'defibrillator', access: 'yes' },
                timestamp: expect.any(Number)
            })
        ]);
    });

    it('rejects a non-numeric changeset id returned by the API', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ address: {} }) });
        fetch.mockResolvedValueOnce({ ok: true, text: async () => '12345/../../user' });

        await expect(createHydrant({ lat: 50, lng: 10, tags: {} }, () => {}))
            .rejects.toThrow('Invalid OSM changeset id');
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('rejects invalid coordinates before any network request', async () => {
        for (const [lat, lng] of [[NaN, 10], [91, 10], [50, 181], [null, 10], ['', 10], ['50" x="', 10]]) {
            await expect(createHydrant({ lat, lng, tags: {} }, () => {})).rejects.toThrow('Invalid coordinates');
        }
        expect(fetch).not.toHaveBeenCalled();
    });

    it('rejects node ids and versions that are not plain integers', async () => {
        const badId = '1"/><tag k="x" v="y';
        await expect(updateHydrant(badId, '1', {}, 50, 10, () => {})).rejects.toThrow('Invalid OSM node id');
        await expect(updateHydrant('1', badId, {}, 50, 10, () => {})).rejects.toThrow('Invalid OSM node version');
        await expect(deleteHydrant('1/../2', '1', 50, 10, {}, () => {})).rejects.toThrow('Invalid OSM node id');
        await expect(fetchNodeData('1?x=')).rejects.toThrow('Invalid OSM node id');
        expect(fetch).not.toHaveBeenCalled();
    });

    it('emits log lines as level + text without HTML markup', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ address: { city: '<b>City</b>' }, display_name: '<img src=x>' }) });
        fetch.mockResolvedValueOnce({ ok: true, text: async () => '12345' });
        fetch.mockResolvedValueOnce({ ok: true, text: async () => '999' });
        fetch.mockResolvedValueOnce({ ok: true });

        const lines = [];
        await createHydrant({ lat: 50, lng: 10, tags: { emergency: 'fire_hydrant' } }, line => lines.push(line));

        expect(lines.length).toBeGreaterThan(0);
        for (const line of lines) {
            expect(line).toEqual(expect.objectContaining({ level: expect.any(String), text: expect.any(String) }));
            expect(line.text).not.toMatch(/<span|<br/);
        }
    });

    it('stores deleted ids as strings so the map filter matches them', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ address: {} }) });
        fetch.mockResolvedValueOnce({ ok: true, text: async () => '12345' });
        fetch.mockResolvedValueOnce({ ok: true, text: async () => '4' });
        fetch.mockResolvedValueOnce({ ok: true });

        await deleteHydrant(777, 3, 50, 10, {}, () => {});

        expect(JSON.parse(localStorage.getItem('deleted_hydrants'))).toEqual(['777']);
    });
});
