import { describe, expect, it } from 'vitest';
import { AED_SIGN_GREEN, renderAedMarkerSymbol } from './aed-marker.js';

describe('AED map marker symbol', () => {
    it('renders a clearly separated white medical cross', () => {
        const html = renderAedMarkerSymbol();

        expect(AED_SIGN_GREEN).toBe('#008E5E');
        expect(html).toContain('viewBox="0 0 100 100"');
        expect(html).toContain(`<rect width="100" height="100" fill="${AED_SIGN_GREEN}" />`);
        expect(html).toContain('data-symbol="heart"');
        expect(html).toContain(`data-symbol="lightning" d="m42 34-15 23h12l-5 18 19-27H40l7-14Z" fill="${AED_SIGN_GREEN}"`);
        expect(html).toContain('data-symbol="medical-cross" d="M78');
        expect(html).toContain('data-symbol="medical-cross" d="M78 12h8v8h8v8h-8v8h-8v-8h-8v-8h8Z" fill="#fff"');
        expect(html).toContain('aria-hidden="true"');
        expect(html).toContain('focusable="false"');
    });
});
