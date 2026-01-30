# 🚒 Hydranten Jäger (PWA)

**Hydranten Jäger** ist eine Progressive Web App (PWA) zur effizienten Erfassung und Pflege von Hydranten-Daten in [OpenStreetMap](https://www.openstreetmap.org/).

Entwickelt mit ❤️ für die Feuerwehr und die Open-Source-Community.

---

## 👨‍🚒 Über das Projekt

Dieses Projekt wurde ins Leben gerufen, um die Erfassung von Löschwasserentnahmestellen (Hydranten, Zisternen) zu vereinfachen – direkt vor Ort, mobil und intuitiv.

**Hintergrund:**
Ich bin langjähriges aktives Mitglied der **Freiwilligen Feuerwehr Rollhofen**. Die Verfügbarkeit exakter Daten über Hydranten ist im Einsatzfall entscheidend. Dieses Projekt dient mir persönlich als Lernprojekt, um den Umgang mit modernem Code, GitHub und KI-gestützter Entwicklung zu erlernen.

Es ist inspiriert vom Gedanken der **OpenFireMap** welche ich 2010 ins Leben gerufen habe und akutell auf eine V2 entwickle – offene Daten für die Sicherheit aller.

## 🤖 AI-Driven Development (Agentic AI)

Das Besondere an diesem Projekt: **Es wurde vollständig durch "Antigravity" programmiert**, einem fortschrittlichen Agentic AI Coding Assistant von Google Deepmind.

Der gesamte Code – von der HTML-Struktur über das Tailwind-Styling bis zur komplexen Logik für GPS, Kamera und Map-Integration – wurde durch Dialoge mit der KI erstellt ("Vibe Coding"). Ich fungiere als "Prompt Engineer" und Architekt, während die AI die technische Umsetzung übernimmt.

## ✨ Features

*   **📱 Progressive Web App (PWA)**: Installierbar auf dem Homescreen, funktioniert wie eine native App.
*   **🗺️ Live-Karte**: Zeigt die aktuelle Position direkt auf der Startseite (Leaflet.js).
*   **📸 Kamera-Integration**: Nutzt die Smartphone-Kamera für Beweisfotos (inkl. GPS-Checks).
*   **📍 OSM-Tagging**: Intuitive Erfassung von Hydrantentypen (Überflur/Unterflur), Durchmessern und Position.
*   **📡 Offline-First Ansatz**: Vorbereitet für den Einsatz auch bei schlechtem Netz.
*   **🔐 OAuth 2.0 Vorbereitung**: Einloggen mit dem OSM-Account (aktuell noch im Demo-Modus).

## 🛠️ Technologie-Stack

*   **Framework**: Vanilla JS (kein schweres Framework) für maximale Performance.
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
*   **Maps**: [Leaflet](https://leafletjs.com/) & OpenStreetMap Tiles
*   **Hosting**: GitHub Pages

## 🚀 Installation & Entwicklung

Projekt klonen:
```bash
git clone https://github.com/FrnkMrz/hydranten-app.git
cd hydranten-app
```

Abhängigkeiten installieren:
```bash
npm install
```

Entwicklungsserver starten:
```bash
npm run dev
```

Build für Produktion:
```bash
npm run build
```

---
*Erstellt 2026 von Frank März & Antigravity AI.*
