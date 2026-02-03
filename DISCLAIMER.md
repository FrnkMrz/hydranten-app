# ⚖️ Rechtliche Hinweise & Datenschutz

## ⚠️ Wichtiger Haftungsausschluss (Disclaimer)

Diese App ("Hydranten Jäger") ist ein privates Open-Source-Projekt zur Unterstützung der OpenStreetMap-Community.

*   **Keine Garantie:** Die angezeigten Daten basieren auf OpenStreetMap. Sie können unvollständig, veraltet oder fehlerhaft sein.
*   **Nicht für den Ernstfall:** Diese App darf **NICHT** als primäres Einsatzmittel für Feuerwehr oder Rettungsdienste verwendet werden. Im Notfall gelten ausschließlich die offiziellen Pläne und Hydrantenverzeichnisse der zuständigen Behörden.
*   **Haftung:** Der Entwickler übernimmt keine Haftung für Schäden, die durch die Nutzung dieser App oder falsche Kartendaten entstehen.

## 🛡️ Datenschutzhinweis

Die App läuft vollständig in deinem Browser (Client-Side) und hat kein eigenes Backend. Es werden keine Daten auf Servern des Entwicklers gespeichert. Um zu funktionieren, muss die App jedoch mit öffentlichen Diensten kommunizieren:

*   **OpenStreetMap & Overpass API:** Zum Laden der Hydranten und Karten werden anonymisierte Anfragen (inkl. deines aktuellen Kartenausschnitts) an öffentliche Server (z.B. overpass-api.de, openstreetmap.org) gesendet.
*   **Nominatim (Geocoding):** Um Adressen zu ermitteln, werden Koordinaten an `nominatim.openstreetmap.org` gesendet.
*   **Lokale Speicherung:** Deine Login-Daten (Auth-Token) und Einstellungen werden ausschließlich lokal auf deinem Gerät (`LocalStorage`) gespeichert.
