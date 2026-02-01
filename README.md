# 🚒 Hydranten Jäger APP (v1.0 Beta)

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

## Rechtliches / Credits

*   Datenbasis: © OpenStreetMap Mitwirkende.
*   Code Lizenz: MIT.
*   Disclaimer: Nutzung auf eigene Gefahr.
