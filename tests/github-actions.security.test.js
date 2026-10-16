import { readFileSync, readdirSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflowsDirectory = resolve(process.cwd(), '.github/workflows');
const workflowFiles = readdirSync(workflowsDirectory, { withFileTypes: true })
  .filter(entry => entry.isFile() && ['.yml', '.yaml'].includes(extname(entry.name)))
  .map(entry => join(workflowsDirectory, entry.name));

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
      const reference = line.match(/^\s*(?:-\s*)?uses:\s*[^@\s]+@([0-9a-f]{40})\s+#\s+v\d+/i);
      expect(reference, `Action in ${path} is not SHA-pinned: ${line.trim()}`).not.toBeNull();
    }
  });
});
