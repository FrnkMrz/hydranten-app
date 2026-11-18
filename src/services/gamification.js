/**
 * Service for Gamification / User Stats
 * Ranks based on Bavarian Fire Brigade (Freiwillige Feuerwehr Bayern)
 */

export const RANKS = [
    { id: 'fwa', name: 'Feuerwehranwärter', min: 0, abbr: 'FwA' },
    { id: 'fm', name: 'Feuerwehrmann', min: 10, abbr: 'FM' },
    { id: 'ofm', name: 'Oberfeuerwehrmann', min: 50, abbr: 'OFM' },
    { id: 'hfm', name: 'Hauptfeuerwehrmann', min: 100, abbr: 'HFM' },
    { id: 'lm', name: 'Löschmeister', min: 200, abbr: 'LM' },
    { id: 'olm', name: 'Oberlöschmeister', min: 400, abbr: 'OLM' },
    { id: 'hlm', name: 'Hauptlöschmeister', min: 600, abbr: 'HLM' },
    { id: 'bm', name: 'Brandmeister', min: 1000, abbr: 'BM' },
    { id: 'obm', name: 'Oberbrandmeister', min: 2500, abbr: 'OBM' },
    { id: 'hbm', name: 'Hauptbrandmeister', min: 5000, abbr: 'HBM' },
    { id: 'kdt', name: 'Kommandant', min: 10000, abbr: 'Kdt' },
    { id: 'kbm', name: 'Kreisbrandmeister', min: 25000, abbr: 'KBM' },
    { id: 'kbi', name: 'Kreisbrandinspektor', min: 50000, abbr: 'KBI' },
    { id: 'kbr', name: 'Kreisbrandrat', min: 100000, abbr: 'KBR' }
];

export function getRank(count) {
    // Find the highest rank where min <= count
    let current = RANKS[0];
    let next = RANKS[1];

    for (let i = 0; i < RANKS.length; i++) {
        if (count >= RANKS[i].min) {
            current = RANKS[i];
            next = RANKS[i + 1] || null;
        } else {
            break;
        }
    }

    return {
        current,
        next,
        progress: next ? (count - current.min) / (next.min - current.min) : 1.0,
        needed: next ? next.min - count : 0
    };
}

// Same public instances the map uses. The count query is global (no bounding
// box), so it is slow on a busy server and has to survive one of them failing.
const COUNT_SERVERS = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://z.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
];
const COUNT_REQUEST_TIMEOUT_MS = 50000;
const COUNT_CACHE_TTL_MS = 60 * 60 * 1000;
// Overpass answers "at capacity" with 429/502/503/504 and asks clients to back off.
const BUSY_STATUSES = new Set([429, 502, 503, 504]);
const BUSY_RETRY_DELAY_MS = 4000;

class OverpassBusyError extends Error {}

const cacheKeys = username => ({
    count: `hydrant_count_${username}`,
    time: `hydrant_count_ts_${username}`
});

/**
 * Last stored count for a user, even if it is older than the cache lifetime.
 * Returns `{ count, fresh }` or `null` when nothing usable is stored.
 */
export function getCachedHydrantCount(username) {
    if (!username) return null;
    try {
        const keys = cacheKeys(username);
        const count = parseInt(localStorage.getItem(keys.count), 10);
        if (!Number.isSafeInteger(count) || count < 0) return null;
        const ts = parseInt(localStorage.getItem(keys.time), 10);
        const fresh = Number.isFinite(ts) && (Date.now() - ts) < COUNT_CACHE_TTL_MS;
        return { count, fresh };
    } catch (_e) {
        return null;
    }
}

/** Asks one Overpass server for the count. Throws unless it returns a real number. */
async function requestHydrantCount(server, query) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), COUNT_REQUEST_TIMEOUT_MS);
    try {
        const res = await fetch(server, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            body: new URLSearchParams({ data: query }).toString(),
            signal: controller.signal
        });
        if (!res.ok) {
            const ErrorType = BUSY_STATUSES.has(res.status) ? OverpassBusyError : Error;
            throw new ErrorType("Overpass Error " + res.status);
        }

        const data = await res.json();
        // Overpass reports timeouts and overload as HTTP 200 with a "remark" and
        // no usable count. That must never be read as "0 hydrants".
        if (typeof data.remark === 'string' && /error|timed out|runtime/i.test(data.remark)) {
            throw new Error("Overpass remark: " + data.remark);
        }

        // "out count" returns one element: { type: "count", tags: { nodes: "123", ... } }
        const stats = Array.isArray(data.elements)
            ? data.elements.find(e => e.tags && e.tags.nodes !== undefined)
            : null;
        const parsed = stats ? parseInt(stats.tags.nodes, 10) : NaN;
        if (!Number.isSafeInteger(parsed) || parsed < 0) {
            throw new Error("Overpass returned no count");
        }
        return parsed;
    } finally {
        clearTimeout(timer);
    }
}

// One running request per user. Settings asks twice on open (cached name, then
// the verified one); both must share the answer instead of loading Overpass twice.
const inFlight = new Map();

/**
 * Fetch hydrant count for a user from Overpass API.
 * Caches the result for 1 hour to avoid spamming the API.
 *
 * Returns `null` when the count is unknown (every server failed and nothing
 * is cached). Callers must not treat that as zero: showing the lowest rank to
 * someone with many hydrants is worse than showing no rank for a moment.
 */
export function fetchUserHydrantCount(username) {
    if (!username) return Promise.resolve(null);

    const cached = getCachedHydrantCount(username);
    if (cached?.fresh) return Promise.resolve(cached.count);

    if (!inFlight.has(username)) {
        const request = queryHydrantCount(username)
            .then(count => count ?? getCachedHydrantCount(username)?.count ?? null)
            .finally(() => inFlight.delete(username));
        inFlight.set(username, request);
    }
    return inFlight.get(username);
}

async function queryHydrantCount(username) {
    // Escape the display name so quotes/backslashes cannot alter the query.
    const user = String(username).replace(/[\\"]/g, '\\$&').replace(/[\r\n]/g, ' ');
    const query = `[out:json][timeout:45];
    (
      node(user:"${user}")["emergency"="fire_hydrant"];
      node(user:"${user}")["emergency"="suction_point"];
      node(user:"${user}")["emergency"="water_tank"];
    );
    out count;`;

    // A second round only when a server said it is busy: that is temporary,
    // while a broken answer would just fail again.
    for (let round = 0; round < 2; round++) {
        let busy = false;
        for (const server of COUNT_SERVERS) {
            try {
                const count = await requestHydrantCount(server, query);
                try {
                    const keys = cacheKeys(username);
                    localStorage.setItem(keys.count, count);
                    localStorage.setItem(keys.time, Date.now());
                } catch (_e) { /* storage full: the count is still valid */ }
                return count;
            } catch (err) {
                if (err instanceof OverpassBusyError) busy = true;
                console.warn("Hydrant count failed on", server, err?.message || err);
            }
        }
        if (!busy) break;
        if (round === 0) await new Promise(resolve => setTimeout(resolve, BUSY_RETRY_DELAY_MS));
    }
    return null;
}
