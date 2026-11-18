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

    it('colours levelled log lines by class and escapes their text', async () => {
        document.body.innerHTML = '';
        let finish;

        showProcessOverlay(document.body, 'Saving', (log) => {
            log({ level: 'success', text: 'Standort: <img src=x onerror=alert(1)>' });
            log('plain <b>line</b>');
            return new Promise(resolve => { finish = resolve; });
        });

        const lines = document.body.querySelectorAll('.hj-log-line');
        expect(lines).toHaveLength(2);
        expect(lines[0].className).toContain('text-ivory');
        expect(lines[0].className).not.toContain('text-ivory/');
        expect(lines[0].textContent.trim()).toBe('Standort: <img src=x onerror=alert(1)>');
        expect(lines[1].className).toContain('text-ivory/60');
        expect(document.body.querySelector('img, b')).toBeNull();
        finish();
    });
});
