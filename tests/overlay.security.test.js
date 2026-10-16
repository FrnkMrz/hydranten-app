import { describe, expect, it, vi } from 'vitest';
import { showProcessOverlay } from '../src/components/overlay.js';

describe('process overlay security', () => {
    it('renders OSM identifiers as text instead of HTML', async () => {
        document.body.innerHTML = '';
        const maliciousId = '<img src=x onerror=alert(1)>';

        showProcessOverlay(document.body, 'Saving', async () => ({
            id: maliciousId,
            changeset: maliciousId,
        }));

        await vi.waitFor(() => {
            expect(document.body.textContent).toContain(maliciousId);
        });

        expect(document.body.querySelector('img')).toBeNull();
    });
});
