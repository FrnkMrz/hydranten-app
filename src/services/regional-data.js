import { DACHLILU_COVERAGE } from '../data/dachlilu-coverage.js';

const BASE_URL = 'https://pipeline.openfiremap.org';
const PMTILES_FILE = 'openfiremap.pmtiles';
const METADATA_TTL_MS = 10 * 60 * 1000;
const MAX_TILE_CACHE_SIZE = 128;
const MAX_TILES_PER_VIEW = 300;
const TILE_LAYERS = ['hydrants', 'water_points', 'defibrillators'];

let metadata = null;
let metadataFetchedAt = 0;
let metadataPromise = null;
let pmtiles = null;
let pmtilesUrl = null;
let header = null;
let decoderModulesPromise = null;
let PMTilesClass = null;
let VectorTileClass = null;
let PbfReaderClass = null;
const tileCache = new Map();
const tileRequests = new Map();

function coordinates(bounds) {
    return {
        south: typeof bounds?.getSouth === 'function' ? bounds.getSouth() : bounds?.south,
        north: typeof bounds?.getNorth === 'function' ? bounds.getNorth() : bounds?.north,
        west: typeof bounds?.getWest === 'function' ? bounds.getWest() : bounds?.west,
        east: typeof bounds?.getEast === 'function' ? bounds.getEast() : bounds?.east
    };
}

function pointInPolygon(lat, lon, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [yi, xi] = polygon[i];
        const [yj, xj] = polygon[j];
        if (((yi > lat) !== (yj > lat)) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
            inside = !inside;
        }
    }
    return inside;
}

function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
    const cross = (x1, y1, x2, y2, x3, y3) => (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
    const onSegment = (px, py, x1, y1, x2, y2) =>
        px >= Math.min(x1, x2) && px <= Math.max(x1, x2) && py >= Math.min(y1, y2) && py <= Math.max(y1, y2);
    const c1 = cross(ax, ay, bx, by, cx, cy);
    const c2 = cross(ax, ay, bx, by, dx, dy);
    const c3 = cross(cx, cy, dx, dy, ax, ay);
    const c4 = cross(cx, cy, dx, dy, bx, by);
    if (((c1 > 0 && c2 < 0) || (c1 < 0 && c2 > 0)) && ((c3 > 0 && c4 < 0) || (c3 < 0 && c4 > 0))) return true;
    return (c1 === 0 && onSegment(cx, cy, ax, ay, bx, by)) ||
        (c2 === 0 && onSegment(dx, dy, ax, ay, bx, by)) ||
        (c3 === 0 && onSegment(ax, ay, cx, cy, dx, dy)) ||
        (c4 === 0 && onSegment(bx, by, cx, cy, dx, dy));
}

function rectangleInPolygon(box, polygon) {
    const corners = [[box.south, box.west], [box.north, box.west], [box.north, box.east], [box.south, box.east]];
    if (!corners.every(([lat, lon]) => pointInPolygon(lat, lon, polygon))) return false;
    const rectEdges = [
        [box.west, box.south, box.east, box.south], [box.west, box.north, box.east, box.north],
        [box.west, box.south, box.west, box.north], [box.east, box.south, box.east, box.north]
    ];
    for (let i = 0; i < polygon.length; i++) {
        const [lat1, lon1] = polygon[i];
        const [lat2, lon2] = polygon[(i + 1) % polygon.length];
        if (Math.max(lat1, lat2) < box.south || Math.min(lat1, lat2) > box.north ||
            Math.max(lon1, lon2) < box.west || Math.min(lon1, lon2) > box.east) continue;
        if (rectEdges.some(([x1, y1, x2, y2]) => segmentsIntersect(lon1, lat1, lon2, lat2, x1, y1, x2, y2))) return false;
    }
    return true;
}

export function isRegionalCoverage(bounds) {
    const box = coordinates(bounds);
    if (Object.values(box).some(value => !Number.isFinite(value))) return false;
    return DACHLILU_COVERAGE.some(polygon => rectangleInPolygon(box, polygon));
}

async function fetchMetadata(signal) {
    if (signal?.aborted) throw abortError();
    const now = Date.now();
    if (metadata && now - metadataFetchedAt < METADATA_TTL_MS) return metadata;
    if (metadataPromise) return metadataPromise;

    metadataPromise = (async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const abort = () => controller.abort();
        signal?.addEventListener('abort', abort, { once: true });
        try {
            const response = await fetch(`${BASE_URL}/metadata.json`, { cache: 'no-cache', signal: controller.signal });
            if (!response.ok) throw new Error(`Regional-Metadaten: HTTP ${response.status}`);
            const data = await response.json();
            const generatedAt = typeof data?.generated_at === 'string' ? data.generated_at : null;
            const osmDataUntil = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(data?.osm_data_until ?? '') ? data.osm_data_until : null;
            if (!generatedAt) throw new Error('Regional-Metadaten enthalten keine Build-Version.');
            if (metadata?.generatedAt !== generatedAt) {
                pmtiles = null;
                pmtilesUrl = null;
                header = null;
                tileCache.clear();
            }
            metadata = { generatedAt, osmDataUntil };
            metadataFetchedAt = Date.now();
            return metadata;
        } catch (error) {
            if (signal?.aborted) throw abortError();
            if (controller.signal.aborted) throw new Error('Regional metadata request timed out.', { cause: error });
            throw error;
        } finally {
            clearTimeout(timeout);
            signal?.removeEventListener('abort', abort);
            metadataPromise = null;
        }
    })();
    return metadataPromise;
}

