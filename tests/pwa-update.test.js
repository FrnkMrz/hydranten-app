import { afterEach, describe, expect, it, vi } from 'vitest';
import { initPwaUpdates } from '../src/services/pwa-update.js';

describe('PWA update notification', () => {
    afterEach(() => {
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    it('offers and applies a waiting update', async () => {
        const updateServiceWorker = vi.fn().mockResolvedValue(undefined);
        let callbacks;
        const registerServiceWorker = vi.fn(options => {
            callbacks = options;
            return updateServiceWorker;
        });

        const cleanup = initPwaUpdates(registerServiceWorker);
        callbacks.onNeedRefresh();

        const banner = document.getElementById('app-update-banner');
        const updateButton = document.getElementById('app-update-btn');
        expect(banner).not.toBeNull();
        expect(updateButton).not.toBeNull();

        updateButton.click();
        await vi.waitFor(() => {
            expect(updateServiceWorker).toHaveBeenCalledWith(true);
        });

        cleanup();
        expect(document.getElementById('app-update-banner')).toBeNull();
    });

    it('does not show duplicate update notifications', () => {
        let callbacks;
        const cleanup = initPwaUpdates(options => {
            callbacks = options;
            return vi.fn();
        });

        callbacks.onNeedRefresh();
        callbacks.onNeedRefresh();

        expect(document.querySelectorAll('#app-update-banner')).toHaveLength(1);
        cleanup();
    });
});
