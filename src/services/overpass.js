
// Service to interact with Overpass API

// Caching to avoid duplicate requests for same areas (simple implementation)
// We use a Set of loaded tile IDs or simply debounce. 
// For simplicity: We just fetch and Leaflet handles marker deduplication by ID if we implement it, 
// OR we just plain clear and redraw (easier but flashes),
// OR we keep a Set of known node IDs.

const loadedNodes = new Set();
// Bounding box buffer ratio (fetch a bit more than visible)
const BUFFER = 0.2;

export const overpass = {
    /**
     * Fetch hydrants within the given Leaflet bounds.
     * @param {L.LatLngBounds} bounds 
     * @returns {Promise<Array>} Array of hydrant objects {id, lat, lon}
     */
    async fetchHydrants(bounds) {
        // Pad bounds
        const south = bounds.getSouth() - (bounds.getSouth() - bounds.getNorth()) * 0.1; // roughly
        // Let's just use raw coords
        const s = bounds.getSouth();
        const n = bounds.getNorth();
        const w = bounds.getWest();
        const e = bounds.getEast();

        // Construct Query: [out:json][timeout:45]; node["emergency"="fire_hydrant"](s,w,n,e); out skel;
        const query = `
            [out:json][timeout:45];
            node["emergency"~"fire_hydrant|water_tank|suction_point"](${s},${w},${n},${e});
            out skel;
        `;

        const url = 'https://overpass-api.de/api/interpreter';

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout

            const response = await fetch(url, {
                method: 'POST',
                body: `data=${encodeURIComponent(query)}`,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                // Too many requests (429) -> just return empty, don't crash
                if (response.status === 429) {
                    console.warn("Overpass Rate Limit hit. Skipping.");
                    return [];
                }
                throw new Error(`Overpass Error: ${response.status}`);
            }

            const data = await response.json();
            return data.elements || [];

        } catch (err) {
            console.error("Fetch Hydrants failed:", err);
            throw err; // Re-throw to allow UI to handle it
        }
    }
};
