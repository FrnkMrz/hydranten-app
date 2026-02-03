# 🚒 Hydranten Jäger APP (v1.3.2)

Eine moderne, mobil-optimierte Progressive Web App (PWA) zum blitzschnellen Erfassen und Pflegen von Hydranten in OpenStreetMap (OSM).
Entwickelt für Geschwindigkeit, Einhand-Bedienung und Robustheit im Feld.

> **Status**: Version 1.3.2 (Stable Release)
> *Features: Failover-System, Edit-Mode, Smart-Tags, Dark Mode, Offline-Ready.*

## ✨ Features

### 🚀 PWA & Offline-First
*   **Installierbar**: Fühlt sich an wie eine Native App (iOS & Android).
*   **Offline-Ready**: Funktioniert auch bei schlechtem Netz (Service Worker Caching).
*   **Smart Icon**: Passt sich dem Device an (Adaptive Icons).

### 📍 Intelligente Erfassung (Smart Mapping)
*   **Auto-GPS**: Startet erst nach Berechtigung (Datenschutz-konform) und zentriert die Karte präzise.
*   **Kompass-Offset**: Position wird automatisch 3 Meter in Blickrichtung verschoben, da man meist *vor* dem Objekt steht.
*   **Live Preview**: Zeigt bereits vorhandene Hydranten und Wasserstellen in der Umgebung an (Overpass API).
*   **Geocode**: Ermittelt automatisch die Adresse (Straße/Ort) im Hintergrund.

### 🛡️ Sicherheit & Architektur
*   **Client-Side Only**: Kein Backend-Server. Deine Daten bleiben bei dir.
*   **OAuth 2.0 (PKCE)**: Sicherer Login via OpenStreetMap ohne Passwort-Weitergabe.
*   **Overpass Failover**: Automatische Umschaltung auf Backup-Server (DE, Kumi, Mail.ru), falls die API überlastet ist.

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

## 🌍 Verfügbaren Sprachen
Die App ist vollständig lokalisiert (14 Sprachen):
🇩🇪 🇺🇸 🇵🇱 🇨🇿 🇫🇷 🇳🇱 🇪🇸 🇵🇹 🇭🇷 🇮🇹 🇯🇵 🇰🇷 🇨🇳 🇹🇷

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
