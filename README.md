# 🚒 Hydranten Jäger APP (v1.3)

Eine moderne, mobil-optimierte Web-App (PWA) zum schnellen Erfassen von Hydranten für OpenStreetMap (OSM).
Fokus: Geschwindigkeit, Einhand-Bedienung und "Dark Mode" Ästhetik.

> **Status**: Version 1.3.0 (Stable Release) - Edit Mode, Safe Checks, Multi-Language, History

## Features ✨

*   **📱 PWA Ready**: Vollständige **Progressive Web App**. Installierbar auf iOS & Android ("Add to Home Screen").
    *   **Offline Icons**: Hochauflösende Icons (v3) für alle Devices.
    *   **Service Worker**: Caching für Offline-Verfügbarkeit (v5-beta).
    *   **Stateless PKCE**: Login funktioniert auch im Standalone PWA Modus (iOS Fix).
*   **📸 Schnelle Erfassung**: Kamera öffnen, Foto machen, fertig.
*   **📍 Automatisches GPS**:
    *   **Force-Fix**: Beim Start wird das GPS aktiv angefordert, um die Karte sofort korrekt zu zentrieren.
    *   **Kompass-Offset**: Position wird 3m in Blickrichtung verschoben (da man vor dem Hydranten steht).
    *   **Nominatim**: Automatische Adressermittlung (Reverse Geocoding) mit korrektem `User-Agent`.
*   **🗺️ Map Hero Layout**: Große Karte zur exakten Positionierung ("Picture-in-Picture" Preview).
*   **🎨 UI/UX**:
    *   **Premium Dark Mode**: Optimierter Kontrast, Blur-Effekte, iOS Safe-Area Support.
    *   **Live Vorschau**: Zeigt bereits erfasste Hydranten auf der Startseite an (Overpass API mit erhöhtem Timeout).
*   **✏️ Editierung & Pflege**:
    *   **Bearbeiten**: Attribute bestehender Hydranten anpassen.
    *   **Safe Mode**: "Smart Dirty Check" verhindert leere Uploads & Map-Lock gegen Verschieben.
    *   **Tag Schutz**: Unbekannte Tags werden beim Speichern respektiert und beibehalten.
    *   **Löschen**: Entfernen nicht mehr existierender Hydranten (mit Sicherheitsabfrage).
*   **📜 Verlauf**: Anzeige der eigenen Changesets direkt in der App.

## Mapping Funktionen 🛠️

Erstellt werden detaillierte Nodes direkt in OSM:

*   **Typen**:
    *   Überflur 📮 (`fire_hydrant`)
    *   Unterflur 🕳️ (`underground`)
    *   Wand 🧱 (`wall`)
    *   **Zisterne 💧** (`water_tank` + `water_tank:volume` mit automatischer "m³" Einheit)
    *   **Saugstelle 🏞️** (`suction_point`)
    *   Trocken 🌵 (`dry_hydrant`)
*   **Details**:
    *   Durchmesser (DN) - manuell eingebbar.
    *   **Wasserquelle** (`water_source`): Dynamisch je nach Typ (z.B. *Leitungsnetz*, *Teich*, *Zisterne*).
    *   **Hinweisschild**: Spezielle Logik für Unterflurhydranten (`fire_hydrant:diameter:signed`).
    *   Referenznummer.
*   **Upload**:
    *   Erstellt automatisch Changeset & Node.
    *   Nutzt OAuth 2.0 PKCE für sicheren Login ohne eigenes Backend.
    *   Entspricht OSM-Vorgaben (User-Agent Header, API Policy).

## Installation / Dev

Technologie: Vite + Vanilla JS + TailwindCSS + Leaflet + OpenStreetMap API.

1.  `npm install`
2.  `npm run dev` (Startet lokalen Server)
3.  `npm run build` (Erstellt `dist` Ordner für Deployment)

## Unterstützte Sprachen 🌍

Verfügbar in 14 Sprachen, inkl. automatischer Erkennung:
🇩🇪 🇺🇸 🇵🇱 🇨🇿 🇫🇷 🇳🇱 🇪🇸 🇵🇹 🇭🇷 🇮🇹 🇯🇵 🇰🇷 🇨🇳 🇹🇷

### Mitwirken

*   **Code**: [GitHub Repository](https://github.com/FrnkMrz/hydranten-app)
*   **Daten**: © OpenStreetMap Mitwirkende.
*   **Lizenz**: MIT.

---
*Built with passion by Frank März & Google DeepMind Agent.*
