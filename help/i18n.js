// Translation helpers for the help page. Kept free of browser globals so they
// can be unit tested.

/** Languages the help page ships, in the same set as the app. */
export const SUPPORTED = ['de', 'en', 'ar', 'cs', 'es', 'fr', 'hr', 'it', 'ja', 'ko', 'nl', 'pl', 'pt', 'tr', 'zh'];

export const RTL = new Set(['ar']);

/** Keys that are not in the markup but set from script (title, meta). */
export const META_KEYS = ['meta.title', 'meta.description'];

/**
 * Picks the page language: an explicit ?lang= wins, then the language the
 * app stored, then the browser's languages. Falls back to English, like the
 * app does.
 */
export function pickLanguage({ url, stored, browser = [] }) {
    const ok = (code) => (code && SUPPORTED.includes(code) ? code : null);
    return (
        ok(url) ||
        ok(stored) ||
        browser.map((tag) => ok(String(tag).toLowerCase().split('-')[0])).find(Boolean) ||
        'en'
    );
}

/** Collects every translation key the markup uses. */
export function collectKeys(root) {
    const keys = new Set(META_KEYS);
    for (const attr of ['data-i18n', 'data-i18n-html', 'data-i18n-aria']) {
        for (const el of root.querySelectorAll(`[${attr}]`)) keys.add(el.getAttribute(attr));
    }
    return keys;
}

/**
 * Writes the strings into the document. Missing keys keep the text that is
 * already there. `data-i18n-html` values come from the locale files in this
 * repository, never from user input.
 */
export function applyTranslations(doc, strings) {
    for (const el of doc.querySelectorAll('[data-i18n]')) {
        const value = strings[el.getAttribute('data-i18n')];
        if (value != null) el.textContent = value;
    }
    for (const el of doc.querySelectorAll('[data-i18n-html]')) {
        const value = strings[el.getAttribute('data-i18n-html')];
        if (value != null) el.innerHTML = value;
    }
    for (const el of doc.querySelectorAll('[data-i18n-aria]')) {
        const value = strings[el.getAttribute('data-i18n-aria')];
        if (value != null) el.setAttribute('aria-label', value);
    }
    if (strings['meta.title']) doc.title = strings['meta.title'];
    const description = doc.querySelector('meta[name="description"]');
    if (description && strings['meta.description']) description.setAttribute('content', strings['meta.description']);
}
