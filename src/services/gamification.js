/**
 * Service for Gamification / User Stats
 * Ranks based on Bavarian Fire Brigade (Freiwillige Feuerwehr Bayern)
 */

const RANKS = [
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
    { id: 'kbr', name: 'Kreisbrandrat', min: 10000, abbr: 'KBR' }
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

/**
 * Fetch hydrant count for a user from Overpass API
 * Caches result for 1 hour to avoid spamming the API
 */
export async function fetchUserHydrantCount(username) {
    if (!username) return 0;

    const CACHE_KEY = `hydrant_count_${username}`;
    const CACHE_TIME_KEY = `hydrant_count_ts_${username}`;

    // Check Cache (1 Hour)
    const cached = localStorage.getItem(CACHE_KEY);
    const ts = localStorage.getItem(CACHE_TIME_KEY);
    const now = Date.now();

    if (cached && ts && (now - parseInt(ts)) < 3600000) { // 1h in ms
        console.log("Using cached hydrant count:", cached);
        return parseInt(cached);
    }

    // Fetch from Overpass
    console.log("Fetching hydrant count from Overpass for:", username);
    const query = `[out:json][timeout:25];
    node(user:"${username}")["emergency"="fire_hydrant"];
    out count;`;

    try {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query
        });

        if (!res.ok) throw new Error("Overpass Error " + res.status);

        const data = await res.json();
        // Overpass "out count" returns an element with "tags": { "nodes": "123", ... }
        // Or sometimes in the elements array depending on format. 
        // Usually: elements[0].tags.nodes (as string)

        let count = 0;
        if (data.elements && data.elements.length > 0) {
            // Look for the counting element
            const stats = data.elements.find(e => e.tags && e.tags.nodes);
            if (stats) {
                count = parseInt(stats.tags.nodes);
            }
            // Fallback: If query returned actual nodes (shouldn't with 'out count'), count length
            // But 'out count' structure is specific.
            // Direct 'out count' returns a single element with id:0 and tags.
        }

        // Cache it
        localStorage.setItem(CACHE_KEY, count);
        localStorage.setItem(CACHE_TIME_KEY, now);

        return count;
    } catch (err) {
        console.error("Failed to fetch stats:", err);
        return cached ? parseInt(cached) : 0; // Fallback to cache if error, or 0
    }
}
