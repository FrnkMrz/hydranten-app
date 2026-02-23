# 🚒 Hydranten Jäger APP (v1.5.2)

**🌐 Live App:** [https://hydrantenjaeger.de](https://hydrantenjaeger.de)

Eine moderne, mobil-optimierte Progressive Web App (PWA) zum blitzschnellen Erfassen und Pflegen von Hydranten in OpenStreetMap (OSM).
Entwickelt für Geschwindigkeit, Einhand-Bedienung und Robustheit im Feld.

> **Status**: Version 1.5.2 (Stable Release)
> *Features: Security Hardened, Failover-System, Edit-Mode, Smart-Tags, Token-Refresh, CI/CD, PWA Accessibility.*

## 📋 Changelog

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

---

## ✨ Features

### 🚀 PWA & Live-Daten
*   **Installierbar**: Fühlt sich an wie eine Native App (iOS & Android).
*   **Offline-Ready**: Dank Service Worker (`vite-plugin-pwa`) funktioniert die App auch bei schlechtem Netz.
*   **Smart Icon**: Passt sich dem Device an (Adaptive Icons).

### 📍 Intelligente Erfassung (Smart Mapping)
*   **Auto-GPS**: Startet erst nach Berechtigung (Datenschutz-konform) und zentriert die Karte präzise.
*   **Kompass-Offset**: Position wird automatisch 3 Meter in Blickrichtung verschoben, da man meist *vor* dem Objekt steht.
*   **Live Preview**: Zeigt bereits vorhandene Hydranten in der Umgebung an (Overpass API) und verhindert Duplikate.
*   **Locked Nodes 🔒**: Erkennt automatisch, ob ein Hydrant Teil eines Gebäudes oder Weges ist und schützt die Geometrie.

### 🛡️ Sicherheit
*   **Client-Side Only**: Kein Backend-Server. Deine Daten bleiben bei dir.
*   **OAuth 2.0 (PKCE)**: Sicherer Login via OpenStreetMap ohne Passwort-Weitergabe.
*   **Content Security Policy**: Strikte Richtlinien gegen XSS-Angriffe.
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
| **Build Tool** | **Vite** | Extrem schneller Dev-Server und optimierte Production-Builds. |
| **UI / Styling** | **TailwindCSS** | Utility-First Ansatz für konsistentes Design und Dark Mode. |
| **Karten** | **Leaflet.js** | Leichtgewichtige, bewährte Mapping-Library. |
| **PWA** | **vite-plugin-pwa** | Generiert Service Worker und Manifest für Offline-Support. |
| **Testing** | **Vitest** & **Playwright** | Unit-Tests für Logik, E2E-Tests für User-Flows. |
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
*   `src/controllers/`: **Controllers**. Verbinden Views mit Services für komplexe Abläufe (z.B. `edit-controller.js`).

#### 2. Datenfluss
1.  **Auth**: User loggt sich via OSM OAuth ein. Token wird im `localStorage` gespeichert (und automatisch erneuert).
2.  **Erfassung**:
    *   `camera-view`: Nimmt Foto auf.
    *   `geo.js`: Liefert GPS + Kompass.
    *   `main.js`: Berechnet die Zielkoordinate (Offset).
    *   `confirm-view`: User ergänzt Details (Typ, Durchmesser).
3.  **Upload**:
    *   `photo-service.js`: Skaliert das Bild (Canvas), entfernt EXIF-Ballast, fügt GPS-EXIF hinzu.
    *   `osm.js`: Erstellt ein XML-Changeset und sendet es an die OSM API.

### 🤖 Qualitäts-Sicherung (CI/CD)

Jeder Push auf `main` oder Pull Request durchläuft eine automatisierte Pipeline (GitHub Actions):
1.  **Linting**: Prüft auf Code-Style und potenzielle Fehler (`npm run lint`).
2.  **Testing**: Führt Unit-Tests durch (`npm test`).
3.  **Build**: Verifiziert, dass der Production-Build erfolgreich durchläuft (`npm run build`).

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
Es werden **keine** personenbezogenen Daten auf unseren Servern gespeichert. Die Kommunikation erfolgt direkt zwischen deinem Browser und OpenStreetMap.

---

*Made with ❤️ by Frank März*
