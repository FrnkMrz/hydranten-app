# 🚒 Hydranten Jäger APP (v1.8.0)

**🌐 Live App:** [https://hydrantenjaeger.de](https://hydrantenjaeger.de)

Eine moderne, mobil-optimierte Progressive Web App (PWA) zum Erfassen und Pflegen von Hydranten, Löschwasserstellen und AEDs in OpenStreetMap (OSM).
Entwickelt für Geschwindigkeit, Einhand-Bedienung und Robustheit im Feld.

> **Status**: Release-Kandidat 1.8.0 – Veröffentlichung nach Merge und erfolgreichen Pflichtprüfungen
> *Features: regionale PMTiles-Daten für DACHLiLu, AED-Unterstützung, verbesserter Edit-Modus und kontrollierte PWA-Updates.*

### Version 1.7.0 (live seit 15.10.2026)

Version 1.7.0 mit AED-Unterstützung, verbessertem Edit-Modus und den zugehörigen Stabilitätsverbesserungen ist auf [hydrantenjaeger.de](https://hydrantenjaeger.de) verfügbar.

**Enthalten:**

* **AEDs / Defibrillatoren:** AEDs lassen sich über den Erfassungsablauf der App neu eintragen, auf der Karte finden und bearbeiten. Die Kartensuche findet OSM-Knoten mit `emergency=defibrillator`; Marker und Typauswahl zeigen das standardisierte Piktogramm ISO 7010 E010. Zugang, Innen-/Außenlage und Öffnungszeiten können ebenfalls gepflegt werden.
* **Wiederverwendung geladener Kartendaten:** Erfolgreich geladene Kartenausschnitte werden für drei Minuten im Arbeitsspeicher zwischengespeichert (höchstens zwölf Ausschnitte). Wenn ein späterer Kartenausschnitt vollständig darin liegt, entfällt die erneute Overpass-Anfrage.
* **Edit-Modus:** Beim Laden gibt es Abbrechen, bei vorübergehenden Fehlern Wiederholen und bei fehlgeschlagenem Laden eine Rückkehr zur Karte. Ladeabbrüche und Zeitüberschreitungen werden behandelt; AEDs erhalten einen passenden Bearbeitungstitel.
* **Bedienbarkeit:** Fokusdarstellung und reduzierte Animation bei entsprechender Systemeinstellung sind ergänzt.

### AED mit der App erfassen

1. Bei OpenStreetMap anmelden und **Starten** wählen.
2. Ein Foto des AED aufnehmen. Auf der Bestätigungsseite **Defibrillator** auswählen.
3. Den Standort auf der kleinen Karte prüfen oder anpassen und bekannte Angaben zu Zugang, Innen-/Außenlage, Öffnungszeiten und Referenz ergänzen.
4. Angaben prüfen und zu OpenStreetMap hochladen. Bestehende AEDs lassen sich über ihren Kartenmarker öffnen und bearbeiten.

### Release-Kandidat 1.8.0: Regionale Datenversorgung

Die regionale Datenversorgung ist in den Release-Kandidaten 1.8.0 aufgenommen, aber noch nicht durch diesen Release veröffentlicht. Innerhalb der vollständigen DACHLiLu-Abdeckung (Deutschland, Österreich, Schweiz, Liechtenstein und Luxemburg) zeigt die App zuerst die vorberechneten PMTiles-Kacheln von OpenFireMap. Anschließend fragt sie neue oder geänderte Objekte seit dem OSM-Datenstand des Quellextrakts über Overpass ab und ergänzt die Karte. Der Live-Abgleich hält die erste Anzeige der PMTiles nicht zurück. Außerhalb der exakten Abdeckung und bei Pipeline-Fehlern nutzt die App Overpass direkt.

**Datenstand und Grenzen:** `generated_at` kennzeichnet den Pipeline-Build; für den Overpass-Abgleich zählt `osm_data_until`, der OSM-Datenstand der Quellextrakte. Die Abfrage `newer:` findet neue und geänderte Objekte, aber keine Löschungen oder Änderungen, durch die ein Objekt aus den abgefragten Tags herausfällt. Solche Objekte können bis zum nächsten Pipeline-Build auf der Karte bleiben. Erfolgreiche eigene Bearbeitungen werden lokal überlagert, bis derselbe Stand aus der Datenversorgung zurückkommt.

**Overpass-Endpunkte und Zeitlimits:** Verwendet werden `overpass-api.de`, `lz4.overpass-api.de`, `z.overpass-api.de` und `overpass.kumi.systems`; `maps.mail.ru` wird nicht mehr genutzt. Verfügbare Instanzen werden gemischt abgefragt; nach Fehlern oder Rate-Limits gehen Instanzen kurzzeitig in Abkühlung. Das Client-Limit beträgt 12 Sekunden je Anfrage, 15 Sekunden für den Live-Abgleich und 30 Sekunden für den vollständigen Overpass-Fallback. Das serverseitige Query-Limit bleibt bei 25 Sekunden.

**Betrieb:** Der öffentliche R2-Endpunkt muss CORS-Anfragen vom App-Origin `https://hydrantenjaeger.de` erlauben. Falls die regionale Quelle nicht erreichbar ist, bleibt Overpass als Fallback verfügbar.

## 📋 Changelog

### v1.8.0 (Release-Kandidat, 15.10.2026) - Regionale Datenversorgung
*   **Schneller Kartenstart:** Für DACHLiLu werden vorberechnete OpenFireMap-PMTiles zuerst angezeigt; der Overpass-Live-Abgleich ergänzt anschließend neue und geänderte Objekte.
*   **Robuster Fallback:** Außerhalb der vollständigen PMTiles-Abdeckung und bei Fehlern der regionalen Quelle lädt die App Daten direkt über Overpass.
*   **Datenstand:** Die Dokumentation erklärt die Zeitstempel `generated_at` und `osm_data_until` sowie die Grenzen des `newer:`-Abgleichs.
*   **Overpass-Failover:** Verwendet werden die vier Instanzen `overpass-api.de`, `lz4.overpass-api.de`, `z.overpass-api.de` und `overpass.kumi.systems`; Fehler- und Rate-Limit-Instanzen werden zeitweise pausiert.
*   **Zeitlimits und Betrieb:** 12 Sekunden pro Anfrage, 15 Sekunden für den Live-Abgleich und 30 Sekunden für den vollständigen Fallback; die R2-Quelle benötigt CORS für `https://hydrantenjaeger.de`.

### v1.7.0 (15.10.2026) - AEDs, Kartendaten & Bearbeitungsmodus
*   **AEDs / Defibrillatoren:** AEDs über den Erfassungsablauf der App eintragen sowie auf der Karte finden und bearbeiten; ISO-7010-E010-Piktogramm und Felder für Zugang, Innen-/Außenlage und Öffnungszeiten.
*   **Kartendaten:** Erfolgreich geladene Ausschnitte werden kurzzeitig im Arbeitsspeicher wiederverwendet. Nach erfolgreichen Bearbeitungen wird der Cache aktualisiert.
*   **Edit-Modus:** Abbrechen und Wiederholen beim Laden, verständliche Fehlerbehandlung und AED-spezifischer Bearbeitungstitel.
*   **Bedienbarkeit:** Sichtbarer Tastaturfokus und reduzierte Animation entsprechend der Systemeinstellung.
*   **GPS-Sicherheit:** Neue Erfassungen benötigen einen höchstens 20 Sekunden alten Geräte-Fix mit maximal 40 m angegebener Ungenauigkeit. Veraltete, nicht verifizierbare Cache-Einträge werden abgewiesen.
*   **Deployment:** GitHub Pages wird nach einem Push auf `main` erst veröffentlicht, wenn Produktions-Build und mobile E2E-Prüfungen erfolgreich waren.
*   **Overpass-Failover:** Ungültige Abfragen (HTTP 400) werden sofort gemeldet. Bei anderen HTTP-Fehlern sowie Netzwerk-, Server-, Timeout- und Rate-Limit-Fehlern wird die nächste Instanz versucht.

### v1.6.0 (28.06.2026) - Konsolidierung & automatisierte Browser-Tests
*   **Release-Konsolidierung:** Die größeren Stabilitäts-, Datenschutz-, PWA- und Toolchain-Verbesserungen der jüngsten Wartungsrunde werden als neues Minor Release gebündelt.
*   **CI-E2E:** Alle 14 mobilen End-to-End-Tests für Chromium und WebKit laufen nun bei jedem Push und Pull Request verpflichtend in GitHub Actions.
*   **Testdiagnose:** Der Playwright-HTML-Report wird nach jedem CI-Lauf für 14 Tage als GitHub-Actions-Artefakt bereitgestellt.
*   **Repository-Hygiene:** Generierte Playwright-Reports und Laufstatusdateien sind nicht mehr Teil der Versionsverwaltung.
*   **Qualitätsstatus:** 36 Unit-/Integrationstests, 14 mobile E2E-Tests, PWA-Produktions-Build und npm-Sicherheitsaudit sind erfolgreich.

### v1.5.5 (28.06.2026) - PWA, Datenschutz & Toolchain
*   **PWA-Aktualisierung:** Neue App-Versionen werden aktiv angezeigt und können kontrolliert übernommen werden, ohne eine laufende Aufnahme oder Bearbeitung automatisch zu verwerfen.
*   **Datenschutz & i18n:** Die Hinweise zur lokalen Fotoverarbeitung, separaten GPS-Ermittlung und Übertragung an externe Dienste wurden in allen 15 Sprachen vereinheitlicht.
*   **CI/CD:** GitHub Actions und die CI-Laufzeit wurden auf aktuelle Versionen und Node.js 24 umgestellt.
*   **Toolchain:** Vite wurde auf 8.1 und jsdom auf 29.1 aktualisiert; der reproduzierbare Build mit `npm ci` bleibt ohne bekannte npm-Sicherheitslücken.
*   **Tests:** 36 Unit-/Integrationstests sowie 14 E2E-Tests für Mobile Chrome und Mobile Safari bestanden.

### v1.5.4 (27.06.2026) - Datenqualität, Datenschutz & Stabilität
*   **GPS-Sicherheit:** Uploads ohne belastbare Geräteposition werden blockiert; feste Ersatzkoordinaten werden nicht mehr verwendet.
*   **OSM-Datenqualität:** Typabhängige Tags werden korrekt bereinigt, leere Felder entfernen bestehende Werte und Knoten in OSM-Wegen können nicht unbeabsichtigt verschoben werden.
*   **OSM-Stabilität:** Changesets werden auch nach fehlgeschlagenen Schreibvorgängen zuverlässig geschlossen; bei Editierfehlern bleibt der Formularzustand erhalten.
*   **Datenschutz & Ressourcen:** App-Reset entfernt alle lokalen App-Daten; Foto-, Karten- und Browserressourcen werden beim Ansichtswechsel freigegeben.
*   **Accessibility & i18n:** Kartenmarker besitzen eine eindeutige interaktive Rolle und die polnische Übersetzung wurde vervollständigt.
*   **Tests:** Regressionstests für GPS-Ausfälle, OSM-Tags, Changeset-Abschluss und Wegknoten ergänzt; E2E-Abdeckung für Mobile Chrome und Mobile Safari aktiviert.

### v1.5.3 (24.02.2026) - GPS Polling & Layout Fixes
*   **Feature (GPS):** Einführung von kontinuierlichem **Background Polling (15s Intervall)** in der Intro-Ansicht. Die Position wird im Hintergrund aktualisiert, um sofort bereit zu sein, wenn der Nutzer auf "Starten" klickt.
*   **UI/UX (GPS):** Die Karte lädt nun verzögert (**Delayed Map Loading**), erst wenn das finale (verschlüsselte) GPS-Signal vorliegt. Zuvor wird ein eleganter Lade-Screen angezeigt (verhindert das Laden und anschließende Wegspringen veralteter Kartenkacheln).
*   **Fix (UI):** Layout-Bruch auf länglichen Android-Smartphones behoben. Der Karten-Container füllt nun flexibel den gesamten Platz aus (`absolute inset-0`), ohne dass das schwarze Bottom-Sheet unnatürlich in die Höhe gestreckt wird.

### v1.5.2 (23.02.2026) - Accessibility & Security Polish
*   **A11y (Accessibility)**: Vollständige Überarbeitung für mobile Screenreader (VoiceOver/TalkBack).
*   **A11y**: Leaflet `circleMarker` durch HTML `divIcon` `<button>`s ersetzt, um Kartenmarker per Wischgeste bedienbar zu machen.
*   **A11y**: Modale (Info, Sprache) zu HTML5 `<dialog>` umgebaut (`aria-modal`), um Screenreader-Fokus einzusperren.
*   **A11y**: Touch-Targets (Tippflächen) für alle relevanten Buttons auf die geforderten 44x44px vergrößert.
*   **A11y**: Ansichtswechsel werden nun per `aria-live` automatisch angesagt.
*   **A11y**: Text-Kontraste erhöht (`text-gray-400`), um Sichtbarkeit im im direkten Sonnenlicht zu garantieren.
*   **Security**: Behebung von npm `audit` Vulnerabilities (ReDoS in devDependencies).
*   **Fix**: GPS-Startup-Logik: Karte fokussiert nach App-Start nun automatisch die frisch gefundene Position.

### v1.5.1 (18.02.2026) - Code Quality & Docs
*   **CI/CD**: Vollständige Pipeline für Linting, Tests und Build-Checks integriert.
*   **Documentation**: Technische Architektur und Tech-Stack detailliert in README dokumentiert.
*   **Code Quality**: Bereinigung aller Linting-Fehler (Unused Vars, Duplikate) für eine saubere Codebasis.
*   **Optimization**: Entfernung von totem Code.

### v1.5.0 (17.02.2026) - Security Hardened
*   **Security**: DOM-XSS Findings (P1) behoben (Output Encoding in History & Intro).
*   **Security**: OAuth State Validation (P2) auf "Fail-Closed" gehärtet.
*   **Security**: Content Security Policy (P3) verschärft (kein `unsafe-inline` für Scripts).
*   **Security**: Changeset-IDs validiert & externe Links (`noopener`) abgesichert.
*   **Feature**: `escapeHTML` Utility für zentralen Schutz.

### v1.4.1 (16.02.2026) - Refactoring & Testing
*   **Refactoring**: `createHydrant` Function Clean-up (toter Parameter entfernt).
*   **Refactoring**: `checkLogin` Error-Handling verbessert (keine "Error: 401" Namen mehr).
*   **Refactoring**: Magic Numbers in `constants.js` ausgelagert.
*   **Tests**: Unit-Tests für `auth`, `osm` und `overpass` Services hinzugefügt (Vitest).
*   **i18n**: Hardcodierte Strings in `main.js` durch `t()` Übersetzungsfunktionen ersetzt.
*   **i18n**: Fehlende Übersetzungen für `general` und `messages` Sektionen in 13 Sprachen ergänzt.
*   **Refactoring**: `confirm-view.js` (960 Zeilen) in 4 Module aufgeteilt (`template`, `map`, `form`, `photo`).
*   **Refactoring**: Wiederverwendbare Overlay-Utility extrahiert (`overlay.js`).
*   **Feature**: Token-Refresh-Handling für automatische OAuth-Erneuerung.
*   **Feature**: Tap-to-Move und Fullscreen-Karte im Edit Mode.
*   **Fix**: Native `alert()` Aufrufe durch App-eigene Overlays ersetzt.
*   **Fix**: Versionsduplikation behoben (zentrale `version.js` + automatisches SW-Update).
*   **Fix**: Fehlende Helper-Funktionen (`normalizeTags`, `escapeXml` etc.) in `osm.js` wiederhergestellt.
*   **Tests**: Erweiterte Tests für Geo- und Foto-Services.

### v1.4.0
*   Initiales Release mit Edit-Mode, Failover-System, Gamification und 15 Sprachen.

## Releases und Versionstags

Stabile Releases verwenden [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`. Für ein Release wird ein eigener PR erstellt, der die Versionsnummer in `package.json`, `package-lock.json`, `src/version.js`, `src/constants.js` und im README synchronisiert und den passenden Changelog-Eintrag datiert.

Nach dem Merge des Release-PRs und erfolgreichen Pflichtprüfungen erhält genau dieser Release-Commit einen annotierten Git-Tag im Format `vMAJOR.MINOR.PATCH` (zum Beispiel `v1.6.1`). Der Tag wird anschließend zum Remote gepusht. Normale Feature- und Bugfix-Merges bekommen keinen Tag; veröffentlichte Versionstags werden nicht verschoben oder wiederverwendet.

---

## ✨ Features

### OpenStreetMap tags
The app's Taginfo project file is published at [hydrantenjaeger.de/taginfo.json](https://hydrantenjaeger.de/taginfo.json). It describes the hydrant, water-source, and AED tags queried, read, and edited by the app. Keep this file in sync when the Overpass query or OSM editing form changes.

### 🚀 PWA & Live-Daten
*   **Installierbar**: Fühlt sich an wie eine Native App (iOS & Android).
*   **Offline-Ready**: Dank Service Worker (`vite-plugin-pwa`) funktioniert die App auch bei schlechtem Netz.
*   **Kontrollierte Updates**: Bei einer neuen Version erscheint ein Hinweis. Die Aktualisierung wird ausdrücklich gestartet, damit laufende Eingaben nicht durch eine automatische Neuladung verloren gehen.
*   **Smart Icon**: Passt sich dem Device an (Adaptive Icons).

### 📍 Intelligente Erfassung (Smart Mapping)
*   **Auto-GPS**: Startet erst nach Berechtigung (Datenschutz-konform) und zentriert die Karte anhand der Geräteposition. Neue Erfassungen erfordern einen höchstens 20 Sekunden alten Fix mit maximal 40 m angegebener Ungenauigkeit; andernfalls wird die Erfassung angehalten und ein erneuter GPS-Versuch angeboten.
*   **Kompass-Offset**: Position wird automatisch 3 Meter in Blickrichtung verschoben, da man meist *vor* dem Objekt steht.
*   **Live Preview**: Zeigt Hydranten, Löschwasserstellen und AEDs in der Umgebung an und hilft, vorhandene Objekte zu pflegen.
*   **Locked Nodes 🔒**: Erkennt automatisch, ob ein Hydrant Teil eines Gebäudes oder Weges ist und schützt die Geometrie.

### 🛡️ Sicherheit
*   **Client-Side Only**: Die App besitzt kein eigenes Backend. Fotos werden lokal verarbeitet; nur ausdrücklich ausgelöste OSM-Bearbeitungen und technisch notwendige Anfragen gehen an externe Dienste.
*   **OAuth 2.0 (PKCE)**: Sicherer Login via OpenStreetMap ohne Passwort-Weitergabe.
*   **Referrer-Schutz**: Seitenanfragen senden nur den Ursprung; OAuth-Codes und andere URL-Parameter werden nicht als Referrer offengelegt.
*   **Content Security Policy**: Strikte Richtlinien gegen XSS-Angriffe; Stylesheets sind auf die App beschränkt, Inline-Styles sind nur für benötigte Style-Attribute erlaubt. Vite darf CSS-`<style>`-Elemente ausschließlich im lokalen Entwicklungsserver einfügen.
*   **Abhängigkeiten**: Dependabot erstellt wöchentliche Updates für npm und GitHub Actions; Actions sind auf unveränderliche Commit-SHAs gepinnt, CI blockiert bekannte hohe und kritische npm-Sicherheitslücken.
*   **Auto-Sanitization**: Alle Inputs werden vor dem Rendern bereinigt (`escapeHTML`).

### 🏆 Gamification
*   **Rang-System**: Vom *Feuerwehranwärter* bis zum *Kreisbrandrat*.
*   **Bestenliste**: Verfolge deinen Fortschritt.
*   **Schulterklappen**: Visuelle Belohnungen basierend auf bayerischen Feuerwehr-Dienstgraden.

---

## 🏗️ Technische Architektur

Diese App wurde mit einem Fokus auf **Performance**, **Langlebigkeit** und **Wartbarkeit** entwickelt. Sie verzichtet bewusst auf schwere Frameworks wie React oder Vue, um maximale Kontrolle über den DOM und die Browser-APIs zu behalten.

### 🛠️ Tech Stack

| Bereich | Technologie | Begründung |
| :--- | :--- | :--- |
| **Core** | **Vanilla JS (ES6+)** | Kein Overhead, direkter DOM-Zugriff, zukunftssicher. |
| **Build Tool** | **Vite 8** | Extrem schneller Dev-Server und optimierte Production-Builds. |
| **UI / Styling** | **TailwindCSS** | Utility-First Ansatz für konsistentes Design und Dark Mode. |
| **Karten** | **Leaflet.js** | Leichtgewichtige, bewährte Mapping-Library. |
| **PWA** | **vite-plugin-pwa** | Generiert Service Worker und Manifest für Offline-Support. |
| **Testing** | **Vitest 4**, **jsdom 29** & **Playwright** | Unit-/DOM-Tests für Logik sowie mobile E2E-Tests für User-Flows. |
| **Linting** | **ESLint** | Code-Qualität und Fehlervermeidung (CI-integriert). |

### 🧩 Architektur-Muster

Die App folgt einer **MVC-ähnlichen Struktur** (Model-View-Controller), wobei `main.js` als zentraler Router und State-Manager fungiert.

#### 1. Verzeichnisstruktur
*   `src/components/`: **Views**. Enthalten die UI-Logik und das HTML-Rendering (z.B. `camera-view.js`, `intro-view.js`). Jede View exportiert eine `render()` und eine `init()` Funktion.
*   `src/services/`: **Services**. Kapseln die Geschäftslogik und API-Kommunikation.
    *   `osm.js`: Kommunikation mit der OpenStreetMap API (XML Erstellung, Upload).
    *   `auth.js`: OAuth 2.0 PKCE Flow und Token-Management.
    *   `geo.js`: Abstraktion der Geolocation API und Kompass-Daten.
    *   `i18n.js`: Lokalisierungssystem.
    *   `pwa-update.js`: Registriert den Service Worker, prüft auf neue Versionen und zeigt den kontrollierten Aktualisierungshinweis.
*   `src/controllers/`: **Controllers**. Verbinden Views mit Services für komplexe Abläufe (z.B. `edit-controller.js`).

#### 2. Datenfluss
1.  **Auth**: User loggt sich via OSM OAuth ein. Token wird im `localStorage` gespeichert (und automatisch erneuert).
2.  **Erfassung**:
    *   `camera-view`: Nimmt Foto auf.
    *   `geo.js`: Liefert GPS + Kompass.
    *   `main.js`: Berechnet die Zielkoordinate (Offset).
    *   `confirm-view`: User ergänzt Details (Typ, Durchmesser).
3.  **Optionale lokale Fotospeicherung**:
    *   `photo-service.js`: Erstellt nur auf ausdrücklichen Wunsch eine lokale Kopie des Fotos, ergänzt GPS-EXIF und übergibt sie an den Teilen-Dialog bzw. Download. Das Foto wird nicht hochgeladen.
4.  **Upload**:
    *   `osm.js`: Erstellt aus Koordinaten und Hydranten-Sachdaten ein XML-Changeset und sendet es an die OSM API. Das Foto ist nicht Bestandteil des Changesets.

### 💻 Lokale Entwicklung

Vite 8 und jsdom 29 benötigen Node.js `20.19+`, `22.13+` oder `24+`. Die CI verwendet Node.js 24.

```bash
npm ci
npm run dev
```

Wichtige Qualitätsprüfungen:

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

### 🤖 Qualitäts-Sicherung (CI/CD)

Jeder Push auf `main` oder Pull Request durchläuft eine automatisierte Pipeline mit GitHub Actions und Node.js 24:
1.  **Linting**: Prüft auf Code-Style und potenzielle Fehler (`npm run lint`).
2.  **Testing**: Führt Unit-Tests durch (`npm test`).
3.  **Build**: Verifiziert, dass der Production-Build erfolgreich durchläuft (`npm run build`).
4.  **Mobile E2E**: Prüft die vollständigen Kernabläufe in Chromium und WebKit (`npm run test:e2e`). Der HTML-Report wird als kurzlebiges Actions-Artefakt gespeichert.

Ein Push auf `main` wird erst nach erfolgreichem Build und erfolgreichen Mobile-E2E-Tests zu GitHub Pages deployt. Pull Requests werden geprüft, aber nicht veröffentlicht.

---

## 🌍 Unterstützte Sprachen (i18n)

Die App ist vollständig in **15 Sprachen** übersetzt:
🇩🇪 Deutsch • 🇺🇸 Englisch • 🇫🇷 Französisch • 🇪🇸 Spanisch • 🇮🇹 Italienisch • 🇵🇱 Polnisch • 🇨🇿 Tschechisch • 🇳🇱 Niederländisch • 🇵🇹 Portugiesisch • 🇭🇷 Kroatisch • 🇹🇷 Türkisch • 🇯🇵 Japanisch • 🇰🇷 Koreanisch • 🇨🇳 Chinesisch • 🇸🇦 Arabisch

---

## ⚖️ Rechtliches

### Haftungsausschluss
Diese App ist ein Open-Source-Projekt. Die Daten stammen von OpenStreetMap.
**Nicht für den operativen Einsatz bei Feuerwehr/Rettungsdienst geeignet!**
Nutze im Ernstfall immer offizielle Pläne.

### Datenschutz
Aufgenommene Fotos werden nur vorübergehend lokal im Browser verarbeitet und **nicht**
hochgeladen oder analysiert. Die GPS-Position stammt aus der separaten Standortfreigabe des
Endgeräts. Nur wenn der Nutzer den Upload startet, werden Koordinaten und Hydranten-Sachdaten
an OpenStreetMap übertragen. Eine Fotokopie mit GPS-EXIF wird ausschließlich auf ausdrücklichen
Wunsch über den Teilen-Dialog bzw. Download auf dem Endgerät gespeichert.

Ausführliche Informationen zu externen Diensten, lokaler Speicherung und Berechtigungen stehen
in den [Rechtlichen Hinweisen und Datenschutzinformationen](DISCLAIMER.md).

---

*Made with ❤️ by Frank März*
