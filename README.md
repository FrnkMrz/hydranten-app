# 🚒 Hydranten Jäger APP (v1.4.1)

**🌐 Live App:** [https://hydrantenjaeger.de](https://hydrantenjaeger.de)

Eine moderne, mobil-optimierte Progressive Web App (PWA) zum blitzschnellen Erfassen und Pflegen von Hydranten in OpenStreetMap (OSM).
Entwickelt für Geschwindigkeit, Einhand-Bedienung und Robustheit im Feld.

> **Status**: Version 1.5.0 (Stable Release)
> *Features: Security Hardened, Failover-System, Edit-Mode, Smart-Tags, Token-Refresh.*

## ✨ Features

### 🚀 PWA & Live-Daten
*   **Installierbar**: Fühlt sich an wie eine Native App (iOS & Android).
*   **Online-Only**: Benötigt eine Internetverbindung für Live-Daten (Overpass API) und Kartenkacheln.
*   **Smart Icon**: Passt sich dem Device an (Adaptive Icons).

### 📍 Intelligente Erfassung (Smart Mapping)
*   **Auto-GPS**: Startet erst nach Berechtigung (Datenschutz-konform) und zentriert die Karte präzise.
*   **Kompass-Offset**: Position wird automatisch 3 Meter in Blickrichtung verschoben, da man meist *vor* dem Objekt steht.
*   **Live Preview**: Zeigt bereits vorhandene Hydranten und Wasserstellen in der Umgebung an (Overpass API).
*   **Geocode**: Ermittelt automatisch die Adresse (Straße/Ort) im Hintergrund.

### 🛡️ Sicherheit & Architektur
*   **Client-Side Only**: Kein Backend-Server. Deine Daten bleiben bei dir.
*   **OAuth 2.0 (PKCE)**: Sicherer Login via OpenStreetMap ohne Passwort-Weitergabe.
*   **Token-Refresh**: Automatische Erneuerung des OAuth-Tokens, damit du nicht erneut einloggen musst.
*   **Secure Validation**: Strikte Validierung aller externen Inputs (XSS-Schutz) und sichere Links.
*   **Overpass Failover**: Automatische Umschaltung auf Backup-Server (DE, Kumi, Mail.ru), falls die API überlastet ist.
*   **Karten-Vielfalt**: Wähle zwischen **Standard**, **Satellit** und **Topo** Karten.

### 🗺️ Bearbeiten & Verschieben (Edit Mode)
*   **Tap-to-Move**: Tippe auf die Karte, um den Hydrant-Marker präzise zu verschieben.
*   **Fullscreen-Karte**: Vergrößere die Karte für optimale Übersicht beim Bearbeiten.
*   **Locked Nodes 🔒**: Punkte, die Teil eines Gebäudes oder Weges sind, werden automatisch erkannt und gegen versehentliches Verschieben gesperrt.

### 🏆 Gamification & Ranks
*   **Aufsteigen**: Sammle Punkte für jeden erfassten Hydranten.
*   **Dienstgrade**: Arbeite dich vom *Feuerwehranwärter* bis zum *Kreisbrandrat* (KBR) hoch.
*   **Insignien**: Bewundere deine Schulterklappen (originalgetreue bayerische Feuerwehr-Abzeichen) in den Einstellungen.
*   **Bestenliste**: Vergleiche dich mit deinen eigenen Zielen (Level-System).

---

## 🗺️ Unterstützte Objekttypen

Die App unterscheidet visuell und logisch zwischen verschiedenen Wasserentnahmestellen:

| Typ | Icon | OSM Tagging | Besonderheiten |
| :--- | :---: | :--- | :--- |
| **Unterflurhydrant** | 🕳️ | `fire_hydrant:type=underground` | Prüft automatisch auf **Hinweisschilder** (`ref:signed`). |
| **Überflurhydrant** | 📮 | `fire_hydrant:type=pillar` | Klassische rote Säule. |
| **Wandhydrant** | 🏢 | `fire_hydrant:type=wall` | Oft an Gebäudefassaden. |
| **Zisterne** | 🛢️ | `emergency=water_tank` | Erfasst Volumen und setzt `water_source=reservoir`. |
| **Saugstelle** | 🏞️ | `emergency=suction_point` | Für offene Gewässer (Fluss, Teich, See). |
| **Trockenleitung** | 🌵 | `fire_hydrant:type=dry` | Steigleitung (trocken). |

> **Logik-Highlight**: Zisternen und Saugstellen werden auf der Karte blau (statt rot) markiert, um sie schneller zu unterscheiden.

---

## 🛠️ Mapping-Details für Profis

Die App übernimmt viel "Tagging-Arbeit" im Hintergrund:

*   **Wasserquelle (`water_source`)**: Wird basierend auf dem Typ intelligent vorausgewählt (z.B. *groundwater* bei Saugstellen, *main* bei Hydranten).
*   **Durchmesser**: Wird als Zahl (mm) erfasst und korrekt getaggt (`fire_hydrant:diameter`).
*   **Ref-Nummer**: Unterstützung für lokale Kennungen (`ref`).
*   **Schutz-Mechanismus**: Vorhandene Tags, die die App nicht kennt, werden beim Bearbeiten **nicht** gelöscht/überschrieben ("Smart Dirty Check").
*   **Locked Nodes 🔒**: Punkte, die Teil eines Gebäudes oder Weges sind, werden automatisch erkannt und gegen versehentliches Verschieben gesperrt.

---

## 🏗️ Architektur (v1.5.0)

Die Codebasis ist modular aufgebaut:

*   **Modulare Komponenten**: `confirm-view` ist in `template`, `map`, `form` und `photo` Module aufgeteilt.
*   **Shared Overlay**: Wiederverwendbare Overlay-Komponente für Nachrichten und Fehleranzeigen (ersetzt native `alert()`).
*   **i18n-System**: Alle UI-Strings sind externalisiert und über `t()` Funktion abrufbar.
*   **Security First**: Umfassende XSS-Prävention, strikte CSP und OAuth-Härtung.
*   **Automatisierte Versionierung**: Build-Script synchronisiert Version zwischen `package.json`, App und Service Worker.

---

## 🌍 Verfügbare Sprachen
Die App ist vollständig lokalisiert (15 Sprachen):
🇩🇪 🇺🇸 🇵🇱 🇨🇿 🇫🇷 🇳🇱 🇪🇸 🇵🇹 🇭🇷 🇮🇹 🇯🇵 🇰🇷 🇨🇳 🇹🇷 🇸🇦

---

## 📋 Changelog

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

### v1.4.1 (16.02.2026)
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

## ⚖️ Rechtliche Hinweise & Datenschutz

### ⚠️ Wichtiger Haftungsausschluss (Disclaimer)
Diese App ("Hydranten Jäger") ist ein privates Open-Source-Projekt zur Unterstützung der OpenStreetMap-Community.

*   **Keine Garantie**: Die angezeigten Daten basieren auf OpenStreetMap. Sie können unvollständig, veraltet oder fehlerhaft sein.
*   **Nicht für den Ernstfall**: Diese App darf **NICHT** als primäres Einsatzmittel für Feuerwehr oder Rettungsdienste verwendet werden. Im Notfall gelten ausschließlich die offiziellen Pläne und Hydrantenverzeichnisse der zuständigen Behörden.
*   **Haftung**: Der Entwickler übernimmt keine Haftung für Schäden, die durch die Nutzung dieser App oder falsche Kartendaten entstehen.

### 🛡️ Datenschutzhinweis
Die App speichert keine personenbezogenen Daten auf eigenen Servern.
*   **Kommunikation**: Findet ausschließlich direkt mit den offiziellen OSM-Diensten (API, Overpass, Nominatim) statt.
*   **Speicherung**: Dein Login-Token wird nur lokal auf deinem Gerät (LocalStorage) abgelegt.

---
*Built with passion by Frank März & Google DeepMind Agent.*
