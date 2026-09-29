# Besuchskalender Oma & Opa

Offline-fähige Web-App (PWA): Familie trägt Besuche ein, Oma & Opa sehen auf einen Blick, wer wann kommt.
Start: `node server.js` (keine Abhängigkeiten, Node 18+), dann `http://localhost:8080` öffnen.
Optional: `PORT` und `DATA_DIR` als Umgebungsvariablen. Ohne Server läuft `index.html` weiterhin rein lokal.

## Familienkalender
Alle Familienmitglieder geben in der App denselben **Familien-Code** ein (mind. 6 Zeichen) und sehen denselben Kalender.
- Der Server speichert pro Code eine JSON-Datei in `data/` (Dateiname = SHA-256 des Codes).
- Abgleich beim Start, nach jeder Änderung und alle 15 s; Änderungen offline werden nachgeholt.
- Konflikte: Der zuletzt geänderte Eintrag gewinnt; Löschungen werden mit abgeglichen.
- Der Code ist das einzige „Passwort“: lang und nur in der Familie teilen; für den Betrieb im Internet HTTPS davorschalten.

## Familienkalender ohne eigenen Server (Supabase + GitHub Pages)
1. Auf [supabase.com](https://supabase.com) ein kostenloses Projekt anlegen.
2. **SQL Editor** → Inhalt von `supabase/schema.sql` einfügen → **Run**.
3. **Project Settings → API**: `Project URL` und `anon public` key in `config.js` eintragen.
   (Der anon key ist öffentlich gedacht. Die Tabelle ist gesperrt; Zugriff gibt es nur über die Funktion `sync_visits` mit dem Familien-Code.)
4. App hosten: GitHub → **Settings → Pages** → Branch wählen, Ordner `/ (root)`. Die Adresse an die Familie schicken.
5. Alle geben in der App denselben Familien-Code ein, oder du tippst im Bereich „Familienkalender“ auf **Link teilen**: Der Link (`…/#code=CODE`) verbindet jedes Gerät beim Öffnen automatisch. Er enthält den Code, also nur an die Familie schicken.

Ist `config.js` leer, nutzt die App `server.js` (siehe oben) oder bleibt rein lokal.

## Plan

| Phase | Aufgabe | Ergebnis | KI-Modell |
|---|---|---|---|
| 1 | Anforderungen klären (Nutzer, Geräte, Schriftgröße) | Kurz-Spezifikation | Claude Sonnet 5.5 |
| 2 | Datenmodell: Besuch = Wer, Datum, Von/Bis, Notiz | JSON in `localStorage` | Claude Sonnet 5.5 |
| 3 | UI: Monatsansicht, große Schrift, farbige Punkte je Person | `index.html` | Claude Sonnet 5.5 |
| 4 | Besuch anlegen / ändern / löschen | Dialog-Formular | Claude Sonnet 5.5 |
| 5 | Offline & Installierbarkeit (PWA) | `manifest.webmanifest`, `sw.js` | Claude Sonnet 5.5 |
| 6 | ~~Sichern / Laden als Datei~~ (entfällt, der Familien-Code genügt) | – | – |
| 7 | Test im Browser (Anlegen, Ändern, Löschen, Dunkelmodus) | Testprotokoll | Claude Sonnet 5.5 |
| 8 (optional) | Freundliche Erinnerungstexte / Besuchsideen zur Laufzeit | Kleine API-Funktion | Claude Haiku 4.5 (schnell, günstig) |
| 9 | Gemeinsamer Kalender für die Familie (Sync) | `server.js` + Familien-Code | – (kein KI-Modell nötig) |

Die App selbst benötigt **keine** KI zum Laufen; Modelle kommen nur bei Entwicklung (Sonnet 5.5) und der optionalen Textfunktion (Haiku 4.5) zum Einsatz.
