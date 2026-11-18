import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

describe('Referrer Policy', () => {
  it('limits referrers to the origin before loading page resources', () => {
    const policyIndex = html.indexOf('<meta name="referrer" content="strict-origin"');
    const firstResourceIndex = html.search(/<(?:link|script)\b/i);

    expect(policyIndex).toBeGreaterThan(-1);
    expect(policyIndex).toBeLessThan(firstResourceIndex);
  });
});
