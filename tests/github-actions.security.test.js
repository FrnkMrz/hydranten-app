import { readFileSync, readdirSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflowsDirectory = resolve(process.cwd(), '.github/workflows');
const workflowFiles = readdirSync(workflowsDirectory, { withFileTypes: true })
  .filter(entry => entry.isFile() && ['.yml', '.yaml'].includes(extname(entry.name)))
  .map(entry => join(workflowsDirectory, entry.name));

function isPinnedOrLocalAction(line) {
  const target = line.match(/^\s*(?:-\s*)?uses:\s*([^\s#]+)/)?.[1];
  if (!target) return false;
  if (target.startsWith('./')) return true;
  return /^[^@]+@[0-9a-f]{40}\s+#\s+v\d+/i.test(line.trim().replace(/^(?:-\s*)?/, ''));
}

describe('GitHub Actions security', () => {
  it('pins every external action in every workflow to a full SHA and documents its release tag', () => {
    expect(workflowFiles.length).toBeGreaterThan(0);

    const workflows = workflowFiles.map(path => ({ path, content: readFileSync(path, 'utf8') }));
    const usesLines = workflows.flatMap(({ path, content }) => content
      .split('\n')
      .filter(line => /^\s*(?:-\s*)?uses:\s*/.test(line))
      .map(line => ({ path, line })));

    expect(usesLines.length).toBeGreaterThan(0);
    expect(usesLines.some(({ line }) => /^\s*-\s*uses:\s*/.test(line))).toBe(true);
    for (const { path, line } of usesLines) {
      expect(isPinnedOrLocalAction(line), `Action in ${path} is not SHA-pinned: ${line.trim()}`).toBe(true);
    }
  });

  it('allows repository-local actions without an external commit SHA', () => {
    expect(isPinnedOrLocalAction('      uses: ./path/to/action')).toBe(true);
    expect(isPinnedOrLocalAction('      uses: actions/checkout@v6')).toBe(false);
  });
});
