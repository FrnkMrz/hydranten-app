# ⚖️ Rechtliche Hinweise & Datenschutz

## ⚠️ Wichtiger Haftungsausschluss (Disclaimer)

Diese App ("Hydranten Jäger") ist ein privates Open-Source-Projekt zur Unterstützung der OpenStreetMap-Community.

*   **Keine Garantie:** Die angezeigten Daten basieren auf OpenStreetMap. Sie können unvollständig, veraltet oder fehlerhaft sein.
*   **Nicht für den Ernstfall:** Diese App darf **NICHT** als primäres Einsatzmittel für Feuerwehr oder Rettungsdienste verwendet werden. Im Notfall gelten ausschließlich die offiziellen Pläne und Hydrantenverzeichnisse der zuständigen Behörden.
*   **Haftung:** Der Entwickler übernimmt keine Haftung für Schäden, die durch die Nutzung dieser App oder falsche Kartendaten entstehen.

## 🛡️ Datenschutzhinweis

Die App läuft im Browser (Client-Side) und hat kein eigenes Backend zur Speicherung von
Nutzerdaten. Für einzelne Funktionen kommuniziert der Browser jedoch direkt mit externen
Diensten. Dabei erhalten diese Dienste technisch bedingt unter anderem die IP-Adresse des
Endgeräts.

### Fotos und Kamerazugriff

*   Der Kamerazugriff erfolgt erst nach entsprechender Freigabe im Browser bzw. Betriebssystem.
*   Ein aufgenommenes Foto wird in der App nur vorübergehend im Arbeitsspeicher des Browsers verarbeitet und als Vorschau angezeigt. Es wird **nicht** an OpenStreetMap, den Entwickler oder einen anderen Server hochgeladen und nicht zur Bilderkennung oder zu anderen Analysezwecken verwendet.
*   Die Standortkoordinaten werden **nicht aus dem Foto ausgelesen**. Sie stammen separat aus der Standortfreigabe des Endgeräts und werden für die Positionierung des Hydranten verwendet.
*   Nur bei ausdrücklicher Auswahl der Funktion „Speichern“ erstellt die App lokal eine Kopie des Fotos mit Standort und Aufnahmezeit in den EXIF-Metadaten. Anschließend öffnet sie – abhängig vom Gerät – den systemeigenen Teilen-Dialog oder startet einen Download. Speicherort und mögliche Empfänger werden im jeweiligen Systemdialog ausgewählt. Die App speichert das Foto nicht automatisch in einer eigenen Cloud.
*   Für den beschreibenden Dateinamen kann beim Speichern des Fotos die ermittelte Koordinate an Nominatim übertragen werden.

### Standort- und OpenStreetMap-Daten

*   Der Standortzugriff erfolgt erst nach entsprechender Freigabe. Die App verarbeitet die Geräteposition und – soweit verfügbar – die Kompassrichtung lokal, um die vorgeschlagene Position des Hydranten zu bestimmen.
*   Erst nach ausdrücklichem Start des Uploads werden die gewählten Koordinaten und Hydranten-Sachdaten über die OpenStreetMap API veröffentlicht. Das Foto ist nicht Bestandteil dieses Uploads. OpenStreetMap ordnet die Bearbeitung dem verwendeten Benutzerkonto zu.
*   Zum Laden von Hydranten und Karten werden Kartenausschnitt und weitere technisch erforderliche Anfragedaten an OpenStreetMap-Kachelserver, Overpass-Instanzen oder den jeweils ausgewählten Kartenanbieter gesendet.
*   Zur Ermittlung von Orts- und Straßennamen werden Koordinaten an `nominatim.openstreetmap.org` übertragen.

### Lokale Speicherung und Berechtigungen

*   OAuth-Zugangsdaten (Token), Einstellungen und weitere App-Zustände werden lokal im Browser gespeichert. Sie können über die App-Funktion zum Zurücksetzen oder über die Browser-Einstellungen gelöscht werden.
*   Kamera- und Standortberechtigungen können jederzeit in den Browser- bzw. Geräteeinstellungen widerrufen werden.

Für die Verarbeitung durch OpenStreetMap gilt zusätzlich die
[Datenschutzerklärung der OpenStreetMap Foundation](https://osmfoundation.org/wiki/Privacy_Policy).
Bei anderen angebundenen Karten- und Overpass-Anbietern gelten deren jeweilige
Datenschutzbestimmungen.
