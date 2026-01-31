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

        let address = "Unbekannt";
        let city = "Unbekannt";

        try {
            const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            if (nomRes.ok) {
                const nomData = await nomRes.json();
                address = nomData.display_name || "Unbekannt";
                city = nomData.address.city || nomData.address.town || nomData.address.village || "Ort";
                // Full Address
                log(c.success(`Standort: ${address}`));
            } else {
                log(c.err("Nominatim Fehler: " + nomRes.status));
            }
        } catch (e) {
            log(c.err("Nominatim Exception: " + e.message));
        }


        // 2. Create Changeset
        log(c.info("Erstelle Changeset..."));

        const changesetXml = `
<osm>
  <changeset>
    <tag k="created_by" v="Hydranten Jäger v0.3.5"/>
    <tag k="comment" v="Adding Hydrant in ${city} via Hydranten Jäger"/>
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
