import { osmAuth } from 'osm-auth';

// Configuration
// We use the same Origin for Redirect
const redirectPath = window.location.origin + window.location.pathname;

export const auth = osmAuth({
    client_id: 'eJij_gzo2QRG-oRCZYU2FObBOgX2Z8lbIINezbHmJRI', // User Id
    redirect_uri: redirectPath,
    scope: 'write_api', // Permissions (Matches what we asked user to check)
    auto: true, // Auto login if token exists
    singlepage: true // For SPA
});


// Helper to get Header
export function getAuthHeader() {
    if (auth.authenticated()) {
        return { 'Authorization': 'Bearer ' + auth.options().access_token };
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
            console.error("User Details Fetch Status:", res.status);
            return null;
        }
        const text = await res.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");
        const user = xml.querySelector('user');
        return user ? user.getAttribute('display_name') : null;
    } catch (e) {
        console.error("Auth Check Failed", e);
        return null;
    }
}
