# Besuchskalender Oma & Opa

Offline-fähige Web-App (PWA): Familie trägt Besuche ein, Oma & Opa sehen auf einen Blick, wer wann kommt.
Öffnen: `index.html` im Browser (oder per Webserver, dann "Zum Startbildschirm hinzufügen").

## Plan

| Phase | Aufgabe | Ergebnis | KI-Modell |
|---|---|---|---|
| 1 | Anforderungen klären (Nutzer, Geräte, Schriftgröße) | Kurz-Spezifikation | Claude Sonnet 5.5 |
| 2 | Datenmodell: Besuch = Wer, Datum, Von/Bis, Notiz | JSON in `localStorage` | Claude Sonnet 5.5 |
| 3 | UI: Monatsansicht, große Schrift, farbige Punkte je Person | `index.html` | Claude Sonnet 5.5 |
| 4 | Besuch anlegen / ändern / löschen | Dialog-Formular | Claude Sonnet 5.5 |
| 5 | Offline & Installierbarkeit (PWA) | `manifest.webmanifest`, `sw.js` | Claude Sonnet 5.5 |
| 6 | Sichern / Laden als Datei | JSON-Export/-Import | Claude Sonnet 5.5 |
| 7 | Test im Browser (Anlegen, Ändern, Löschen, Dunkelmodus) | Testprotokoll | Claude Sonnet 5.5 |
| 8 (optional) | Freundliche Erinnerungstexte / Besuchsideen zur Laufzeit | Kleine API-Funktion | Claude Haiku 4.5 (schnell, günstig) |
| 9 (optional) | Gemeinsamer Kalender für die Familie (Sync) | Backend/DB | – (kein KI-Modell nötig) |

Die App selbst benötigt **keine** KI zum Laufen; Modelle kommen nur bei Entwicklung (Sonnet 5.5) und der optionalen Textfunktion (Haiku 4.5) zum Einsatz.
