/**
 * CI dependency audit: `npm audit --audit-level=high` with an allowlist.
 *
 * Fails on every high or critical advisory except the ones listed in
 * ALLOWLIST below. Each entry needs a reason and must be removed as soon as a
 * fixed version is available; the script warns when an entry no longer
 * matches anything so stale exceptions do not linger.
 *
 * Fails closed: if the audit cannot run or its output cannot be read, the
 * check fails.
 *
 * Usage: node scripts/audit-check.js [path/to/audit.json]
 * (The optional file replaces the live `npm audit --json` call, for testing.)
 */
import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';

const FAIL_SEVERITIES = new Set(['high', 'critical']);

const ALLOWLIST = [
    {
        id: 'GHSA-fc5q-39xc-vjpf',
        package: 'picomatch',
        added: '2026-11-17',
        reason:
            'ReDoS in picomatch <=4.0.7, which is the latest release, so no fixed ' +
            'version exists yet. Only reached through build and test tooling ' +
            '(vite, vitest, workbox); `npm audit --omit=dev` is clean, so nothing ' +
            'ships to users. Remove this entry once picomatch publishes a fix.',
    },
];

function readAudit() {
    const file = process.argv[2];
    if (file) return readFileSync(file, 'utf8');
    try {
        return execFileSync('npm', ['audit', '--json'], {
            encoding: 'utf8',
            maxBuffer: 32 * 1024 * 1024,
        });
    } catch (error) {
        // npm audit exits non-zero whenever it finds anything; the report is
        // still on stdout.
        if (error.stdout) return error.stdout;
        throw error;
    }
}

function collectAdvisories(report) {
    const advisories = new Map();
    for (const [name, vuln] of Object.entries(report.vulnerabilities ?? {})) {
        for (const via of vuln.via ?? []) {
            // String entries only point at another vulnerable package; the
            // advisory itself is listed under that package.
            if (typeof via !== 'object') continue;
            const id = String(via.url ?? '').split('/').pop() || `npm-${via.source}`;
            if (!advisories.has(id)) {
                advisories.set(id, {
                    id,
                    package: via.name ?? name,
                    severity: via.severity,
                    title: via.title,
                    range: via.range,
                    url: via.url,
                });
            }
        }
    }
    return [...advisories.values()];
}

function main() {
    let report;
    try {
        report = JSON.parse(readAudit());
    } catch (error) {
        console.error('❌ Could not run or parse npm audit:', error.message);
        process.exit(1);
    }

    if (report.error) {
        console.error('❌ npm audit reported an error:', report.error.summary ?? report.error);
        process.exit(1);
    }

    const allowed = new Map(ALLOWLIST.map((entry) => [entry.id, entry]));
    const relevant = collectAdvisories(report).filter((a) => FAIL_SEVERITIES.has(a.severity));
    const blocking = relevant.filter((a) => !allowed.has(a.id));
    const excepted = relevant.filter((a) => allowed.has(a.id));

    for (const advisory of excepted) {
        const entry = allowed.get(advisory.id);
        console.log(`⚠️  Allowed: ${advisory.id} (${advisory.package}, ${advisory.severity}) since ${entry.added}`);
        console.log(`   ${entry.reason}`);
    }

    const seen = new Set(relevant.map((a) => a.id));
    for (const entry of ALLOWLIST) {
        if (!seen.has(entry.id)) {
            console.log(`ℹ️  Allowlist entry ${entry.id} (${entry.package}) no longer matches anything. Remove it from scripts/audit-check.js.`);
        }
    }

    if (blocking.length > 0) {
        console.error(`\n❌ ${blocking.length} high/critical advisor${blocking.length === 1 ? 'y' : 'ies'} not on the allowlist:`);
        for (const a of blocking) {
            console.error(`   - ${a.id} ${a.package} ${a.range ?? ''} [${a.severity}] ${a.title ?? ''}`);
            if (a.url) console.error(`     ${a.url}`);
        }
        process.exit(1);
    }

    console.log(`\n✅ No high or critical advisories outside the allowlist.`);
}

main();
