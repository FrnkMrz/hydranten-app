
// PKCE Helpers
function generateRandomString(length) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    for (let i = 0; i < length; i++) {
        result += charset[values[i] % charset.length];
    }
    return result;
}

async function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return crypto.subtle.digest('SHA-256', data);
}

function base64UrlEncode(a) {
    let str = "";
    const bytes = new Uint8Array(a);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        str += String.fromCharCode(bytes[i]);
    }
    return btoa(str)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

async function generateChallenge(verifier) {
    const hashed = await sha256(verifier);
    return base64UrlEncode(hashed);
}

// Service
export const auth = {
    options: {
        client_id: 'eJij_gzo2QRG-oRCZYU2FObBOgX2Z8lbIINezbHmJRI',
        // Fix: PWA might be at /index.html, but OSM expects /
        redirect_uri: (window.location.origin + window.location.pathname).replace(/\/index\.html$/, '/').replace(/\/$/, '') + '/',
    },

    // 1. Start Login (Redirects)
    async login() {
        const verifier = generateRandomString(128);
        const challenge = await generateChallenge(verifier);

        // SECURITY: Verifier lokal speichern, NICHT in den State packen!
        localStorage.setItem('osm_pkce_verifier', verifier);

        // State nur noch für CSRF nutzen
        const state = generateRandomString(16);
        localStorage.setItem('osm_auth_state', state);

        const scope = 'read_prefs write_api';
        const url = `https://www.openstreetmap.org/oauth2/authorize?response_type=code&client_id=${this.options.client_id}&redirect_uri=${encodeURIComponent(this.options.redirect_uri)}&scope=${encodeURIComponent(scope)}&code_challenge=${challenge}&code_challenge_method=S256&state=${state}`;

        window.location.href = url;
    },

    // 2. Exchange Code (Call this on callback)
    async exchangeCode(code) {
        // State prüfen (CSRF Schutz)
        const params = new URLSearchParams(window.location.search);
        const serverState = params.get('state');
        const localState = localStorage.getItem('osm_auth_state');

        if (serverState && localState && serverState !== localState) {
            console.error("State Mismatch!", { server: serverState, local: localState });
            throw new Error("Security Alert: State mismatch! Möglicher CSRF Angriff.");
        }

        // Verifier aus Storage holen
        const verifier = localStorage.getItem('osm_pkce_verifier');

        if (!verifier) throw new Error("PKCE Verifier missing (Login Session expired?). Please retry login.");

        const bodyParams = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            client_id: this.options.client_id,
            redirect_uri: this.options.redirect_uri,
            code_verifier: verifier
        });

        const res = await fetch('https://www.openstreetmap.org/oauth2/token', {
            method: 'POST',
            headers: {
                'User-Agent': 'Hydranten-Jaeger-App/1.3.0',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: bodyParams
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Token Exchange Failed (${res.status}): ${text}`);
        }

        const data = await res.json();

        // Save Token
        localStorage.setItem('osm-auth', JSON.stringify(data));

        // Cleanup Security Items
        localStorage.removeItem('osm_pkce_verifier');
        localStorage.removeItem('osm_auth_state');

        return data.access_token;
    },

    // 3. Get Auth Header
    authenticated() {
        return !!this.getToken();
    },

    getToken() {
        try {
            const data = JSON.parse(localStorage.getItem('osm-auth'));
            return data ? data.access_token : null;
        } catch (e) { return null; }
    },

    logout() {
        localStorage.removeItem('osm-auth');
        localStorage.removeItem('osm_user_name');
    }
};

// Compat with existing code expecting getAuthHeader
export function getAuthHeader() {
    const token = auth.getToken();
    return token ? {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Hydranten-Jaeger-App/1.3.0'
    } : {
        'User-Agent': 'Hydranten-Jaeger-App/1.3.0'
    };
}

// Compat checkLogin with Caching
export async function checkLogin() {
    if (!auth.authenticated()) {
        localStorage.removeItem('osm_user_name');
        return null; // Not logged in
    }

    // Try Cache
    const cached = localStorage.getItem('osm_user_name');

    try {
        const res = await fetch('https://api.openstreetmap.org/api/0.6/user/details', {
            headers: getAuthHeader()
        });
        if (!res.ok) {
            // If token expired, maybe logout? For now just return err
            return "Error: " + res.status;
        }
        const text = await res.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");
        const user = xml.querySelector('user');

        if (user) {
            const name = user.getAttribute('display_name');
            localStorage.setItem('osm_user_name', name);

            // Try to find image
            const img = user.querySelector('img');
            if (img && img.getAttribute('href')) {
                localStorage.setItem('osm_user_img', img.getAttribute('href'));
            } else {
                localStorage.removeItem('osm_user_img');
            }

            return name;
        }
        return "XML Error";
    } catch (e) {
        // If offline but cached, return cached
        if (cached) return cached;
        return "Error: " + e.message;
    }
}
