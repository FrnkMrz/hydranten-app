
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module path fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.resolve(__dirname, '../package.json');
const swPath = path.resolve(__dirname, '../public/sw.js');

try {
    // Read package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const version = packageJson.version;
    const cacheName = `hydranten-app-v${version}`;

    // Read sw.js
    let swContent = fs.readFileSync(swPath, 'utf8');

    // Replace cache name
    // Regex matches: const CACHE_NAME = 'hydranten-app-v...';
    // We want to be careful not to break the file if format changes slightly, 
    // but we can assume the variable name is CACHE_NAME.

    const regex = /const CACHE_NAME = 'hydranten-app-v[^']*';/;

    if (regex.test(swContent)) {
        const newContent = swContent.replace(regex, `const CACHE_NAME = '${cacheName}';`);

        if (newContent !== swContent) {
            fs.writeFileSync(swPath, newContent, 'utf8');
            console.log(`✅ Updated Service Worker Cache to: ${cacheName}`);
        } else {
            console.log(`ℹ️ Service Worker already on version: ${cacheName}`);
        }
    } else {
        console.error("❌ Could not find CACHE_NAME definition in sw.js");
        process.exit(1);
    }

} catch (err) {
    console.error("❌ Error updating SW version:", err);
    process.exit(1);
}
