import { osmAuth } from 'osm-auth';

// Configuration
// We use the same Origin for Redirect
const redirectPath = window.location.origin + window.location.pathname;

export const auth = osmAuth({
    client_id: 'eJij_gzo2QRG-oRCZYU2FObBOgX2Z8lbIINezbHmJRI', // User Id
    redirect_uri: redirectPath,
    scope: 'read_prefs write_api', // Permissions
    auto: true, // Auto login if token exists
    singlepage: true // For SPA
});


// Helper to get Header
export function getAuthHeader() {
    if (auth.authenticated()) {
        let token = auth.options().access_token;
        if (!token) {
            // Fallback: Read from localStorage directly
            try {
                const storage = JSON.parse(localStorage.getItem('osm-auth'));
                if (storage && storage.access_token) {
                    token = storage.access_token;
                }
            } catch (e) {
                console.error("Failed to parse token from storage", e);
            }
        }
        if (token) {
            return { 'Authorization': 'Bearer ' + token };
        }
    }
    return null;
}

// Helper to check login
export async function checkLogin() {
    const headers = getAuthHeader();
    if (!headers) return null;

    try {
        const res = await fetch('https://api.openstreetmap.org/api/0.6/user/details', { headers });
        if (!res.ok) {
            const text = await res.text();
            console.error("User Details Fetch Status:", res.status, text);
            // DEBUG: Return error string to show in UI
            return `Error ${res.status}: ${text.substring(0, 100)}`;
        }
        const text = await res.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");
        const user = xml.querySelector('user');
        return user ? user.getAttribute('display_name') : "XML Error";
    } catch (e) {
        console.error("Auth Check Failed", e);
        return "Error: " + String(e);
    }
}
