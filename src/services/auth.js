
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
        redirect_uri: window.location.origin + window.location.pathname,
    },

    // 1. Start Login (Redirects)
    async login() {
        const verifier = generateRandomString(128);
        const challenge = await generateChallenge(verifier);

        // Stateless PKCE: Encode verifier in state
        const stateData = {
            csrf: generateRandomString(16),
            v: verifier
        };
        const state = btoa(JSON.stringify(stateData)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        const scope = 'read_prefs write_api';
        const url = `https://www.openstreetmap.org/oauth2/authorize?response_type=code&client_id=${this.options.client_id}&redirect_uri=${encodeURIComponent(this.options.redirect_uri)}&scope=${encodeURIComponent(scope)}&code_challenge=${challenge}&code_challenge_method=S256&state=${state}`;

        window.location.href = url;
    },

    // 2. Exchange Code (Call this on callback)
    async exchangeCode(code) {
        // Try getting verifier from State (Stateless)
        const params = new URLSearchParams(window.location.search);
        const state = params.get('state');
        let verifier = null;

        if (state) {
            try {
                // Decode Base64URL
                const json = atob(state.replace(/-/g, '+').replace(/_/g, '/'));
                const data = JSON.parse(json);
                verifier = data.v;
                console.log("Stateless PKCE: Recovered verifier from state");
            } catch (e) {
                console.error("State decode failed", e);
            }
        }

        // Fallback to LocalStorage (Legacy/Backup)
        if (!verifier) {
            verifier = localStorage.getItem('osm_pkce_verifier');
        }

        if (!verifier) throw new Error("PKCE Verifier missing (State & Storage empty). Login failed.");

        const bodyParams = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            client_id: this.options.client_id,
            redirect_uri: this.options.redirect_uri,
            code_verifier: verifier
        });

        const res = await fetch('https://www.openstreetmap.org/oauth2/token', {
            method: 'POST',
            body: bodyParams
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Token Exchange Failed (${res.status}): ${text}`);
        }

        const data = await res.json();
        // Save Token
        localStorage.setItem('osm-auth', JSON.stringify(data));
        // Cleanup Verifier
        localStorage.removeItem('osm_pkce_verifier'); // Clean legacy if present

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
    return token ? { 'Authorization': `Bearer ${token}` } : null;
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
            // CACHE IT
            localStorage.setItem('osm_user_name', name);
            return name;
        }
        return "XML Error";
    } catch (e) {
        // If offline but cached, return cached
        if (cached) return cached;
        return "Error: " + e.message;
    }
}
