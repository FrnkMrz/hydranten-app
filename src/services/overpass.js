// src/services/overpass.js
import { regionalData } from './regional-data.js';


// Liste bekannter, stabiler Overpass-Instanzen
const SERVERS = [
    'https://overpass-api.de/api/interpreter',       // Hauptserver (DE)
    'https://overpass.kumi.systems/api/interpreter', // Starker Backup
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter' // Weiterer Backup
];

// Reuse recently loaded map areas while the user pans around. This keeps small
// map movements from issuing another Overpass request for the same data.
const AREA_CACHE_TTL_MS = 3 * 60 * 1000;
const AREA_CACHE_LIMIT = 12;
const areaCache = [];

function boundsToBox(bounds) {
    return {
        south: bounds.getSouth(),
        west: bounds.getWest(),
        north: bounds.getNorth(),
        east: bounds.getEast()
    };
}

function containsBox(outer, inner) {
    return outer.south <= inner.south && outer.west <= inner.west &&
        outer.north >= inner.north && outer.east >= inner.east;
}

function boxContainsPoint(box, node) {
    return node.lat >= box.south && node.lat <= box.north &&
        node.lon >= box.west && node.lon <= box.east;
}

function getCachedArea(box) {
    const now = Date.now();
    const index = areaCache.findIndex(entry =>
        now - entry.timestamp <= AREA_CACHE_TTL_MS && containsBox(entry.box, box)
    );
    if (index < 0) return null;

    const [entry] = areaCache.splice(index, 1);
    areaCache.unshift(entry);
    const cachedNodes = entry.nodes.map(node => ({ ...node, tags: { ...node.tags } }));
    cachedNodes.dataSource = entry.dataSource;
    return cachedNodes;
}

function cacheArea(box, nodes) {
    areaCache.unshift({ box, nodes, dataSource: nodes.dataSource, timestamp: Date.now() });
    if (areaCache.length > AREA_CACHE_LIMIT) areaCache.length = AREA_CACHE_LIMIT;
}

function updateCachedNode(updatedNode) {
    for (const entry of areaCache) {
        const index = entry.nodes.findIndex(node => String(node.id) === String(updatedNode.id));
        if (!boxContainsPoint(entry.box, updatedNode)) {
            if (index >= 0) entry.nodes.splice(index, 1);
            continue;
        }

        const previousNode = index >= 0 ? entry.nodes[index] : {};
        const numericId = Number(updatedNode.id);
        const node = {
            ...previousNode,
            ...updatedNode,
            id: previousNode.id ?? (Number.isSafeInteger(numericId) ? numericId : updatedNode.id),
            type: 'node',
            tags: { ...updatedNode.tags }
        };

        if (index >= 0) entry.nodes[index] = node;
        else entry.nodes.push(node);
    }
}

function clearAreaCache() {
    areaCache.length = 0;
}

/**
 * Versucht eine Query auf mehreren Servern nacheinander auszuführen
 */
function createAbortError() {
    const error = new Error('Overpass request aborted');
    error.name = 'AbortError';
    return error;
}

