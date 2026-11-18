// src/services/overpass.js
import { regionalData } from './regional-data.js';


// Aktuelle Endpunktliste wie in OpenFireMap. mail.ru wurde durch die
// offiziellen Overpass.de-Instanzen lz4/z ergänzt.
const SERVERS = [
    'https://overpass-api.de/api/interpreter',       // Hauptserver (DE)
    'https://lz4.overpass-api.de/api/interpreter',   // Overpass.de-Replik
    'https://z.overpass-api.de/api/interpreter',     // Overpass.de-Replik
    'https://overpass.kumi.systems/api/interpreter'  // unabhängiger Backup
];
const OVERPASS_REQUEST_TIMEOUT_MS = 12_000;
const OVERPASS_DELTA_BUDGET_MS = 15_000;
const OVERPASS_FALLBACK_BUDGET_MS = 30_000;
const OVERPASS_QUERY_TIMEOUT_SECONDS = 25;
const SERVER_COOLDOWN_MS = 30_000;
const SERVER_RATE_LIMIT_COOLDOWN_MS = 90_000;
const serverCooldowns = new Map();

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
            _isPendingLocalEdit: true,
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

async function fetchWithFallback(query, { signal, timeoutBudgetMs = OVERPASS_FALLBACK_BUDGET_MS } = {}) {
    if (signal?.aborted) throw createAbortError();

    const deadline = Date.now() + timeoutBudgetMs;
    const now = Date.now();
    const healthyServers = SERVERS.filter(server => (serverCooldowns.get(server) || 0) <= now);
    for (let i = healthyServers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [healthyServers[i], healthyServers[j]] = [healthyServers[j], healthyServers[i]];
    }
    const coolingServers = SERVERS
        .filter(server => (serverCooldowns.get(server) || 0) > now)
        .sort((a, b) => serverCooldowns.get(a) - serverCooldowns.get(b));
    const orderedServers = [...healthyServers, ...coolingServers];
    let lastError = null;

    for (const server of orderedServers) {
        if (signal?.aborted) throw createAbortError();
        const remainingMs = deadline - Date.now();
        if (remainingMs <= 0) break;

        const controller = new AbortController();
        const abortFromExternalSignal = () => controller.abort();
        signal?.addEventListener('abort', abortFromExternalSignal, { once: true });
        const requestTimeoutMs = Math.min(OVERPASS_REQUEST_TIMEOUT_MS, remainingMs);
        const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

        try {
            const response = await fetch(server, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                body: new URLSearchParams({ data: query }).toString(),
                signal: controller.signal
            });

            if (response.status === 429) {
                serverCooldowns.set(server, Date.now() + SERVER_RATE_LIMIT_COOLDOWN_MS);
                lastError = new Error('HTTP 429');
                continue;
            }
            if (!response.ok) {
                if (response.status === 400) {
                    const error = new Error('Bad Request (400)');
                    error.retryable = false;
                    throw error;
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            serverCooldowns.delete(server);
            return data;
        } catch (error) {
            if (signal?.aborted) throw createAbortError();
            if (error?.retryable === false) throw error;
            serverCooldowns.set(server, Date.now() + SERVER_COOLDOWN_MS);
            lastError = error;
        } finally {
            clearTimeout(timeoutId);
            signal?.removeEventListener('abort', abortFromExternalSignal);
        }
    }

    const error = new Error('Alle Overpass-Server sind nicht erreichbar.');
    if (lastError) error.cause = lastError;
    throw error;
}

export const overpass = {
    updateCachedNode,
    clearCache: clearAreaCache,

    async fetchHydrants(bounds, { signal, zoom, onRegionalData } = {}) {
        if (signal?.aborted) throw createAbortError();

        // Serverseitiges Query-Limit wie in OpenFireMap; Client-Timeouts sind
        // kürzer und begrenzen die Wartezeit bis zum nächsten Endpunkt.
        const s = bounds.getSouth();
        const n = bounds.getNorth();
        const w = bounds.getWest();
        const e = bounds.getEast();

        const box = boundsToBox(bounds);
        const cachedNodes = getCachedArea(box);
        if (cachedNodes) return cachedNodes;

        const queryFor = (newerThan = null) => `
            [out:json][timeout:${OVERPASS_QUERY_TIMEOUT_SECONDS}];
            node["emergency"~"fire_hydrant|water_tank|suction_point|defibrillator"](${s},${w},${n},${e})${newerThan ? `(newer:"${newerThan}")` : ''}->.n;
            .n out meta;
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
            // Paint the fast regional snapshot before asking Overpass for newer nodes.
            // A slow live delta must not keep an already available map off screen.
            if (!signal?.aborted && typeof onRegionalData === 'function') {
                try {
                    onRegionalData(regionalNodes);
                } catch (error) {
                    console.warn('Regionale Kartendaten konnten nicht sofort angezeigt werden:', error?.message || error);
                }
            }

            normalizedNodes = regionalNodes;
            const osmDataUntil = regionalNodes.dataSource?.osmDataUntil;
            if (osmDataUntil) {
                try {
                    const delta = normalizeElements(await fetchWithFallback(queryFor(osmDataUntil), {
                        signal,
                        timeoutBudgetMs: OVERPASS_DELTA_BUDGET_MS
                    }));
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
            normalizedNodes = normalizeElements(await fetchWithFallback(queryFor(), {
                signal,
                timeoutBudgetMs: OVERPASS_FALLBACK_BUDGET_MS
            }));
        }

        cacheArea(box, normalizedNodes);
        return normalizedNodes;


    }
};
