import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, '../src/locales');
const REFERENCE_LANG = 'en.js';

// Helper to flatten object keys
function flattenKeys(obj, prefix = '') {
    return Object.keys(obj).reduce((acc, k) => {
        const pre = prefix.length ? prefix + '.' : '';
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
            Object.assign(acc, flattenKeys(obj[k], pre + k));
        } else {
            acc[pre + k] = true;
        }
        return acc;
    }, {});
}

async function loadLocale(filename) {
    const filePath = path.join(LOCALES_DIR, filename);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Quick & Dirty: Extract object from "export default { ... };"
    // We cannot dynamically import these easily in this script context without complexity,
    // so we use a simple eval-like approach or regex if simple enough.
    // BETTER: Use dynamic import() with absolute path
    try {
        const module = await import(filePath);
        return module.default;
    } catch (e) {
        console.error(`Error loading ${filename}:`, e);
        process.exit(1);
    }
}

async function verify() {
    console.log(`🔍 Verifying Translations (Reference: ${REFERENCE_LANG})...`);

    const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.js'));
    const refContent = await loadLocale(REFERENCE_LANG);
    const refKeys = Object.keys(flattenKeys(refContent));

    const CRITICAL_LANGS = ['en.js', 'de.js'];
    let hasCriticalError = false;

    for (const file of files) {
        if (file === REFERENCE_LANG) continue;

        const content = await loadLocale(file);
        const keys = Object.keys(flattenKeys(content));

        const missing = refKeys.filter(k => !keys.includes(k));

        if (missing.length > 0) {
            const isCritical = CRITICAL_LANGS.includes(file);
            const icon = isCritical ? '❌' : '⚠️';
            const msgLevel = isCritical ? 'Error' : 'Warning';

            console.error(`\n${icon} ${file} is missing ${missing.length} keys (${msgLevel}):`);
            missing.forEach(k => console.error(`   - ${k}`));

            if (isCritical) {
                hasCriticalError = true;
            }
        }
    }

    if (hasCriticalError) {
        console.error("\n💥 Critical Translation Verification FAILED (Main Languages incomplete).");
        process.exit(1);
    } else {
        console.log("\n✅ Critical translations (DE/EN) are complete. Others may have warnings.");
        process.exit(0);
    }
}

verify();
