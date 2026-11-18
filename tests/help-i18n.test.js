import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyTranslations, collectKeys, pickLanguage, SUPPORTED } from '../help/i18n.js';

const html = readFileSync(resolve(process.cwd(), 'help/index.html'), 'utf8');
const parse = () => new DOMParser().parseFromString(html, 'text/html');
const usedKeys = [...collectKeys(parse())].sort();

const locales = Object.fromEntries(
    await Promise.all(SUPPORTED.map(async (lang) => [lang, (await import(`../help/locales/${lang}.js`)).default])),
);

const normalize = (text) => text.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
const textOf = (markup) => {
    const el = document.createElement('div');
    el.innerHTML = markup;
    return el;
};

describe('help page translations', () => {
    it.each(SUPPORTED)('%s has exactly the keys the page uses', (lang) => {
        expect(Object.keys(locales[lang]).sort()).toEqual(usedKeys);
    });

    it.each(SUPPORTED)('%s has no empty strings', (lang) => {
        for (const [key, value] of Object.entries(locales[lang])) {
            expect(typeof value, key).toBe('string');
            expect(value.trim(), key).not.toBe('');
        }
    });

    it.each(SUPPORTED)('%s markup only links where German links and carries no script', (lang) => {
        const doc = parse();
        for (const el of doc.querySelectorAll('[data-i18n-html]')) {
            const key = el.getAttribute('data-i18n-html');
            const value = textOf(locales[lang][key]);
            const allowed = [...textOf(locales.de[key]).querySelectorAll('a')].map((a) => a.getAttribute('href'));
            for (const a of value.querySelectorAll('a')) expect(allowed, key).toContain(a.getAttribute('href'));
            expect(value.querySelector('script, iframe, img, style'), key).toBeNull();
            for (const node of value.querySelectorAll('*')) {
                for (const attr of node.attributes) expect(attr.name.startsWith('on'), `${key} ${attr.name}`).toBe(false);
            }
        }
    });

    it('German file matches the text written in the page', () => {
        const doc = parse();
        const de = locales.de;
        for (const el of doc.querySelectorAll('[data-i18n]')) {
            const key = el.getAttribute('data-i18n');
            expect(normalize(el.textContent), key).toBe(normalize(de[key]));
        }
        for (const el of doc.querySelectorAll('[data-i18n-html]')) {
            const key = el.getAttribute('data-i18n-html');
            expect(normalize(el.textContent), key).toBe(normalize(textOf(de[key]).textContent));
        }
        for (const el of doc.querySelectorAll('[data-i18n-aria]')) {
            const key = el.getAttribute('data-i18n-aria');
            expect(el.getAttribute('aria-label'), key).toBe(de[key]);
        }
        expect(doc.title).toBe(de['meta.title']);
    });

    it('offers every supported language in the switcher', () => {
        const options = [...parse().querySelectorAll('#lang-select option')].map((o) => o.value);
        expect(options.sort()).toEqual([...SUPPORTED].sort());
    });

    it('swaps text, markup, labels and the title', () => {
        const doc = parse();
        applyTranslations(doc, locales.en);
        expect(doc.querySelector('[data-i18n="nav.guide"]').textContent).toBe('Guide');
        expect(doc.querySelector('#hero-title em').textContent).toContain('20');
        expect(doc.querySelector('.topnav').getAttribute('aria-label')).toBe('Help navigation');
        expect(doc.title).toBe(locales.en['meta.title']);
    });
});

describe('help page language choice', () => {
    it('prefers ?lang=, then the app setting, then the browser', () => {
        expect(pickLanguage({ url: 'fr', stored: 'de', browser: ['ja'] })).toBe('fr');
        expect(pickLanguage({ url: null, stored: 'pl', browser: ['ja'] })).toBe('pl');
        expect(pickLanguage({ url: null, stored: null, browser: ['sv-SE', 'nl-BE'] })).toBe('nl');
    });

    it('ignores unknown codes and falls back to English', () => {
        expect(pickLanguage({ url: 'xx', stored: '<script>', browser: ['sv'] })).toBe('en');
    });
});