async function fetchWithFallback(query, attempt = 0, externalSignal = null) {
    if (externalSignal?.aborted) {
        throw createAbortError();
    }

    if (attempt >= SERVERS.length) {
        throw new Error("Alle Overpass-Server sind nicht erreichbar.");
    }

    const server = SERVERS[attempt];
    // Timeout etwas reduziert pro Request für schnelleren Wechsel
    const controller = new AbortController();
    const abortFromExternalSignal = () => controller.abort();
    externalSignal?.addEventListener('abort', abortFromExternalSignal, { once: true });
    const timeoutId = setTimeout(() => controller.abort(), 25000); // Global fetch timeout

    try {
        // console.log(`Versuche Server ${attempt + 1}/${SERVERS.length}: ${server}`);

        const response = await fetch(server, {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`,
            signal: controller.signal
        });

        if (response.status === 429) {
            // Rate Limit: Kurz warten und nächsten Server probieren
            // console.warn("Rate Limit (429). Warte kurz...");
            await new Promise(r => setTimeout(r, 2000));
            return fetchWithFallback(query, attempt + 1, externalSignal);
        }

        if (!response.ok) {
            if (response.status === 400) {
                const error = new Error('Bad Request (400)');
                error.retryable = false;
                throw error; // A malformed query will fail the same way on every server.
            }
            // Other HTTP errors may come from an instance-specific policy or endpoint issue.
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();

    } catch (err) {
        if (externalSignal?.aborted) {
            throw createAbortError();
        }
        if (err?.retryable === false) throw err;

        // console.warn(`Server ${server} fehlgeschlagen:`, err.message);
        // Rekursiver Aufruf des nächsten Servers
        return fetchWithFallback(query, attempt + 1, externalSignal);
    } finally {
        clearTimeout(timeoutId);
        externalSignal?.removeEventListener('abort', abortFromExternalSignal);
    }
}

export const overpass = {
    updateCachedNode,
    clearCache: clearAreaCache,

    async fetchHydrants(bounds, { signal, zoom } = {}) {
        if (signal?.aborted) throw createAbortError();

        // Query Optimierung: Timeout im Overpass QL selbst setzen
        // [timeout:25] damit der Server selbst abbricht, bevor unser Fetch-Timeout greift
        const s = bounds.getSouth();
        const n = bounds.getNorth();
        const w = bounds.getWest();
        const e = bounds.getEast();

        const box = boundsToBox(bounds);
        const cachedNodes = getCachedArea(box);
        if (cachedNodes) return cachedNodes;

        const queryFor = (newerThan = null) => `
            [out:json][timeout:25];
            node["emergency"~"fire_hydrant|water_tank|suction_point|defibrillator"](${s},${w},${n},${e})${newerThan ? `(newer:"${newerThan}")` : ''}->.n;
            .n out body;
            way(bn.n);
            out skel;
        `;

        const normalizeElements = data => {
            const nodes = [];
            const lockedNodeIds = new Set();
            (data.elements || []).forEach(el => {
                if (el.type === 'node') nodes.push(el);
                else if (el.type === 'way' && el.nodes) el.nodes.forEach(nid => lockedNodeIds.add(nid));
            });
            return nodes.map(node => {
                if (lockedNodeIds.has(node.id)) node._isPartOfWay = true;
                return node;
            });
        };

        let regionalNodes = null;
        try {
            regionalNodes = await regionalData.fetchRegionalNodes(bounds, { signal, zoom });
        } catch (error) {
            if (error?.name === 'AbortError' || signal?.aborted) throw createAbortError();
            console.warn('Regionale Kartendaten nicht verfügbar; wechsle auf Overpass:', error?.message || error);
        }

        let normalizedNodes;
        if (regionalNodes) {
            normalizedNodes = regionalNodes;
            const osmDataUntil = regionalNodes.dataSource?.osmDataUntil;
            if (osmDataUntil) {
                try {
                    const delta = normalizeElements(await fetchWithFallback(queryFor(osmDataUntil), 0, signal));
                    const merged = new Map(regionalNodes.map(node => [`${node.type}:${node.id}`, node]));
                    delta.forEach(node => merged.set(`${node.type}:${node.id}`, node));
                    normalizedNodes = Array.from(merged.values());
                    normalizedNodes.dataSource = { ...regionalNodes.dataSource, liveDelta: true };
                } catch (error) {
                    if (error?.name === 'AbortError' || signal?.aborted) throw createAbortError();
                    console.warn('Overpass-Abgleich nicht verfügbar; verwende den regionalen Datenstand:', error?.message || error);
                    normalizedNodes.dataSource = { ...regionalNodes.dataSource, liveDelta: false };
                }
            } else {
                normalizedNodes.dataSource = { ...regionalNodes.dataSource, liveDelta: false };
            }
        } else {
            normalizedNodes = normalizeElements(await fetchWithFallback(queryFor(), 0, signal));
        }

        cacheArea(box, normalizedNodes);
        return normalizedNodes;


    }
};
