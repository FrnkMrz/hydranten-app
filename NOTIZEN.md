# Projektnotizen

## Hosting der App: GitHub Pages oder Cloudflare

**Entscheidung (17.10.2026):** Die produktive App bleibt vorerst auf GitHub Pages. Einen Cloudflare-Proxy vor GitHub Pages schalten wir zunächst nicht vor.

### Warum

- GitHub Pages bietet bereits HTTPS für die eigene Domain.
- Für die statische PWA ist aktuell kein konkreter Leistungs- oder Funktionsgewinn durch einen zusätzlichen Proxy belegt.
- Ein Proxy bringt eine weitere Ebene für DNS, TLS-Zertifikate und Cache-Verhalten mit sich.
- Bei einer PWA müssen neue App-Versionen zuverlässig sichtbar werden. Aggressive Cache-Regeln könnten Updates verzögern.
- Cloudflare wird bereits für R2 und die regionalen PMTiles-Kartendaten genutzt. Das allein erfordert keinen Wechsel des App-Hostings.

### Falls Cloudflare-Hosting später getestet wird

- Cloudflare Pages zunächst parallel über eine Vorschau-Adresse testen, ohne die Produktiv-Domain umzuschalten.
- GitHub als Quell-Repository anbinden und prüfen, ob automatische Deployments sowie Pull-Request-Vorschauen unseren Workflow verbessern.
- Vor einem Wechsel die Build-Einstellungen, eigene Domain, Weiterleitungen und PWA-/Service-Worker-Updates prüfen.
- Cache-Regeln gezielt festlegen. Cloudflare cached statische Dateitypen standardmäßig; HTML wird laut Cloudflare standardmäßig nicht gecached.

### Quellen

- [GitHub Pages: HTTPS absichern](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
- [Cloudflare Pages: Git-Integration](https://developers.cloudflare.com/pages/configuration/git-integration/)
- [Cloudflare: Standard-Cache-Verhalten](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/)
- [Cloudflare Pages: Debugging bei eigenen Domains und Proxy](https://developers.cloudflare.com/pages/configuration/debugging-pages/)
