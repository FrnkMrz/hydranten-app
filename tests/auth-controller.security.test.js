import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/services/auth.js', () => ({
    auth: { exchangeCode: vi.fn() },
}));

import { auth } from '../src/services/auth.js';
import { handleAuthCallback } from '../src/controllers/auth-controller.js';
import { t } from '../src/services/i18n.js';

describe('OAuth callback security', () => {
    const accessToken = 'accessTokenSecret123';

    beforeEach(() => {
        vi.clearAllMocks();
        auth.exchangeCode.mockResolvedValue(accessToken);
    });

    it('clears OAuth callback credentials from the URL and UI log', async () => {
        const app = document.createElement('div');
        const authorizationCode = 'authCodeSecret123';
        const state = 'oauthStateSecret456';
        window.history.replaceState({}, document.title, `/?code=${authorizationCode}&state=${state}`);

        handleAuthCallback(`?code=${authorizationCode}&state=${state}`, '', app, {
            showSettings: vi.fn(),
            showIntro: vi.fn(),
        });

        expect(window.location.search).toBe('');
        expect(auth.exchangeCode).toHaveBeenCalledWith(authorizationCode, state);

        await vi.waitFor(() => {
            expect(app.textContent).toContain(t('general.success'));
        });

        expect(app.textContent).not.toContain(authorizationCode);
        expect(app.textContent).not.toContain(authorizationCode.substring(0, 5));
        expect(app.textContent).not.toContain(accessToken);
        expect(app.textContent).not.toContain(accessToken.substring(0, 10));
        expect(window.location.href).not.toContain(authorizationCode);
        expect(window.location.href).not.toContain(state);
    });
});
