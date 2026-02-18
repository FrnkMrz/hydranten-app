import { USER_AGENT } from '../version.js';

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
        console.log("[Auth] Starting Login Flow...");
        const verifier = generateRandomString(128);
        const challenge = await generateChallenge(verifier);

        // SECURITY: Verifier lokal speichern, NICHT in den State packen!
        // State nur noch für CSRF nutzen
        const state = generateRandomString(16);
        try {
            localStorage.setItem('osm_pkce_verifier', verifier);
            localStorage.setItem('osm_auth_state', state);
        } catch (e) {
            console.error("LocalStorage Limit Reached?", e);
            alert("Fehler: Speicher voll. Bitte Cookies/Daten löschen.");
            return;
        }

        // FIX: offline_access removed as it caused "Invalid Scope" for some users
        const scope = 'read_prefs write_api';
        const url = `https://www.openstreetmap.org/oauth2/authorize?response_type=code&client_id=${this.options.client_id}&redirect_uri=${encodeURIComponent(this.options.redirect_uri)}&scope=${encodeURIComponent(scope)}&code_challenge=${challenge}&code_challenge_method=S256&state=${state}`;

        console.log("[Auth] Redirecting to:", url);
        window.location.href = url;
    },

    // 2. Exchange Code (Call this on callback)
    async exchangeCode(code) {
        // State prüfen (CSRF Schutz)
        const params = new URLSearchParams(window.location.search);
        const serverState = params.get('state');
        const localState = localStorage.getItem('osm_auth_state');

        // Fail-Closed: State MUST be present and match
        if (!serverState || !localState || serverState !== localState) {
            console.error("State Validation Failed!", { server: serverState, local: localState });
            throw new Error("Security Alert: OAuth State mismatch or missing! Possible CSRF Attack.");
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
                'User-Agent': USER_AGENT,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: bodyParams
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Token Exchange Failed (${res.status}): ${text}`);
        }

        const data = await res.json();

        // Calculate Expiration
        // OSM returns expires_in (seconds)
        if (data.expires_in) {
            data.expires_at = Date.now() + (data.expires_in * 1000);
        }

        // Save Token Data
        try {
            localStorage.setItem('osm-auth', JSON.stringify(data));
        } catch (e) {
            console.error("Failed to save token:", e);
        }

        // Cleanup Security Items
        localStorage.removeItem('osm_pkce_verifier');
        localStorage.removeItem('osm_auth_state');

        return data.access_token;
    },

    // Refresh Token Logic
    async refreshToken() {
        console.log("[Auth] Attempting Token Refresh...");
        try {
            const data = JSON.parse(localStorage.getItem('osm-auth'));
            if (!data || !data.refresh_token) {
                throw new Error("No refresh token available");
            }

            const bodyParams = new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: data.refresh_token,
                client_id: this.options.client_id,
                // scope is optional/implied
            });

            const res = await fetch('https://www.openstreetmap.org/oauth2/token', {
                method: 'POST',
                headers: {
                    'User-Agent': USER_AGENT,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: bodyParams
            });

            if (!res.ok) {
                const text = await res.text();
                // If refresh fails (e.g. revoked), logout
                if (res.status === 400 || res.status === 401) {
                    this.logout();
                }
                throw new Error(`Token Refresh Failed (${res.status}): ${text}`);
            }

            const newData = await res.json();

            // Merge new data (access_token, expires_in, maybe new refresh_token)
            // If new refresh_token is missing, keep old one? OSM usually rotates them?
            // "If the authorization server issues a new refresh token, the client must discard the old one."
            // If not provided, we assume old one is valid (though RFC says it usually is provided).

            const updatedData = { ...data, ...newData };

            if (newData.expires_in) {
                updatedData.expires_at = Date.now() + (newData.expires_in * 1000);
            }

            try {
                localStorage.setItem('osm-auth', JSON.stringify(updatedData));
            } catch (e) {
                console.error("Failed to save refreshed token:", e);
            }
            console.log("[Auth] Token Refreshed Successfully!");
            return updatedData.access_token;

        } catch (e) {
            console.error("[Auth] Refresh Error:", e);
            throw e;
        }
    },

    // 3. Get Auth Header (Async wrapper)
    async ensureToken() {
        let data = null;
        try {
            data = JSON.parse(localStorage.getItem('osm-auth'));
        } catch (e) { }

        if (!data || !data.access_token) return null;

        // Check Expiration (Buffer 60s)
        if (data.expires_at && Date.now() > (data.expires_at - 60000)) {
            console.log("[Auth] Token expired or close to expiry. Refreshing...");
            try {
                return await this.refreshToken();
            } catch (e) {
                console.warn("[Auth] Refresh failed, returning null (user needs login)", e);
                return null;
            }
        }

        return data.access_token;
    },

    authenticated() {
        // Simple check if we Have a token (even if expired, we might be able to refresh)
        // But for UI "Show Login Button", we should probably assume strictly valid?
        // Actually, if we have a refresh token, we ARE authenticated in session terms.
        const token = this.getToken();
        return !!token;
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
        localStorage.removeItem('osm_user_img');
    }
};

// Async Header Helper
export async function getAuthHeaderAsync() {
    const token = await auth.ensureToken();
    return token ? {
        'Authorization': `Bearer ${token}`,
        'User-Agent': USER_AGENT
    } : {
        'User-Agent': USER_AGENT
    };
}

// Deprecated Sync Helper (warns)
export function getAuthHeader() {
    console.warn("getAuthHeader() is deprecated. Use getAuthHeaderAsync() for auto-refresh support.");
    const token = auth.getToken();
    return token ? {
        'Authorization': `Bearer ${token}`,
        'User-Agent': USER_AGENT
    } : {
        'User-Agent': USER_AGENT
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
        const header = await getAuthHeaderAsync();
        const res = await fetch('https://api.openstreetmap.org/api/0.6/user/details', {
            headers: header
        });
        if (!res.ok) {
            // If token expired, maybe logout? For now just return err
            // If token expired, maybe logout? For now return null to indicate no valid user
            console.error("User Details Fetch Failed:", res.status);
            return null;
        }
        const text = await res.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");
        const user = xml.querySelector('user');

        if (user) {
            const name = user.getAttribute('display_name');
            try {
                localStorage.setItem('osm_user_name', name);
            } catch (e) { console.warn("Storage Full", e); }

            // Try to find image
            const img = user.querySelector('img');
            if (img && img.getAttribute('href')) {
                let imgUrl = img.getAttribute('href');

                // Fix: Ensure Absolute URL and trim
                if (imgUrl) {
                    imgUrl = imgUrl.trim();
                    if (imgUrl.startsWith('/')) {
                        imgUrl = 'https://www.openstreetmap.org' + imgUrl;
                    }
                    // Fix: Enforce HTTPS
                    if (imgUrl.startsWith('http://')) {
                        imgUrl = imgUrl.replace('http://', 'https://');
                    }
                    try {
                        localStorage.setItem('osm_user_img', imgUrl);
                    } catch (e) { console.warn("Storage Full", e); }
                }
            } else {
                localStorage.removeItem('osm_user_img');
            }

            return name;
        }
        return null;
    } catch (e) {
        // If offline but cached, return cached
        if (cached) return cached;
        console.error("Check Login Error:", e);
        return null;
    }
}
