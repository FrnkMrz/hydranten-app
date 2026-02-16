// Helper for Colorful Logs
const c = {
    req: (t) => `<span class="text-blue-400 font-bold">➡ ${t}</span>`,
    res: (t) => `<span class="text-purple-400 font-bold">⬅ ${t}</span>`,
    info: (t) => `<span class="text-yellow-400">ℹ️ ${t}</span>`,
    success: (t) => `<span class="text-green-400 font-bold">✅ ${t}</span>`,
    err: (t) => `<span class="text-red-500 font-bold">❌ ${t}</span>`
};

import { getAuthHeaderAsync } from './auth.js';
import { USER_AGENT, CREATED_BY } from '../version.js';

// ... (existing code)

// Helper for Colorful Logs
// ... (existing helper code)

/**
// ... (existing code)
 */

export async function createHydrant(data, authHeader, log = console.log) {
    try {
        const { lat, lng, tags } = data;

        // Normalize Tags
        const finalTags = normalizeTags(tags);

        // 1. Determine Location Name
        const locationStr = await getLocationName(lat, lng, log);


        // 2. Create Changeset
        log(c.info("Erstelle Changeset..."));

        const changesetXml = `
<osm>
  <changeset>
    <tag k="created_by" v="${escapeXml(CREATED_BY)}"/>
    <tag k="comment" v="${escapeXml(`Adding ${getTypeName(finalTags)} in ${locationStr} via Hydranten Jäger`)}"/>
    <tag k="locale" v="de"/>
  </changeset>
</osm>`;

        log(c.req(`PUT /changeset/create Payload: <br><span class="text-xs font-mono text-gray-500">${changesetXml.replace(/</g, '&lt;')}</span>`));

        const csRes = await fetch('https://api.openstreetmap.org/api/0.6/changeset/create', {
            method: 'PUT',
            headers: await getAuthHeaderAsync(),
            body: changesetXml
        });

        if (!csRes.ok) throw new Error(`CS Init Failed: ${csRes.status} ${await csRes.text()}`);
        const changesetId = await csRes.text();
        log(c.res(`Changeset ID: ${changesetId}`));


        // 3. Create Node
        log(c.info("Lade Hydranten hoch..."));

        let tagsXml = '';
        for (const [k, v] of Object.entries(finalTags)) {
            if (v) tagsXml += `<tag k="${escapeXml(k)}" v="${escapeXml(v)}"/>`;
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
            headers: await getAuthHeaderAsync(),
            body: nodeXml
        });

        if (!nodeRes.ok) throw new Error(`Node Create Failed: ${nodeRes.status} ${await nodeRes.text()}`);
        const nodeId = await nodeRes.text();
        log(c.res(`Node Created: ${nodeId}`));


        // 4. Close Changeset
        log(c.req(`PUT /changeset/${changesetId}/close`));
        await fetch(`https://api.openstreetmap.org/api/0.6/changeset/${changesetId}/close`, {
            method: 'PUT',
            headers: await getAuthHeaderAsync()
        });
        log(c.success(`Changeset Closed`));

        // Optimistic UI: Remember created node locally to show it immediately
        try {
            const created = JSON.parse(localStorage.getItem('created_hydrants') || '[]');
            // Add new node. Remove duplicates if any.
            const newNode = {
                id: nodeId,
                lat: parseFloat(lat),
                lon: parseFloat(lng),
                tags: finalTags,
                timestamp: Date.now()
            };
            created.push(newNode);
            localStorage.setItem('created_hydrants', JSON.stringify(created));
        } catch (e) { console.error("Could not save creation to local storage", e); }

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
    if (res.status === 404 || res.status === 410) {
        throw new Error("NODE_DELETED");
    }
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

    let isPartOfWay = false;
    try {
        const waysRes = await fetch(`https://api.openstreetmap.org/api/0.6/node/${id}/ways`);
        if (waysRes.ok) {
            const waysText = await waysRes.text();
            const waysDoc = parser.parseFromString(waysText, "text/xml");
            if (waysDoc.querySelectorAll('way').length > 0) {
                isPartOfWay = true;
            }
        }
    } catch (e) {
        console.warn("Could not fetch parent ways", e);
    }

    return {
        id: node.getAttribute('id'),
        lat: parseFloat(node.getAttribute('lat')),
        lng: parseFloat(node.getAttribute('lon')), // OSM uses lon
        version: node.getAttribute('version'),
        tags: tags,
        _isPartOfWay: isPartOfWay
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
    // 1. Create Changeset
    log(c.info("Starte Update-Prozess..."));

    const finalTags = normalizeTags(tags);

    // Get Location
    const locationStr = await getLocationName(lat, lng, log);

    const changesetXml = `
<osm>
  <changeset>
    <tag k="created_by" v="${escapeXml(CREATED_BY)}"/>
    <tag k="comment" v="${escapeXml(`Updating ${getTypeName(finalTags)} #${id} in ${locationStr} via Hydranten Jäger`)}"/>
    <tag k="locale" v="de"/>
  </changeset>
</osm>`;

    log(c.req(`PUT /changeset/create (Update)`));

    // Changeset
    const csRes = await fetch('https://api.openstreetmap.org/api/0.6/changeset/create', {
        method: 'PUT',
        headers: await getAuthHeaderAsync(),
        body: changesetXml
    });

    if (!csRes.ok) throw new Error(`CS Init Failed: ${csRes.status} ${await csRes.text()}`);
    const changesetId = await csRes.text();
    log(c.res(`Changeset ID: ${changesetId}`));

    try {
        // 2. Build Node XML
        let tagsXml = '';
        for (const [k, v] of Object.entries(finalTags)) {
            if (v && v.trim() !== "") tagsXml += `<tag k="${escapeXml(k)}" v="${escapeXml(v)}"/>`;
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
            headers: await getAuthHeaderAsync(),
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
            headers: await getAuthHeaderAsync()
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
export async function deleteHydrant(id, version, lat, lng, tags = {}, log = console.log) {
    const typeName = getTypeName(tags);
    log(c.info(`Lösche ${typeName} #${id}...`));

    // Get Location
    const locationStr = await getLocationName(lat, lng, log);

    const changesetXml = `
<osm>
  <changeset>
    <tag k="created_by" v="${escapeXml(CREATED_BY)}"/>
    <tag k="comment" v="${escapeXml(`Deleting ${typeName} #${id} in ${locationStr} via Hydranten Jäger`)}"/>
    <tag k="locale" v="de"/>
  </changeset>
</osm>`;

    log(c.req(`PUT /changeset/create (Delete)`));

    // 1. Open Changeset
    const csRes = await fetch('https://api.openstreetmap.org/api/0.6/changeset/create', {
        method: 'PUT',
        headers: await getAuthHeaderAsync(),
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
            headers: await getAuthHeaderAsync(),
            body: nodeXml
        });

        if (!delRes.ok) {
            if (delRes.status === 409) throw new Error("Konflikt! Löschen fehlgeschlagen (Version mismatch?).");
            if (delRes.status === 410) throw new Error("Bereits gelöscht.");
            throw new Error(`Delete Failed: ${delRes.status} ${await delRes.text()}`);
        }

        const newVersion = await delRes.text();
        log(c.success(`Gelöscht! (v${newVersion})`));

        // Optimistic UI: Remember deleted ID locally to hide it from map until Overpass catches up
        try {
            const deleted = JSON.parse(localStorage.getItem('deleted_hydrants') || '[]');
            if (!deleted.includes(id)) {
                deleted.push(id);
                localStorage.setItem('deleted_hydrants', JSON.stringify(deleted));
            }
        } catch (e) { console.error("Could not save to local storage", e); }

        return { id, version: newVersion };

    } finally {
        await fetch(`https://api.openstreetmap.org/api/0.6/changeset/${changesetId}/close`, {
            method: 'PUT',
            headers: await getAuthHeaderAsync()
        });
        log(c.info(`Changeset Closed`));
    }
}

// End of OSM Service
