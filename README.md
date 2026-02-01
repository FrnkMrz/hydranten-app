# 🚒 Hydranten Jäger APP (v1.1)

Eine moderne, mobil-optimierte Web-App zum schnellen Erfassen von Hydranten für OpenStreetMap (OSM).
Fokus: Geschwindigkeit, Einhand-Bedienung und "Dark Mode" Ästhetik.

> **Status**: Version 1.0 Beta (Stable UI, PKCE Auth, iOS Optimized)

## Features ✨

*   **📸 Schnelle Erfassung**: Kamera öffnen, Foto machen, fertig.
*   **📍 Automatisches GPS**: Position wird automatisch ermittelt und via **Nominatim** in eine Adresse aufgelöst.
    *   **Intelligenter Fallback**: Wenn GPS hängt, wird die letzte bekannte Position genutzt.
    *   **Kompass-Offset**: Position wird 3m in Blickrichtung verschoben (da man vor dem Hydranten steht).
    *   **iOS Support**: Kompass & Layout optimiert für iPhone 16 Pro (Safe Area).
*   **🗺️ Map Hero Layout**: Große Karte zur exakten Positionierung ("Picture-in-Picture" Preview).
*   **🔒 Sicherer Login**: OSM OAuth 2.0 mit **PKCE** (Proof Key for Code Exchange) für maximale Sicherheit ohne Backend.
*   **🎨 UI/UX**:
    *   Dark Mode Design.
    *   Farbwahl für Hydranten und Lage-Erfassung.
    *   Clean Interface (Keine störenden Emojis im Production-Mode).
*   **PWA Ready**: Installierbar auf iOS/Android (Standalone Mode) mit **Stateless PKCE OAuth** (Login Fix für iOS).
*   **Live Vorschau**: Zeigt bereits erfasste Hydranten auf der Startseite an (Overpass API).
*   **Offline First**: Caching von Assets via Service Worker.
*   **DSGVO Konform**: Keine Cookies außer lokalem Storage, direkter OSM Upload.

## Mapping Funktionen 🛠️

Erfasst werden:
*   **Typ**: Überflur 📮, Unterflur 🕳️, Wand 🧱, Zisterne 💧, Trocken 🌵.
*   **Details**: Durchmesser, Farbe, Lage (Gehweg/Straße/Grün).
*   **Upload**: Erstellt Changeset & Node direkt in OSM.

## Installation / Dev

Technologie: Vite + Vanilla JS + TailwindCSS + Leaflet.

1.  `npm install`
2.  `npm run dev`
3.  `npm run build`

## Unterstützte Sprachen 🌍

Die App ist aktuell in folgenden Sprachen verfügbar:
*   🇩🇪 Deutsch (de)
*   🇺🇸 Englisch (en) - *Interface auf British English 🇬🇧 flag*
*   🇵🇱 Polnisch (pl)
*   🇨🇿 Tschechisch (cs)
*   🇫🇷 Französisch (fr)
*   🇳🇱 Niederländisch (nl)
*   🇪🇸 Spanisch (es)
*   🇵🇹 Portugiesisch (pt)
*   🇭🇷 Kroatisch (hr)
*   🇮🇹 Italienisch (it)
*   🇯🇵 Japanisch (ja)
*   🇰🇷 Koreanisch (ko)
*   🇨🇳 Mandarin (zh)
*   🇹🇷 Türkisch (tr)

### Entwickler: Neue Sprache hinzufügen

1.  Erstelle eine neue Datei in `src/locales/xx.js` (kopiere `en.js` als Vorlage).
2.  Importiere die Datei in `src/services/i18n.js` und füge sie zum `resources` Objekt hinzu.
3.  Füge die Sprache in `src/components/intro-view.js` hinzu:
    *   In das `flags` Objekt (Zeile ~190).
    *   In das `langs` Array für das Modal (Zeile ~210).
4.  Build & Deploy.

*   Datenbasis: © OpenStreetMap Mitwirkende.
*   Code Lizenz: MIT.
*   Disclaimer: Nutzung auf eigene Gefahr.
