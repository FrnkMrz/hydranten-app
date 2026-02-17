import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCheckLogin = vi.fn();

vi.mock('../src/services/auth.js', () => ({
  auth: {},
  checkLogin: (...args) => mockCheckLogin(...args),
}));

import { renderHistoryView, initHistoryView } from '../src/components/history-view.js';

global.fetch = vi.fn();

async function flushAsyncWork() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('History View Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('escapes untrusted comment and created_by values', async () => {
    mockCheckLogin.mockResolvedValueOnce('SafeUser');

    const xml = `
      <osm>
        <changeset id="123" created_at="2026-02-17T12:00:00Z">
          <tag k="comment" v="&lt;img src=x onerror=alert(1)&gt;"/>
          <tag k="created_by" v="&lt;script&gt;alert('x')&lt;/script&gt;"/>
        </changeset>
      </osm>
    `;

    fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => xml,
    });

    const container = document.createElement('div');
    container.innerHTML = renderHistoryView();
    initHistoryView(container, () => {});
    await flushAsyncWork();

    const html = container.querySelector('#history-content').innerHTML;
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&lt;script&gt;alert(');
    expect(html).not.toContain('<script>');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('skips invalid non-numeric changeset ids', async () => {
    mockCheckLogin.mockResolvedValueOnce('SafeUser');

    const xml = `
      <osm>
        <changeset id="abc" created_at="2026-02-17T12:00:00Z">
          <tag k="comment" v="test"/>
        </changeset>
      </osm>
    `;

    fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => xml,
    });

    const container = document.createElement('div');
    container.innerHTML = renderHistoryView();
    initHistoryView(container, () => {});
    await flushAsyncWork();

    const html = container.querySelector('#history-content').innerHTML;
    expect(html).not.toContain('openstreetmap.org/changeset/');
  });
});
