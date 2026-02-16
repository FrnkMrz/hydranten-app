
import de from '../locales/de.js';
import en from '../locales/en.js';
import pl from '../locales/pl.js';
import cs from '../locales/cs.js';
import fr from '../locales/fr.js';
import nl from '../locales/nl.js';
import es from '../locales/es.js';
import pt from '../locales/pt.js';
import hr from '../locales/hr.js';
import it from '../locales/it.js';
import ja from '../locales/ja.js';
import ko from '../locales/ko.js';
import zh from '../locales/zh.js';
import tr from '../locales/tr.js';
import ar from '../locales/ar.js';

const locales = {
    de, en, pl, cs, fr, nl, es, pt, hr, it, ja, ko, zh, tr, ar
};

// Default fallback
const DEFAULT_LANG = 'en';

// Detect Browser Language or Load from Storage
function detectLanguage() {
    const stored = localStorage.getItem('language');
    if (stored && locales[stored]) return stored;

    const browserLang = navigator.language.split('-')[0]; // 'de-DE' -> 'de'
    return locales[browserLang] ? browserLang : DEFAULT_LANG;
}

const currentLang = detectLanguage();
const translations = locales[currentLang];

// RTL Support
if (currentLang === 'ar') {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
} else {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = currentLang;
}

console.log(`i18n: Language detected: ${currentLang}, RTL: ${currentLang === 'ar'}`);

/**
 * Get translation for key.
 * @param {string} key - Dot notation e.g. 'intro.start'
 * @returns {string} Translated text or key if missing
 */
export function t(key) {
    const keys = key.split('.');

    // 1. Try current language
    let value = translations;
    let found = true;
    for (const k of keys) {
        if (value && value[k] !== undefined) {
            value = value[k];
        } else {
            found = false;
            break;
        }
    }
    if (found) return value;

    // 2. Fallback to English
    let fallback = en;
    for (const k of keys) {
        if (fallback && fallback[k] !== undefined) {
            fallback = fallback[k];
        } else {
            console.warn(`i18n: Missing translation for ${key} in ${currentLang} & EN`);
            return key;
        }
    }
    return fallback;
}

export const lang = currentLang;

export function setLanguage(langCode) {
    if (locales[langCode]) {
        localStorage.setItem('language', langCode);
        window.location.reload();
    }
}
