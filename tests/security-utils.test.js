import { describe, it, expect } from 'vitest';
import { escapeHTML } from '../src/utils/security.js';

describe('Security Utils', () => {
  it('escapes HTML special characters', () => {
    const payload = `<img src="x" onerror='alert(1)'>&`;
    const escaped = escapeHTML(payload);

    expect(escaped).toBe('&lt;img src=&quot;x&quot; onerror=&#039;alert(1)&#039;&gt;&amp;');
  });

  it('returns empty string for falsy values', () => {
    expect(escapeHTML('')).toBe('');
    expect(escapeHTML(null)).toBe('');
    expect(escapeHTML(undefined)).toBe('');
  });
});
