// Helper for Colorful Logs
const c = {
    req: (t) => `<span class="text-blue-400 font-bold">➡ ${t}</span>`,
    res: (t) => `<span class="text-purple-400 font-bold">⬅ ${t}</span>`,
    info: (t) => `<span class="text-yellow-400">ℹ️ ${t}</span>`,
    success: (t) => `<span class="text-green-400 font-bold">✅ ${t}</span>`,
    err: (t) => `<span class="text-red-500 font-bold">❌ ${t}</span>`
};

import { getAuthHeader } from './auth.js';

export async function createHydrant(data, authHeader, log = console.log) {
    try {
        const { lat, lng, tags } = data;

        // 1. Reverse Geocoding (Nominatim)
        // We do this concurrently or before changeset? 
        // Doing it before allows us to put address in changeset comment.
        log(c.info("Ermittle Standort-Namen (Nominatim)..."));

        let locationStr = "Unbekannt";

        try {
            const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
                headers: {
                    'User-Agent': 'Hydranten-Jaeger-App/1.0'
                }
            });
            if (nomRes.ok) {
                const nomData = await nomRes.json();
                const a = nomData.address || {};

                // Try to build: "91234 Schnaittach, Hauptstraße"
                const zip = a.postcode || "";
                const city = a.city || a.town || a.village || a.municipality || "Ort";
                const street = a.road || a.pedestrian || a.footway || a.path || "";

                if (street && zip) {
                    locationStr = `${zip} ${city}, ${street}`;
                } else if (zip) {
                    locationStr = `${zip} ${city}`;
                } else if (street) {
                    locationStr = `${city}, ${street}`;
                } else {
                    locationStr = city;
                }

                log(c.success(`Standort: ${locationStr} (${nomData.display_name})`));
            } else {
                log(c.err("Nominatim Fehler: " + nomRes.status));
                locationStr = "Unbekannt";
            }
        } catch (e) {
            log(c.err("Nominatim Exception: " + e.message));
            locationStr = "Unbekannt";
        }


        // 2. Create Changeset
        log(c.info("Erstelle Changeset..."));

        const changesetXml = `
<osm>
  <changeset>
    <tag k="created_by" v="Hydranten Jäger v0.3.5"/>
    <tag k="comment" v="Adding Hydrant in ${locationStr} via Hydranten Jäger"/>
    <tag k="locale" v="de"/>
  </changeset>
</osm>`;

        log(c.req(`PUT /changeset/create Payload: <br><span class="text-xs font-mono text-gray-500">${changesetXml.replace(/</g, '&lt;')}</span>`));

        const csRes = await fetch('https://api.openstreetmap.org/api/0.6/changeset/create', {
            method: 'PUT',
            headers: getAuthHeader(), // Use helper from auth.js path? No, we need it passed or imported.
            // Wait, main.js calls this. It does NOT pass authHeader. 
            // It passes empty object as second arg?
            // Let's import getAuthHeader here to be safe and ignore the passed arg if empty.
            body: changesetXml
        });

        if (!csRes.ok) throw new Error(`CS Init Failed: ${csRes.status} ${await csRes.text()}`);
        const changesetId = await csRes.text();
        log(c.res(`Changeset ID: ${changesetId}`));


        // 3. Create Node
        log(c.info("Lade Hydranten hoch..."));

        let tagsXml = '';
        for (const [k, v] of Object.entries(tags)) {
            if (v) tagsXml += `<tag k="${k}" v="${v}"/>`;
        }

        const nodeXml = `
<osm>
  <node lat="${lat}" lon="${lng}" changeset="${changesetId}">
    ${tagsXml}
  </node>
</osm>`;

        log(c.req(`PUT /node/create Payload: <br><span class="text-xs font-mono text-gray-500">${nodeXml.replace(/</g, '&lt;')}</span>`));
        // log(c.info(`XML: ${nodeXml.replace(/</g, '&lt;')}`)); // Too verbose? User liked looking at it implicitly.

        const nodeRes = await fetch(`https://api.openstreetmap.org/api/0.6/node/create`, {
            method: 'PUT',
            headers: getAuthHeader(),
            body: nodeXml
        });

        if (!nodeRes.ok) throw new Error(`Node Create Failed: ${nodeRes.status} ${await nodeRes.text()}`);
        const nodeId = await nodeRes.text();
        log(c.res(`Node Created: ${nodeId}`));


        // 4. Close Changeset
        log(c.req(`PUT /changeset/${changesetId}/close`));
        await fetch(`https://api.openstreetmap.org/api/0.6/changeset/${changesetId}/close`, {
            method: 'PUT',
            headers: getAuthHeader()
        });
        log(c.success(`Changeset Closed`));

        return { id: nodeId, changeset: changesetId };

    } catch (err) {
        log(c.err(err.message));
        throw err;
    }
}

/**
 * Fetch latest node data (version & tags) to assure safe editing
 */
