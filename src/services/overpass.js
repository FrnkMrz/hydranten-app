// src/services/overpass.js

// Liste bekannter, stabiler Overpass-Instanzen
const SERVERS = [
    'https://overpass-api.de/api/interpreter',       // Hauptserver (DE)
    'https://overpass.kumi.systems/api/interpreter', // Starker Backup
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter' // Weiterer Backup
];

/**
 * Versucht eine Query auf mehreren Servern nacheinander auszuführen
 */
async function fetchWithFallback(query, attempt = 0) {
    if (attempt >= SERVERS.length) {
        throw new Error("Alle Overpass-Server sind nicht erreichbar.");
    }

    const server = SERVERS[attempt];
    // Timeout etwas reduziert pro Request für schnelleren Wechsel
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
        // console.log(`Versuche Server ${attempt + 1}/${SERVERS.length}: ${server}`);

        const response = await fetch(server, {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.status === 429) {
            // Rate Limit: Kurz warten und nächsten Server probieren
            // console.warn("Rate Limit (429). Warte kurz...");
            await new Promise(r => setTimeout(r, 2000));
            return fetchWithFallback(query, attempt + 1);
        }

        if (!response.ok) {
            if (response.status === 400) throw new Error(`Bad Request (400)`); // Syntax error, don't retry
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();

    } catch (err) {
        clearTimeout(timeoutId);
        // console.warn(`Server ${server} fehlgeschlagen:`, err.message);
        // Rekursiver Aufruf des nächsten Servers
        return fetchWithFallback(query, attempt + 1);
    }
}

export const overpass = {
    async fetchHydrants(bounds) {
        // Query Optimierung: Timeout im Overpass QL selbst setzen
        // [timeout:25] damit der Server selbst abbricht, bevor unser Fetch-Timeout greift
        const s = bounds.getSouth();
        const n = bounds.getNorth();
        const w = bounds.getWest();
        const e = bounds.getEast();

        const query = `
            [out:json][timeout:25];
            node["emergency"~"fire_hydrant|water_tank|suction_point"](${s},${w},${n},${e})->.n;
            .n out body;
            way(bn.n);
            out skel;
        `;

        try {
            const data = await fetchWithFallback(query);
            const elements = data.elements || [];

            // Post-Processing wie gehabt
            const nodes = [];
            const lockedNodeIds = new Set();

            elements.forEach(el => {
                if (el.type === 'node') {
                    nodes.push(el);
                } else if (el.type === 'way' && el.nodes) {
                    el.nodes.forEach(nid => lockedNodeIds.add(nid));
                }
            });

            return nodes.map(node => {
                if (lockedNodeIds.has(node.id)) node._isPartOfWay = true;
                return node;
            });

        } catch (err) {
            // console.error("Overpass Totalausfall:", err);
            throw err; // WICHTIG: Fehler werfen, damit UI Toast erscheint!
        }
    }
};
