# 🚒 Hydranten Jäger - Anleitun

**🌐 Live App:** [https://hydrantenjaeger.de](https://hydrantenjaeger.de)

Willkommen beim **Hydranten Jäger**!
Diese App hilft dir dabei, schnell und einfach Hydranten für **OpenStreetMap (OSM)** zu erfassen.

## 1. Voraussetzungen

Du benötigst ein kostenloses Konto bei **OpenStreetMap**.
Falls du noch keines hast, kannst du dich hier registrieren: [www.openstreetmap.org/user/new](https://www.openstreetmap.org/user/new)

## 2. Anmelden (Login)

Bevor du Daten hochladen kannst, musst du die App mit deinem OSM-Konto verknüpfen. Das passiert sicher über **OAuth 2.0** (du gibst dein Passwort niemals direkt in der App ein).

1.  Öffne die App.
2.  Klicke unten rechts auf **"Einstellungen"** ⚙️ (oder auf der Startseite auf "OSM Login").
3.  Klicke auf den grünen Button **"Mit OSM verbinden"**.
4.  Du wirst auf die OpenStreetMap-Seite weitergeleitet.
5.  Melde dich dort an und klicke auf **"Erlauben"** (Authorize).
6.  Die App springt automatisch zurück und zeigt jetzt deinen Benutzernamen grün an. ✅

> **Hinweis:** Dein Login bleibt auf diesem Gerät gespeichert und wird automatisch erneuert (Token-Refresh), so dass du dich nicht erneut anmelden musst.
> **Sprache & Karte:** Du kannst die Sprache (Flagge) und den **Kartenstil** (Standard, Satellit, Topo) in den Einstellungen ändern.

## 3. Hydranten eintragen

So erfasst du einen neuen Hydranten in 4 Schritten:

### Schritt 1: Starten 🚀
*   Klicke auf der Startseite auf den großen Button **"STARTEN"**.
*   **Karte**: Du kannst die Karte auf der Startseite verschieben (ca. 200m Umkreis), um dich besser zu orientieren.
*   **Wichtig (iPhone):** Erlaube den Zugriff auf **Standort** und (falls gefragt) **Bewegungssensoren** (für den Kompass).

### Schritt 2: Foto & Position 📸
*   Richte die Kamera auf den Hydranten.
*   Achte oben rechts auf die GPS-Anzeige (sollte grün sein).
*   Drücke den **roten Auslöser**.

### Schritt 3: Daten prüfen & ergänzen 📝
Du siehst nun die Bestätigungs-Ansicht:
*   **Karte**: Prüfe, ob der blaue Marker stimmt. Du kannst ihn mit dem Finger verschieben!
*   **Fullscreen-Karte** 🗺️: Tippe auf den **Vergrößern-Button** unten links für eine größere Kartenansicht. So kannst du den Marker noch präziser platzieren.
*   **Typ**: Wähle den Hydranten-Typ (z.B. Überflur 📮 oder Unterflur 🕳️).
*   **Lage**: Wo steht er? (Gehweg, Straße, Grünfläche).
*   **Details** (Optional): Durchmesser, Farbe oder Nummer eintragen.

### Schritt 4: Hochladen ☁️
*   Klicke ganz unten auf **"HOCHLADEN ZU OSM"**.
*   Warte kurz, bis die Bestätigung "Upload Erfolgreich!" erscheint.

**Fertig!** 🎉
Der Hydrant ist nun in der OpenStreetMap-Datenbank eingetragen und bald auf allen Hydrantenkarten sichtbar.

---

## 4. Hydranten bearbeiten ✏️

Du kannst vorhandene Hydranten auf der Karte antippen und bearbeiten:

*   **Daten ändern**: Typ, Lage, Durchmesser, Farbe oder Nummer aktualisieren.
*   **Position verschieben**: Tippe auf die Karte, um den Marker an die richtige Stelle zu setzen (**Tap-to-Move**). Gesperrte Punkte (🔒 Teil von Gebäuden/Wegen) können nicht verschoben werden.
*   **Löschen**: Falsch eingetragene Hydranten können gelöscht werden (Button "Löschen").

---

## 5. Dein Dienstgrad 🏆

Für jeden eingetragenen Hydranten sammelst du Erfahrung!
*   Gehe in die **Einstellungen** ⚙️.
*   Dort siehst du deinen aktuellen **Rang** (basierend auf der Anzahl deiner Edits in OSM) und dein Abzeichen.
*   Klicke auf die Rang-Box, um zu sehen, wie viele Hydranten noch zum nächsten Dienstgrad fehlen (z.B. vom *Löschmeister* zum *Brandmeister*).
*   **Ziel**: Schaffst du es bis zum *Kreisbrandrat* (4 goldene Streifen)? 🚒✨

---

## Probleme & Hilfe

**GPS ist ungenau?**
Die App merkt sich deine letzte Position. Wenn das GPS "hängt", gehe kurz in deine Karten-App (Google/Apple Maps), um das GPS "aufzuwecken", und kehre dann zurück.

**Upload schlägt fehl?**
Prüfe deine Internetverbindung. Falls ein Fehler "401 Unauthorized" kommt, gehe in die Einstellungen und melde dich neu an. Die App versucht den Token automatisch zu erneuern, aber in seltenen Fällen kann ein manuelles Re-Login nötig sein.

**App reagiert nicht?**
In den **Einstellungen** gibt es den Button **"Resetiraj i očisti predmemoriju"** / **"Resetieren & Cache leeren"** — damit wird die App komplett zurückgesetzt.