export async function fetchNodeData(id) {
    const url = `https://api.openstreetmap.org/api/0.6/node/${id}`; // Auth not strictly needed for public read
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fetch Node Failed: ${res.status}`);

    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/xml");
    const node = doc.querySelector('node');

    if (!node) throw new Error("Node XML invalid");

    const tags = {};
    doc.querySelectorAll('tag').forEach(t => {
        tags[t.getAttribute('k')] = t.getAttribute('v');
    });

    return {
        id: node.getAttribute('id'),
        lat: parseFloat(node.getAttribute('lat')),
        lng: parseFloat(node.getAttribute('lon')), // OSM uses lon
        version: node.getAttribute('version'),
        tags: tags
    };
}

/**
 * Update existing hydrant (PUT)
 * @param {string} id - Node ID
 * @param {string} version - Current version (optimistic locking)
 * @param {object} tags - Merged tags
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 */
export async function updateHydrant(id, version, tags, lat, lng, log = console.log) {
    // 1. Create Changeset (Reusable logic ideally, but keeping it simple/local for now)
    log(c.info("Starte Update-Prozess..."));

    // Note: We could reuse the same changeset logic from createHydrant if we refactored, 
    // but to be safe and isolated, we duplicate the minimal changeset creation here.

    const changesetXml = `
<osm>
  <changeset>
    <tag k="created_by" v="Hydranten Jäger v0.3.5"/>
    <tag k="comment" v="Updating Hydrant #${id} tags via Hydranten Jäger"/>
    <tag k="locale" v="de"/>
  </changeset>
</osm>`;

    log(c.req(`PUT /changeset/create (Update)`));

    // Changeset
    const csRes = await fetch('https://api.openstreetmap.org/api/0.6/changeset/create', {
        method: 'PUT',
        headers: getAuthHeader(),
        body: changesetXml
    });

    if (!csRes.ok) throw new Error(`CS Init Failed: ${csRes.status} ${await csRes.text()}`);
    const changesetId = await csRes.text();
    log(c.res(`Changeset ID: ${changesetId}`));

    try {
        // 2. Build Node XML
        let tagsXml = '';
        for (const [k, v] of Object.entries(tags)) {
            if (v && v.trim() !== "") tagsXml += `<tag k="${k}" v="${v}"/>`;
        }

        const nodeXml = `
<osm>
  <node id="${id}" lat="${lat}" lon="${lng}" version="${version}" changeset="${changesetId}">
    ${tagsXml}
  </node>
</osm>`;

        log(c.req(`PUT /node/${id} (v${version})`));

        // 3. Update Node
        const nodeRes = await fetch(`https://api.openstreetmap.org/api/0.6/node/${id}`, {
            method: 'PUT',
            headers: getAuthHeader(),
            body: nodeXml
        });

        if (!nodeRes.ok) {
            const errorText = await nodeRes.text();
            if (nodeRes.status === 409) throw new Error("Konflikt! Jemand hat den Hydranten gerade bearbeitet. Bitte neu laden.");
            throw new Error(`Update Failed: ${nodeRes.status} ${errorText}`);
        }

        const newVersion = await nodeRes.text(); // Returns new version number
        log(c.success(`Update Erfolgreich! (v${newVersion})`));

        return { id, version: newVersion, changeset: changesetId };

    } finally {
        // 4. Always Try to Close Changeset
        await fetch(`https://api.openstreetmap.org/api/0.6/changeset/${changesetId}/close`, {
            method: 'PUT',
            headers: getAuthHeader()
        });
        log(c.info(`Changeset Closed`));
    }
}

/**
 * Delete a hydrant
 * @param {string} id - Node ID
 * @param {string} version - Current version
 * @param {number} lat - Latitude (required for valid node XML technically, though DELETE might ignore it, best to include)
 * @param {number} lng - Longitude
 */
export async function deleteHydrant(id, version, lat, lng, log = console.log) {
    log(c.info(`Lösche Hydrant #${id}...`));

    const changesetXml = `
<osm>
  <changeset>
    <tag k="created_by" v="Hydranten Jäger v0.3.5"/>
    <tag k="comment" v="Deleting Hydrant #${id} via Hydranten Jäger"/>
    <tag k="locale" v="de"/>
  </changeset>
</osm>`;

    log(c.req(`PUT /changeset/create (Delete)`));

    // 1. Open Changeset
    const csRes = await fetch('https://api.openstreetmap.org/api/0.6/changeset/create', {
        method: 'PUT',
        headers: getAuthHeader(),
        body: changesetXml
    });

    if (!csRes.ok) throw new Error(`CS Init Failed: ${csRes.status}`);
    const changesetId = await csRes.text();
    log(c.res(`Changeset ID: ${changesetId}`));

    try {
        // 2. Build Delete Payload (Must include ID, Version, Changeset, Lat, Lon)
        // Note: OSM requires the full node element for delete in API 0.6, similar to modify but with DELETE method.
        // Actually, for DELETE /api/0.6/node/#id, the BODY must contain the XML with version!
        const nodeXml = `
<osm>
  <node id="${id}" lat="${lat}" lon="${lng}" version="${version}" changeset="${changesetId}"/>
</osm>`;

        log(c.req(`DELETE /node/${id}`));

        const delRes = await fetch(`https://api.openstreetmap.org/api/0.6/node/${id}`, {
            method: 'DELETE',
            headers: getAuthHeader(),
            body: nodeXml
        });

        if (!delRes.ok) {
            if (delRes.status === 409) throw new Error("Konflikt! Löschen fehlgeschlagen (Version mismatch?).");
            if (delRes.status === 410) throw new Error("Bereits gelöscht.");
            throw new Error(`Delete Failed: ${delRes.status} ${await delRes.text()}`);
        }

        const newVersion = await delRes.text();
        log(c.success(`Gelöscht! (v${newVersion})`));
        return { id, version: newVersion };

    } finally {
        await fetch(`https://api.openstreetmap.org/api/0.6/changeset/${changesetId}/close`, {
            method: 'PUT',
            headers: getAuthHeader()
        });
        log(c.info(`Changeset Closed`));
    }
}

// End of OSM Service
