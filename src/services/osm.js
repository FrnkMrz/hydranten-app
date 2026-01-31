import { getAuthHeader } from './auth.js';

export async function createHydrant(data, creds, onProgress = () => { }) {
    const BASE_URL = 'https://api.openstreetmap.org/api/0.6';

    const authHeaders = getAuthHeader();
    if (!authHeaders) throw new Error("Nicht eingeloggt (OAuth Token fehlt).");
    const headers = { ...authHeaders, 'Content-Type': 'text/xml' };

    // 0. Reverse Geocode (Get City Name)

    // 0. Reverse Geocode (Get City Name)
    onProgress("🔍 Ermittle Standort-Namen (Nominatim)...");
    let locationName = "Unknown Location";
    try {
        const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${data.lat}&lon=${data.lng}&zoom=10`, {
            headers: { 'User-Agent': 'HydrantenJaegerApp/0.1' }
        });
        if (nomRes.ok) {
            const nomData = await nomRes.json();
            const addr = nomData.address || {};
            locationName = addr.city || addr.town || addr.village || addr.municipality || addr.county || "Unknown";
        }
    } catch (e) {
        console.warn("Reverse Geocoding failed:", e);
    }

    // 1. Create Changeset
    const changesetXml = `
    <osm>
        <changeset>
            <tag k="created_by" v="Hydranten Jäger v0.1"/>
            <tag k="comment" v="Adding Hydrant in ${locationName} via Hydranten Jäger"/>
            <tag k="locale" v="de"/>
        </changeset>
    </osm>`;

    onProgress(`➡ PUT /changeset/create\nPayload: ${changesetXml.replace(/</g, '&lt;')}`);
    console.log(`Creating Changeset...`);
    const csRes = await fetch(`${BASE_URL}/changeset/create`, {
        method: 'PUT',
        headers: headers,
        body: changesetXml
    });

    onProgress(`⬅ Response: ${csRes.status} ${csRes.statusText}`);

    if (!csRes.ok) {
        if (csRes.status === 401) {
            throw new Error(`Anmeldung fehlgeschlagen (401). Bitte prüfe Benutzername/Passwort. (Hinweis: Benutze deinen Nuternamen, NICHT die E-Mail!)`);
        }
        throw new Error(`Changeset Error: ${csRes.status} ${await csRes.text()}`);
    }

    const changesetId = await csRes.text();
    console.log("Changeset ID:", changesetId);

    // 2. Create Node
    onProgress("🚀 Lade Hydranten hoch...");
    let tagXml = '';
    for (const [k, v] of Object.entries(data.tags)) {
        if (v) tagXml += `<tag k="${k}" v="${v}"/>`;
    }

    const nodeXml = `
    <osm>
        <node lat="${data.lat}" lon="${data.lng}" changeset="${changesetId}">
            ${tagXml}
        </node>
    </osm>`;

    onProgress(`➡ PUT /node/create\nPayload: ${nodeXml.replace(/</g, '&lt;')}`);

    const nodeRes = await fetch(`${BASE_URL}/node/create`, {
        method: 'PUT',
        headers: headers,
        body: nodeXml
    });

    onProgress(`⬅ Response: ${nodeRes.status} ${nodeRes.statusText}`);

    if (!nodeRes.ok) {
        // Try to close changeset even if node failed? 
        // No, if node failed, changeset is empty, auto-closes eventually.
        throw new Error(`Node Error: ${nodeRes.status} ${await nodeRes.text()}`);
    }

    const nodeId = await nodeRes.text();
    console.log("Node ID:", nodeId);

    // 3. Close Changeset
    onProgress(`➡ PUT /changeset/${changesetId}/close`);
    await fetch(`${BASE_URL}/changeset/${changesetId}/close`, {
        method: 'PUT',
        headers: authHeaders
    });
    onProgress(`⬅ Response: OK`);

    return {
        id: nodeId,
        changeset: changesetId,
        user: creds.user
    };
}
