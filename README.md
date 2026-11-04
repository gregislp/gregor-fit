# Gregor Fit

Persönlicher Trainingsplaner als Web-App (PWA) für das iPhone: kein App Store, kein Abo, keine Cloud.
Funktionell nachgebaut nach dem Vorbild „MCI – Personal Training AI“, mit eigenem Namen, Design und eigenen Inhalten.

## Funktionen

| Bereich | Was die App kann |
|---|---|
| **Onboarding** | Ziel, Geschlecht, Geburtstag, Größe, Gewicht, Körperfett, Erfahrung, Level, Zielgewicht mit Prognose, Fokus-Muskeln (Körperkarte), Frequenz, Split, Trainingstage und Dauer, Ort und Ausrüstung, Schmerzbereiche, Alltagsaktivität, Arbeitsposition, Cardio-Wunsch |
| **Plan-Generator** (regelbasiert) | Ganzkörper / Ober-Unter / Push-Pull-Beine, Übungsauswahl nach Ausrüstung, Schmerzen und Fokus, Sätze/Wdh./Pausen nach Ziel und Level, Anpassung an die verfügbare Zeit, Deload-Wochen (Periodisierung) |
| **Training** | Satz-Tracking (kg, Wdh., RIR), „Vorher“-Werte, Pausentimer mit Ton, Supersätze, Übung tauschen/hinzufügen/entfernen, Tagesform-Abfrage (Energie/Muskelkater → weniger Volumen), automatische Progression, Bestleistungen, Zusammenfassung mit Muskelkarte, Teilen |
| **Status** | Aktiv / Krank / Urlaub (mit Ort: Hotel-Gym, ohne Geräte …), Übungen werden automatisch ersetzt, Streak bleibt geschützt |
| **Übungen** | 84 Übungen mit Ausführung, Filter nach Muskel und Gerät, eigene Übungen, Merkliste, Fortschrittsdiagramm (1RM) |
| **Cardio** | 53 Aktivitäten, Live-Timer mit Countdown oder Nachtragen, RPE-Intensität, Kalorien über MET-Werte |
| **Mobility** | 24 Übungen, 7 geführte Routinen mit Timer und Seitenwechsel, Empfehlung nach Arbeit/Schmerzen, 4 Beweglichkeits-Selbsttests mit Verlauf |
| **Ernährung** | Kalorien- und Makroziele (Mifflin-St Jeor / Katch-McArdle), lokale Datenbank (118 Lebensmittel), Texteingabe („2 Eier, 1 Banane …“, auch per iPhone-Diktat), eigene Lebensmittel (Werte von der Verpackung), Favoriten, Rezepte, Wasser – komplett offline, ohne fremde Server |
| **Statistik** | Aktivitätskalender, Streak, Gewicht und Körperfett, Kalorien, Volumen pro Woche, Übungsfortschritt, Sätze pro Muskel, Schritte |
| **Profil** | Körperdaten, Trainingsprofil (Plan neu erstellen), Ziele, Sicherung exportieren/importieren, Zurücksetzen |

**Nicht möglich als Web-App:** direkte Apple-Health-Anbindung (Schritte daher manuell eintragen), Push-Erinnerungen ohne Server und kamerabasierte Haltungsanalyse. Die Mobility-Tests werden stattdessen von Hand gemessen.

## Auf das iPhone bringen (GitHub Pages)

Einmalig, dauert ca. 10 Minuten:

1. Auf <https://github.com> ein kostenloses Konto anlegen (falls noch keins vorhanden).
2. Oben rechts **+ → New repository**, Name z. B. `gregor-fit`, **Public**, dann **Create repository**.
3. Auf der Repository-Seite **uploading an existing file** anklicken.
4. Den **Inhalt** des Ordners `C:\Users\IT\Documents\Projekt` (index.html, sw.js, manifest.webmanifest, Ordner css, js, icons …) in das Browserfenster ziehen und **Commit changes** klicken.
5. **Settings → Pages**: unter *Branch* `main` und `/ (root)` wählen und **Save** klicken.
6. Nach 1–2 Minuten ist die App erreichbar unter `https://DEIN-NAME.github.io/gregor-fit/`.

Auf dem iPhone:

1. Die Adresse in **Safari** öffnen (nicht Chrome).
2. Auf das **Teilen-Symbol** (Quadrat mit Pfeil) tippen und **„Zum Home-Bildschirm“** wählen.
3. Die App über das neue Icon starten. Sie läuft im Vollbild und auch offline.

> Deine Trainingsdaten liegen nur auf dem iPhone, nicht auf GitHub. Exportiere unter *Profil → Sicherung exportieren* regelmäßig eine Sicherung, z. B. nach iCloud Drive.

### Updates

1. In `sw.js` die Zeile `const VERSION = 'gregorfit-v1.0.1';` hochzählen (z. B. auf `v1.0.2`). **Ohne neue Version behält das iPhone die alte App.**
2. Geänderte Dateien und `sw.js` wieder ins Repository hochladen (gleiche Namen überschreiben).
3. Die App auf dem iPhone mit Internet öffnen, schließen und erneut öffnen. Danach läuft die neue Version.

## Lokal am PC testen

```powershell
powershell -ExecutionPolicy Bypass -File tools\serve.ps1
```

Danach <http://localhost:8080> im Browser öffnen. Icons neu erzeugen: `tools\make-icons.ps1`.

## Technik

- Reines HTML, CSS und JavaScript (ES-Module), kein Build-Schritt, keine Abhängigkeiten
- Daten in `localStorage` (Schlüssel `gregorfit.v1`)
- Service Worker (`sw.js`): Cache zuerst, die App startet immer aus dem Speicher
- Keine externen Server oder Bibliotheken; nach dem ersten Öffnen läuft alles offline

```
index.html, manifest.webmanifest, sw.js
css/app.css
js/app.js            Router & Start
js/store.js          Datenspeicher
js/util.js           Helfer, Diagramme, Dialoge
js/data/             Übungen, Cardio, Lebensmittel, Mobility
js/logic/            Plan-Generator & Progression, Ernährungsrechner
js/views/            Bildschirme
icons/, tools/
```

Hinweis: Die App ersetzt keine ärztliche oder physiotherapeutische Beratung.
