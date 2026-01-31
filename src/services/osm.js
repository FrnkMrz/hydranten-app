export async function createHydrant(data, creds) {
    const BASE_URL = 'https://api.openstreetmap.org/api/0.6';
    // Use Dev Server if needed? User said "upload to OpenStreetMap", implying Production.
    // Ideally we should use https://master.apis.dev.openstreetmap.org for testing, 
    // but user said "VALID User", so likely Prod.
    // We will use Prod URL but log warning.

    const authHeader = 'Basic ' + btoa(creds.user + ':' + creds.password);

    // 0. Reverse Geocode (Get City Name)
    let locationName = "Unknown Location";
    try {
        console.log("Fetching Address from Nominatim...");
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
            <tag k="comment" v="Adding Hydrant in ${locationName}"/>
            <tag k="locale" v="de"/>
        </changeset>
    </osm>`;

    console.log(`Creating Changeset (Comment: Adding Hydrant in ${locationName})...`);
    const csRes = await fetch(`${BASE_URL}/changeset/create`, {
        method: 'PUT',
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'text/xml'
        },
        body: changesetXml
    });

    if (!csRes.ok) {
        throw new Error(`Changeset Error: ${csRes.status} ${await csRes.text()}`);
    }

    const changesetId = await csRes.text();
    console.log("Changeset ID:", changesetId);

    // 2. Create Node
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

    console.log("Uploading Node...");
    const nodeRes = await fetch(`${BASE_URL}/node/create`, {
        method: 'PUT',
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'text/xml'
        },
        body: nodeXml
    });

    if (!nodeRes.ok) {
        // Try to close changeset even if node failed? 
        // No, if node failed, changeset is empty, auto-closes eventually.
        throw new Error(`Node Error: ${nodeRes.status} ${await nodeRes.text()}`);
    }

    const nodeId = await nodeRes.text();
    console.log("Node ID:", nodeId);

    // 3. Close Changeset
    console.log("Closing Changeset...");
    await fetch(`${BASE_URL}/changeset/${changesetId}/close`, {
        method: 'PUT',
        headers: {
            'Authorization': authHeader
        }
    });

    return {
        id: nodeId,
        changeset: changesetId,
        user: creds.user
    };
}
