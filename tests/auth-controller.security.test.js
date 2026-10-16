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

    it('does not display the authorization code or access token in the UI log', async () => {
        const app = document.createElement('div');
        const authorizationCode = 'authCodeSecret123';

        handleAuthCallback(`?code=${authorizationCode}`, '', app, {
            showSettings: vi.fn(),
            showIntro: vi.fn(),
        });

        await vi.waitFor(() => {
            expect(app.textContent).toContain(t('general.success'));
        });

        expect(app.textContent).not.toContain(authorizationCode);
        expect(app.textContent).not.toContain(authorizationCode.substring(0, 5));
        expect(app.textContent).not.toContain(accessToken);
        expect(app.textContent).not.toContain(accessToken.substring(0, 10));
    });
});
