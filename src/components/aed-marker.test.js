import { describe, expect, it } from 'vitest';
import { renderAedMarkerSymbol } from './aed-marker.js';

describe('AED map marker symbol', () => {
    it('renders the ISO 7010 E010 sign colors and pictograms', () => {
        const html = renderAedMarkerSymbol();

        expect(html).toContain('viewBox="0 0 100 100"');
        expect(html).toContain('fill="#009640"');
        expect(html).toContain('fill="#fff"');
        expect(html).toContain('aria-hidden="true"');
        expect(html).toContain('focusable="false"');
    });
});
