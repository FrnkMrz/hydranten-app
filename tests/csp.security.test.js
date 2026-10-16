import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createDevCspStylePlugin } from '../scripts/dev-csp-style-plugin.js';

const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([\s\S]*?)">/)?.[1] || '';

describe('Content Security Policy', () => {
  it('allows scripts only from the app origin', () => {
    expect(csp).toMatch(/script-src\s+'self';/);
    expect(csp).not.toContain('cdnjs.cloudflare.com');
  });

  it('restricts base elements to the app origin', () => {
    expect(csp).toMatch(/base-uri\s+'self';/);
  });

  it('allows app stylesheets and needed style attributes without allowing inline style blocks', () => {
    expect(csp).toMatch(/style-src\s+'self';/);
    expect(csp).toMatch(/style-src-attr\s+'unsafe-inline';/);
    expect(csp).not.toMatch(/style-src\s+[^;]*'unsafe-inline'/);
  });

  it('allows Vite style injection only in the development server', () => {
    const plugin = createDevCspStylePlugin();
    const developmentHtml = plugin.transformIndexHtml(html);
    const developmentCsp = developmentHtml.match(/<meta http-equiv="Content-Security-Policy" content="([\s\S]*?)">/)?.[1] || '';

    expect(plugin.apply).toBe('serve');
    expect(developmentCsp).toMatch(/style-src-elem\s+'self'\s+'unsafe-inline';/);
    expect(csp).not.toContain('style-src-elem');
  });
});
