// tests/auth.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auth, checkLogin } from '../src/services/auth.js';

// Mock Fetch
global.fetch = vi.fn();

// Mock LocalStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn(key => store[key] || null),
        setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
        removeItem: vi.fn(key => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; })
    };
})();
global.localStorage = localStorageMock;

// Mock Window properties (location)
delete window.location;
window.location = { href: '', origin: 'http://localhost', pathname: '/', search: '' };
Object.defineProperty(window, 'crypto', {
    value: {
        getRandomValues: (arr) => arr.fill(1),
        subtle: { digest: () => Promise.resolve(new ArrayBuffer(32)) }
    }
});

describe('Auth Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        window.location.search = '';
    });

    it('generates login URL and redirects', async () => {
        await auth.login();
        expect(localStorage.setItem).toHaveBeenCalledWith('osm_pkce_verifier', expect.any(String));
        // Also checks that state is set
        expect(localStorage.setItem).toHaveBeenCalledWith('osm_auth_state', expect.any(String));
        expect(window.location.href).toContain('openstreetmap.org/oauth2/authorize');
    });

    it('exchanges code for token successfully', async () => {
        // Setup State
        const STATE = 'valid-state';
        localStorage.setItem('osm_auth_state', STATE);
        window.location.search = `?code=test-code&state=${STATE}`;

        // Setup Mock Response
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ access_token: 'test-token', expires_in: 3600 })
        });

        localStorage.setItem('osm_pkce_verifier', 'test-verifier');

        const token = await auth.exchangeCode('test-code', STATE);
        expect(token).toBe('test-token');
        expect(localStorage.setItem).toHaveBeenCalledWith('osm-auth', expect.stringContaining('test-token'));
    });

    it('handles token exchange failure (server error)', async () => {
        // Setup State
        const STATE = 'valid-state';
        localStorage.setItem('osm_auth_state', STATE);
        window.location.search = `?code=bad-code&state=${STATE}`;

        fetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            text: async () => "Bad Request"
        });
        localStorage.setItem('osm_pkce_verifier', 'test-verifier');

        await expect(auth.exchangeCode('bad-code', STATE)).rejects.toThrow('Token Exchange Failed (400)');
    });

    it('consumes state and verifier once the exchange starts', async () => {
        localStorage.setItem('osm_auth_state', 'valid-state');
        localStorage.setItem('osm_pkce_verifier', 'test-verifier');
        fetch.mockResolvedValueOnce({ ok: false, status: 400, text: async () => 'Bad Request' });

        await expect(auth.exchangeCode('code', 'valid-state')).rejects.toThrow('Token Exchange Failed');

        expect(localStorage.getItem('osm_auth_state')).toBeNull();
        expect(localStorage.getItem('osm_pkce_verifier')).toBeNull();
        await expect(auth.exchangeCode('code', 'valid-state')).rejects.toThrow('State mismatch');
    });

    it('rejects a token response without an access token', async () => {
        localStorage.setItem('osm_auth_state', 'valid-state');
        localStorage.setItem('osm_pkce_verifier', 'test-verifier');
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ error: 'nope' }) });

        await expect(auth.exchangeCode('code', 'valid-state')).rejects.toThrow('access token');
        expect(localStorage.getItem('osm-auth')).toBeNull();
    });

    it('never logs the OAuth state or redirect URL', async () => {
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await auth.login();
        const state = localStorage.setItem.mock.calls.find(([key]) => key === 'osm_auth_state')[1];
        await expect(auth.exchangeCode('code', 'wrong-state')).rejects.toThrow('State mismatch');

        const logged = JSON.stringify([...logSpy.mock.calls, ...errorSpy.mock.calls]);
        expect(state).toHaveLength(32);
        expect(logged).not.toContain(state);
        expect(logged).not.toContain('wrong-state');
        logSpy.mockRestore();
        errorSpy.mockRestore();
    });

    it('stores only https avatar URLs', async () => {
        localStorage.setItem('osm-auth', JSON.stringify({ access_token: 'token' }));
        const details = href => ({
            ok: true,
            text: async () => `<osm><user display_name="Tester"><img href="${href}"/></user></osm>`
        });

        fetch.mockResolvedValueOnce(details('javascript:alert(1)'));
        await checkLogin();
        expect(localStorage.getItem('osm_user_img')).toBeNull();

        fetch.mockResolvedValueOnce(details('/avatar.png'));
        await checkLogin();
        expect(localStorage.getItem('osm_user_img')).toBe('https://www.openstreetmap.org/avatar.png');
    });

    it('handles state mismatch', async () => {
        localStorage.setItem('osm_auth_state', 'state-A');

        await expect(auth.exchangeCode('code', 'state-B')).rejects.toThrow('Security Alert');
    });

    it('rejects missing oauth state (fail-closed)', async () => {
        localStorage.setItem('osm_auth_state', 'state-A');

        await expect(auth.exchangeCode('code', null)).rejects.toThrow('Security Alert');
    });

    it('checkLogin returns null on error', async () => {
        // Mock authenticated check to true
        localStorage.setItem('osm-auth', JSON.stringify({ access_token: 'abc' }));

        // Mock User Details fetch failing (make sure text() exists even if logic doesn't call it on 500, but better safe)
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            text: async () => "Error"
        });

        const result = await checkLogin();
        expect(result).toBeNull();
    });

    it('checkLogin parses user details correctly', async () => {
        localStorage.setItem('osm-auth', JSON.stringify({ access_token: 'abc' }));

        const mockXML = `<user display_name="TestUser"><img href="http://test.com/avatar.jpg"/></user>`;
        fetch.mockResolvedValueOnce({
            ok: true,
            text: async () => mockXML
        });

        const name = await checkLogin();
        expect(name).toBe('TestUser');
        expect(localStorage.setItem).toHaveBeenCalledWith('osm_user_img', 'https://test.com/avatar.jpg');
    });
});
