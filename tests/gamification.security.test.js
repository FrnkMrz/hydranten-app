import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchUserHydrantCount, getCachedHydrantCount } from '../src/services/gamification.js';

const countResponse = nodes => ({
    ok: true,
    json: async () => ({ elements: [{ type: 'count', id: 0, tags: { nodes: String(nodes), total: String(nodes) } }] })
});
const sentQuery = call => new URLSearchParams(call[1].body).get('data');

describe('gamification Overpass query', () => {
    beforeEach(() => {
        localStorage.clear();
        global.fetch = vi.fn();
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    it('escapes the OSM display name inside the query', async () => {
        fetch.mockResolvedValueOnce(countResponse(7));

        const count = await fetchUserHydrantCount('a"); node(1); out; //\\');

        const query = sentQuery(fetch.mock.calls[0]);
        expect(count).toBe(7);
        expect(query).toContain('node(user:"a\\"); node(1); out; //\\\\")');
        expect(query).not.toContain('user:"a")');
    });

    it('sends the query form-encoded like the map client', async () => {
        fetch.mockResolvedValueOnce(countResponse(83));

        expect(await fetchUserHydrantCount('tester')).toBe(83);
        expect(fetch.mock.calls[0][1].headers['Content-Type']).toContain('application/x-www-form-urlencoded');
        expect(sentQuery(fetch.mock.calls[0])).toContain('node(user:"tester")["emergency"="fire_hydrant"]');
    });

    it('accepts a real zero', async () => {
        fetch.mockResolvedValueOnce(countResponse(0));

        expect(await fetchUserHydrantCount('newbie')).toBe(0);
        expect(localStorage.getItem('hydrant_count_newbie')).toBe('0');
    });

    it('falls back to the next server instead of reporting zero', async () => {
        fetch.mockResolvedValueOnce({ ok: false, status: 504 });
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ elements: [], remark: 'runtime error: Query timed out in "query" at line 3' }) });
        fetch.mockResolvedValueOnce(countResponse(83));

        expect(await fetchUserHydrantCount('tester')).toBe(83);
        expect(fetch).toHaveBeenCalledTimes(3);
        expect(new Set(fetch.mock.calls.map(call => call[0])).size).toBe(3);
    });

    it('returns null and caches nothing when every server fails', async () => {
        fetch.mockResolvedValue({ ok: true, json: async () => ({ elements: [{ tags: { nodes: 'lots' } }] }) });

        expect(await fetchUserHydrantCount('tester')).toBeNull();
        expect(localStorage.getItem('hydrant_count_tester')).toBeNull();
    });

    it('keeps an expired cached count when the servers are down', async () => {
        localStorage.setItem('hydrant_count_tester', '83');
        localStorage.setItem('hydrant_count_ts_tester', String(Date.now() - 2 * 60 * 60 * 1000));
        fetch.mockRejectedValue(new Error('network'));

        expect(await fetchUserHydrantCount('tester')).toBe(83);
    });

    it('shares one request when the rank is asked for twice at once', async () => {
        let answer;
        fetch.mockReturnValueOnce(new Promise(resolve => { answer = resolve; }));

        const first = fetchUserHydrantCount('tester');
        const second = fetchUserHydrantCount('tester');
        answer(countResponse(42));

        expect(await first).toBe(42);
        expect(await second).toBe(42);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('tries every server again once when they report being busy', async () => {
        vi.useFakeTimers();
        try {
            for (let i = 0; i < 4; i++) fetch.mockResolvedValueOnce({ ok: false, status: 502 });
            fetch.mockResolvedValueOnce(countResponse(12));

            const pending = fetchUserHydrantCount('tester');
            await vi.runAllTimersAsync();

            expect(await pending).toBe(12);
            expect(fetch).toHaveBeenCalledTimes(5);
        } finally {
            vi.useRealTimers();
        }
    });

    it('does not retry when the answers are broken rather than busy', async () => {
        fetch.mockResolvedValue({ ok: false, status: 500 });

        expect(await fetchUserHydrantCount('tester')).toBeNull();
        expect(fetch).toHaveBeenCalledTimes(4);
    });

    it('reports a stored count as stale once it is older than an hour', () => {
        localStorage.setItem('hydrant_count_tester', '83');
        localStorage.setItem('hydrant_count_ts_tester', String(Date.now() - 2 * 60 * 60 * 1000));

        expect(getCachedHydrantCount('tester')).toEqual({ count: 83, fresh: false });
        expect(getCachedHydrantCount('nobody')).toBeNull();
    });
});