async function loadDecoderModules() {
    if (!decoderModulesPromise) {
        decoderModulesPromise = Promise.all([
            import('pmtiles'), import('@mapbox/vector-tile'), import('pbf')
        ]).then(([pmtilesModule, vectorTileModule, pbfModule]) => {
            PMTilesClass = pmtilesModule.PMTiles;
            VectorTileClass = vectorTileModule.VectorTile;
            PbfReaderClass = pbfModule.PbfReader;
        }).catch(error => {
            decoderModulesPromise = null;
            throw error;
        });
    }
    return decoderModulesPromise;
}

function getPmtiles(meta) {
    const url = `${BASE_URL}/${PMTILES_FILE}?v=${encodeURIComponent(meta.generatedAt)}`;
    if (!pmtiles || pmtilesUrl !== url) {
        pmtiles = new PMTilesClass(url);
        pmtilesUrl = url;
        header = null;
    }
    return pmtiles;
}

function lonToTile(lon, z) { return Math.floor((lon + 180) / 360 * 2 ** z); }
function latToTile(lat, z) {
    const rad = Math.max(-85.0511, Math.min(85.0511, lat)) * Math.PI / 180;
    return Math.floor((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * 2 ** z);
}

async function getTile(source, z, x, y, signal) {
    const key = `${metadata.generatedAt}/${z}/${x}/${y}`;
    if (tileCache.has(key)) return tileCache.get(key);
    if (signal?.aborted) throw abortError();
    if (!tileRequests.has(key)) {
        const request = source.getZxy(z, x, y, signal).then(response => {
            if (!response?.data) return null;
            const decoded = new VectorTileClass(new PbfReaderClass(new Uint8Array(response.data)));
            tileCache.set(key, decoded);
            if (tileCache.size > MAX_TILE_CACHE_SIZE) tileCache.delete(tileCache.keys().next().value);
            return decoded;
        }).finally(() => tileRequests.delete(key));
        tileRequests.set(key, request);
    }
    return raceAbort(tileRequests.get(key), signal);
}

function raceAbort(promise, signal) {
    if (!signal) return promise;
    if (signal.aborted) return Promise.reject(abortError());
    return new Promise((resolve, reject) => {
        const onAbort = () => reject(abortError());
        signal.addEventListener('abort', onAbort, { once: true });
        promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
    });
}

function abortError() {
    const error = new Error('Regional data request aborted');
    error.name = 'AbortError';
    return error;
}

function featureToNode(feature, x, y, z, bounds) {
    const geojson = feature.toGeoJSON(x, y, z);
    if (geojson.geometry?.type !== 'Point') return null;
    const [lon, lat] = geojson.geometry.coordinates;
    const box = coordinates(bounds);
    if (lat < box.south || lat > box.north || lon < box.west || lon > box.east) return null;
    const props = geojson.properties || {};
    if (props['@type'] !== 'node' || props['@id'] == null) return null;
    const tags = { ...props };
    delete tags['@type'];
    delete tags['@id'];
    const id = Number(props['@id']);
    if (!Number.isSafeInteger(id)) return null;
    return { id, type: 'node', lat, lon, tags };
}

async function fetchRegionalNodes(bounds, { signal, zoom = 14 } = {}) {
    if (!isRegionalCoverage(bounds) || zoom < 12) return null;
    const meta = await fetchMetadata(signal);
    await loadDecoderModules();
    const source = getPmtiles(meta);
    if (!header) header = await raceAbort(source.getHeader(), signal);
    const box = coordinates(bounds);
    const withinHeader = box.south >= header.minLat - 1e-5 && box.north <= header.maxLat + 1e-5 &&
        box.west >= header.minLon - 1e-5 && box.east <= header.maxLon + 1e-5;
    if (!withinHeader) throw new Error('Der Kartenausschnitt liegt außerhalb der PMTiles-Abdeckung.');

    const minZoom = Number.isFinite(header.minZoom) ? header.minZoom : 12;
    const maxZoom = Number.isFinite(header.maxZoom) ? header.maxZoom : 14;
    const z = Math.min(Math.max(zoom, minZoom), maxZoom);
    const minX = lonToTile(box.west, z);
    const maxX = lonToTile(box.east, z);
    const minY = latToTile(box.north, z);
    const maxY = latToTile(box.south, z);
    const count = (maxX - minX + 1) * (maxY - minY + 1);
    if (count > MAX_TILES_PER_VIEW) throw new Error(`Zu viele PMTiles-Kacheln für den Kartenausschnitt (${count}).`);

    const tileCoords = [];
    for (let x = minX; x <= maxX; x++) for (let y = minY; y <= maxY; y++) tileCoords.push({ x, y });
    const nodes = new Map();
    let next = 0;
    const workers = Array.from({ length: Math.min(8, tileCoords.length) }, async () => {
        while (next < tileCoords.length) {
            if (signal?.aborted) throw abortError();
            const { x, y } = tileCoords[next++];
            const tile = await getTile(source, z, x, y, signal);
            if (!tile?.layers) continue;
            for (const layerName of TILE_LAYERS) {
                const layer = tile.layers[layerName];
                if (!layer) continue;
                for (let i = 0; i < layer.length; i++) {
                    const node = featureToNode(layer.feature(i), x, y, z, bounds);
                    if (node) nodes.set(`${node.type}:${node.id}`, node);
                }
            }
        }
    });
    await Promise.all(workers);
    const result = Array.from(nodes.values());
    result.dataSource = { type: 'regional', generatedAt: meta.generatedAt, osmDataUntil: meta.osmDataUntil };
    return result;
}

export const regionalData = { fetchRegionalNodes };

