# Hydranten Jäger

A Progressive Web App for crowdsourcing fire hydrant locations to OpenStreetMap. Users photograph hydrants, tag their properties, and upload them directly to OSM.

## Tech Stack

- **Vanilla JavaScript** (ES6 modules, no framework)
- **Vite 7** — build tool and dev server
- **Tailwind CSS 4** — utility-first styling via PostCSS
- **Leaflet 1.9** — interactive maps
- **Vitest** — unit testing with jsdom environment
- **GitHub Pages** — deployment via GitHub Actions

## Project Structure

```
src/
├── main.js                  # App entry, router, state, view orchestration
├── style.css                # Tailwind imports + custom styles
├── components/
│   ├── intro-view.js        # Home screen with Leaflet map + hydrant overlay
│   ├── camera-view.js       # Camera capture with GPS/compass status
│   ├── confirm-view.js      # Data entry form (create + edit mode)
│   ├── settings-view.js     # Account, map style, rank display
│   ├── history-view.js      # User's changeset history
│   └── rank-list-view.js    # Gamification rank overview
├── services/
│   ├── auth.js              # OAuth 2.0 PKCE with OSM
│   ├── osm.js               # OSM API client (CRUD nodes + changesets)
│   ├── overpass.js           # Overpass API with 3-server failover
│   ├── geo.js                # GPS tracking, compass, offset calculation
│   ├── hydrant-logic.js      # Tag preparation + type determination
│   ├── hydrant-logic.test.js # Unit tests for hydrant logic
│   ├── i18n.js               # Internationalization (15 languages)
│   ├── gamification.js       # Rank system (Bavarian fire brigade ranks)
│   ├── rank-graphics.js      # SVG badge generation
│   ├── photo-service.js      # EXIF GPS embedding + sharing
│   └── audio.js              # Success sound effects
└── locales/
    ├── de.js                 # German (primary language)
    ├── en.js                 # English (i18n reference/baseline)
    └── ... (13 more languages)
```

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # Run tests + production build
npm test             # Verify i18n completeness + run vitest
npm run verify:i18n  # Check all locales against en.js baseline
npm run preview      # Preview production build locally
```

## Key Patterns

### View Lifecycle
Views follow a render/init/cleanup pattern. `main.js` calls `renderXxxView()` to get HTML, sets `app.innerHTML`, then calls `initXxxView()` which returns a cleanup function. The cleanup runs before the next view switch.

### State
Simple mutable state object in `main.js`: `{ view, capturedBlob, location }`. No state library.

### Authentication
OAuth 2.0 PKCE flow with OpenStreetMap. Token stored in localStorage under `osm-auth`. The client ID is a public OAuth app credential (not a secret).

### OSM API Flow
1. Open changeset → 2. Create/update/delete node → 3. Close changeset. Each operation includes reverse geocoding via Nominatim for changeset comments.

### Optimistic UI
Created and deleted hydrants are cached in localStorage (`created_hydrants`, `deleted_hydrants`) so they appear/disappear on the map immediately without waiting for Overpass to re-index.

### i18n
Translations in `src/locales/*.js`. Access via `t('key.path')` from `services/i18n.js`. The `en.js` file is the reference — `scripts/verify-i18n.js` checks all locales for missing keys. German and English are critical (fail build if incomplete).

### Overpass Failover
Queries cycle through 3 servers (overpass-api.de → kumi.systems → maps.mail.ru) with automatic retry on timeout or rate limiting.

## Testing

Tests use Vitest with jsdom. Run `npm test` which also verifies i18n completeness. Currently only `hydrant-logic.test.js` has unit tests.

## Deployment

Push to `main` triggers `.github/workflows/deploy.yml`:
1. `npm ci` → `npm run build` (includes tests) → deploy `dist/` to GitHub Pages
2. Custom domain: `hydrantenjaeger.de` (configured via CNAME file)

## Important Notes

- The CSP in `index.html` restricts external connections — update it when adding new API endpoints
- Version string appears in `auth.js` and `osm.js` as User-Agent — keep in sync with `package.json`
- Service worker cache version in `public/sw.js` must be bumped manually on breaking changes
- GPS offset: the app positions the marker 3m ahead of the user (based on compass heading) because the photographer stands behind the hydrant
