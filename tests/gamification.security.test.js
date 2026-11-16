import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchUserHydrantCount } from '../src/services/gamification.js';

describe('gamification Overpass query', () => {
    beforeEach(() => {
        localStorage.clear();
        global.fetch = vi.fn();
    });

    it('escapes the OSM display name inside the query', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ elements: [{ tags: { nodes: '7' } }] }) });

        const count = await fetchUserHydrantCount('a"); node(1); out; //\\');

        const query = fetch.mock.calls[0][1].body;
        expect(count).toBe(7);
        expect(query).toContain('node(user:"a\\"); node(1); out; //\\\\")');
        expect(query).not.toContain('user:"a")');
    });

    it('ignores a malformed count instead of caching NaN', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ elements: [{ tags: { nodes: 'lots' } }] }) });

        expect(await fetchUserHydrantCount('tester')).toBe(0);
    });
});
