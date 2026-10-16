import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const workflow = readFileSync(resolve(process.cwd(), '.github/workflows/ci.yml'), 'utf8');

describe('GitHub Actions security', () => {
  it('pins every external action to a full commit SHA and keeps its release tag documented', () => {
    const usesLines = workflow.split('\n').filter(line => /^\s*uses:\s*/.test(line));

    expect(usesLines.length).toBeGreaterThan(0);
    for (const line of usesLines) {
      const reference = line.match(/^\s*uses:\s*[^@\s]+@([0-9a-f]{40})\s+#\s+v\d+/i);
      expect(reference, `Action is not SHA-pinned: ${line.trim()}`).not.toBeNull();
    }
  });
});
