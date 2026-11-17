// Entry for the help page (/help/): styles, plus the page's own translations.
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import './help.css';
import { applyTranslations, pickLanguage, SUPPORTED, RTL } from './i18n.js';

// One chunk per language, loaded only when needed.
const loaders = import.meta.glob('./locales/*.js');

let current = 'de';

async function setLanguage(lang) {
    const loader = loaders[`./locales/${lang}.js`];
    if (!loader) return;
    const { default: strings } = await loader();
    applyTranslations(document, strings);
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL.has(lang) ? 'rtl' : 'ltr';
    current = lang;
    const select = document.getElementById('lang-select');
    if (select) select.value = lang;
}

function readStoredAppLanguage() {
    // The app keeps its language under this key on the same origin.
    try {
        return localStorage.getItem('language');
    } catch {
        return null;
    }
}

async function init() {
    const params = new URLSearchParams(location.search);
    const lang = pickLanguage({
        url: params.get('lang'),
        stored: readStoredAppLanguage(),
        browser: navigator.languages?.length ? navigator.languages : [navigator.language],
    });

    // German is already in the HTML; any other language is swapped in.
    if (lang !== 'de') await setLanguage(lang);

    const select = document.getElementById('lang-select');
    if (select) {
        select.value = current;
        select.closest('.lang-switch').hidden = false;
        select.addEventListener('change', async () => {
            const next = select.value;
            if (!SUPPORTED.includes(next)) return;
            await setLanguage(next);
            // Remember the choice in the URL only: the page never changes the
            // app's own language setting.
            const url = new URL(location.href);
            if (next === 'de') url.searchParams.delete('lang');
            else url.searchParams.set('lang', next);
            history.replaceState(null, '', url);
        });
    }
}

init();
