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
window.location = { href: '', origin: 'http://localhost', pathname: '/' };
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
    });

    it('generates login URL and redirects', async () => {
        await auth.login();
        expect(localStorage.setItem).toHaveBeenCalledWith('osm_pkce_verifier', expect.any(String));
        expect(window.location.href).toContain('openstreetmap.org/oauth2/authorize');
    });

    it('exchanges code for token successfully', async () => {
        // Setup Mock Response
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ access_token: 'test-token', expires_in: 3600 })
        });

        localStorage.setItem('osm_pkce_verifier', 'test-verifier');

        const token = await auth.exchangeCode('test-code');
        expect(token).toBe('test-token');
        expect(localStorage.setItem).toHaveBeenCalledWith('osm-auth', expect.stringContaining('test-token'));
    });

    it('handles token exchange failure', async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            text: async () => "Bad Request"
        });
        localStorage.setItem('osm_pkce_verifier', 'test-verifier');

        await expect(auth.exchangeCode('bad-code')).rejects.toThrow('Token Exchange Failed (400)');
    });

    it('checkLogin returns null on error', async () => {
        // Mock authenticated check to true
        localStorage.setItem('osm-auth', JSON.stringify({ access_token: 'abc' }));

        // Mock User Details fetch failing
        fetch.mockResolvedValueOnce({ ok: false, status: 500 });

        const result = await checkLogin();
        expect(result).toBeNull(); // Should be null, not "Error: 500"
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
