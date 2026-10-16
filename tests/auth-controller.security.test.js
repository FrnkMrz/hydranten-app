import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/services/auth.js', () => ({
    auth: { exchangeCode: vi.fn() },
}));

import { auth } from '../src/services/auth.js';
import { handleAuthCallback } from '../src/controllers/auth-controller.js';

describe('OAuth callback security', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        auth.exchangeCode.mockResolvedValue('sensitive-access-token');
    });

    it('does not display the authorization code or access token in the UI log', async () => {
        const app = document.createElement('div');
        const authorizationCode = 'sensitive-authorization-code';

        handleAuthCallback(`?code=${authorizationCode}`, '', app, {
            showSettings: vi.fn(),
            showIntro: vi.fn(),
        });

        await vi.waitFor(() => {
            expect(app.textContent).toContain('Anmeldung erfolgreich.');
        });

        expect(app.textContent).not.toContain(authorizationCode);
        expect(app.textContent).not.toContain('sensitive-access-token');
    });
});
