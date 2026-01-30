# 🚒 Hydranten Jäger APP

Eine modernere, mobil-optimierte Web-App zum schnellen Erfassen von Hydranten für OpenStreetMap (OSM).
Fokus: Geschwindigkeit, Einhand-Bedienung und "Dark Mode" Ästhetik.

## Features ✨

*   **📸 Schnelle Erfassung**: Kamera öffnen, Foto machen, fertig.
*   **📍 Automatisches GPS**: Position wird automatisch ermittelt.
    *   **Intelligenter Fallback**: Wenn GPS hängt, wird die letzte bekannte Position genutzt.
    *   **Kompass-Offset**: Position wird 3m in Blickrichtung verschoben (da man vor dem Hydranten steht).
*   **🗺️ Map Hero Layout**: Große Karte zur exakten Positionierung, Foto als "Picture-in-Picture".
*   **🛠️ Hydranten-Typen**:
    *   📮 Überflur
    *   🕳️ Unterflur
    *   🧱 Wand
    *   💧 Zisterne
    *   🌵 Trocken (Sauganschluss)
*   **🚀 Upload**: Lädt direkt zu OpenStreetMap hoch (via OSM API).

## Tech Stack 🛠️

*   **Vite**: Build Tool
*   **Vanilla JS**: Kein Framework-Overhead, pure Performance.
*   **TailwindCSS**: Styling.
*   **Leaflet**: Karten-Darstellung.
*   **OSM API**: Authentifizierung und Upload.

## Installation / Dev

1.  `npm install`
2.  `npm run dev`
3.  `npm run build`

## Credits

Entwickelt für die schnelle Datenerfassung im Feld.
Design ist "Dark Mode Only" für Akku-Schonung und Nacht-Einsätze. 🌙
