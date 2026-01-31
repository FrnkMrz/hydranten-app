import osmAuth from 'osm-auth';

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
        return { 'Authorization': 'Bearer ' + auth.options().access_token };
    }
    return null;
}

// Helper to check login
export async function checkLogin() {
    if (auth.authenticated()) {
        try {
            // Get User Details for Display
            const x = await auth.xhr({ method: 'GET', path: '/api/0.6/user/details' });
            // Parsing XML to get display name is annoying, osm-auth usually returns raw XML
            // We will implement a quick regex or DOMParser
            const parser = new DOMParser();
            const xml = parser.parseFromString(x.responseText, "text/xml");
            const user = xml.querySelector('user');
            if (user) return user.getAttribute('display_name');
        } catch (e) {
            console.error("Auth Check Failed", e);
        }
    }
    return null;
}
