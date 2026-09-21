<p align="center">
  <img src="docs/icon.png" width="132" height="132" alt="CariPrompt-Symbol">
</p>

<h1 align="center">CariPrompt</h1>

<p align="center">
  Ausgebucht, moderner Multi-Screen-Teleprompter für macOS, Windows und Linux.<br>
  <strong>Kostenlos und quelloffen</strong> — ein Werkzeug von <a href="https://github.com/CaribouNathan">Caribou Labs</a>.
</p>

<p align="center">
  <a href="https://github.com/CaribouNathan/CariPrompt/releases/latest"><img src="https://img.shields.io/github/v/release/CaribouNathan/CariPrompt?label=Version&color=007aff" alt="Neueste Version"></a>
  <img src="https://img.shields.io/badge/Plattformen-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey" alt="Plattformen">
  <a href="LICENSE"><img src="https://img.shields.io/badge/Lizenz-MIT-green" alt="MIT-Lizenz"></a>
  <img src="https://img.shields.io/badge/Preis-kostenlos-brightgreen" alt="Kostenlos">
</p>

<p align="center">
  <a href="README.md">Français</a> ·
  <a href="README.en.md">English</a> ·
  <a href="README.es.md">Español</a> ·
  <strong>Deutsch</strong> ·
  <a href="README.it.md">Italiano</a>
</p>

<p align="center">
  <img src="docs/screenshot.png" alt="CariPrompt-Oberfläche" width="900">
</p>

---

## Inhalt

- [Überblick](#überblick)
- [Funktionen](#funktionen)
- [Download](#download)
- [Installation — nicht signierte Anwendung](#installation--nicht-signierte-anwendung)
- [Erste Schritte](#erste-schritte)
- [Kurzbefehle](#kurzbefehle)
- [Präsentationsfernbedienung](#präsentationsfernbedienung)
- [Importierbare Formate](#importierbare-formate)
- [Projekte und Voreinstellungen](#projekte-und-voreinstellungen)
- [Wo werden meine Texte gespeichert?](#wo-werden-meine-texte-gespeichert)
- [Versionsverlauf](#versionsverlauf)
- [Bekannte Grenzen](#bekannte-grenzen)
- [Aus den Quellen kompilieren](#aus-den-quellen-kompilieren)
- [Lizenz](#lizenz)

## Überblick

CariPrompt verwandelt jeden Computer in eine Teleprompter-Regie:

- der **Bedienbildschirm** dient dazu, den Text zu schreiben und zu korrigieren, die Geschwindigkeit einzustellen und die Wiedergabe zu steuern;
- der **Ausgabebildschirm** (Teleprompter-Monitor, Fernseher, Beamer, als Bildschirm genutztes iPad) zeigt den Text im Vollbild, gespiegelt für die halbdurchlässige Scheibe;
- das **Vollbild** ersetzt beide für den Einsatz allein vor dem Computer.

Die Anwendung ist **kostenlos, quelloffen (MIT-Lizenz), ohne Konto, ohne Werbung und ohne Internetverbindung**. Keine Daten verlassen Ihren Computer.

### Funktioniert offline, von Grund auf

Keine Telemetrie, keine Lizenzprüfung, keine Anfrage beim Start. Alles, was während eines Drehs gebraucht wird — Anzeige, Bildlauf, Geschwindigkeit, Spiegelung, Steuerung, Aufzeichnung der Aufnahmen, lokale Projekte — funktioniert ohne Verbindung, auch beim allerersten Start.

Zwei Ausnahmen, beide durch einen Klick ausgelöst und niemals während der Wiedergabe:
- die **KI-Texte** (Übersetzung, Umschreiben fürs Sprechen) wenden sich an den gewählten Anbieter;
- die **Transkription** lädt ihr Whisper-Modell einmalig herunter; danach arbeitet sie vollständig offline.

### Leistung

Messungen an einem Skript mit **20 000 Wörtern** (2 Std. 22 Min. Lesezeit), bei Software-Rendering ohne Grafikbeschleunigung:

| Kennzahl | Wert |
|---|---|
| Zeit pro Bild während des Bildlaufs | 16,7 ms (Median), 17,6 ms im schlechtesten Fall |
| Verlorene Bilder | keine |
| Angezeigte Knoten | 515 |
| JavaScript-Speicher | 10 MB |

Der Bildlauf hält 60 Bilder pro Sekunde ohne Ruckeln. Er wird über `requestAnimationFrame` direkt auf das DOM angewendet, außerhalb des Renderzyklus der Oberfläche: Die Länge des Skripts hat keinen Einfluss auf die Geschmeidigkeit.

## Funktionen

### Wiedergabe und Geschwindigkeit

- **Geschwindigkeit von 0 bis 100**, in Schritten von 1 (0 = Text angehalten, 35 ≈ übliches Sprechtempo). Intern entspricht 1 Punkt 4 Wörtern pro Minute.
- **Geschätzte Dauer**, live aus der Wortzahl und der Geschwindigkeit berechnet.
- **Zieldauer**: Geben Sie die gewünschte Dauer des Videos an, die Geschwindigkeit wird automatisch berechnet. Eine Warnung erscheint, wenn die Dauer eine Geschwindigkeit außerhalb des Bereichs erfordert. Jede manuelle Änderung der Geschwindigkeit schaltet die Zieldauer ab.
- **3-Sekunden-Countdown** vor jedem Start (abschaltbar). Die Leertaste bricht ihn während des Countdowns ab.
- **Navigation** in Schritten von 10 Sekunden, absatzweise, mit dem Rad über der Vorschau sowie über die klickbare Fortschrittsleiste.
- **Klick in den Editor**: Die Vorschau springt sofort auf die angeklickte Stelle.
- **Geschwindigkeit und Größe mitten in der Wiedergabe ändern**, ohne dass der Text springt: Die Position bleibt erhalten.
- **Timecode** optional auf dem Sprecherbildschirm: echte Stoppuhr der Aufnahme (Pausen ausgenommen, beim Zurückspringen an den Anfang auf null gesetzt), geschätzte Restzeit oder beides.
- **Schwarzbild** sofort (Taste <kbd>B</kbd> oder <kbd>.</kbd>), wie in PowerPoint.
- **Geschmeidiger Bildlauf**, synchron zur Bildwiederholrate des Bildschirms, **Ruhezustand blockiert** während der Wiedergabe.

### Text und Typografie

- **Stil pro Auswahl**: Wählen Sie einen Textteil aus und geben Sie ihm eine Farbe, Fett oder Kursiv. Gedacht, um in einem Dialog **jedem Sprecher eine eigene Farbe** zuzuweisen. Die Stile folgen dem Text, wenn Sie ihn bearbeiten.
- **Schrift** nach Wahl aus allen auf dem Computer installierten Schriften.
- **Schriftschnitt** (mager bis schwarz), **kursiv**, **Großbuchstaben**.
- **Farben** für Text, Hintergrund und Leselinie, mit Rückkehr zu den Standardfarben.
- **Größe** von 24 bis 500 pt und **Zeilenabstand** von 1 bis 2,5.
- **Ausrichtung** links oder zentriert, einstellbare seitliche **Ränder**.
- **Rechtschreibprüfung** im Editor, passend zur Sprache der Oberfläche.
- **Widerrufen und Wiederholen**: <kbd>⌘</kbd><kbd>Z</kbd> und <kbd>⌘</kbd><kbd>⇧</kbd><kbd>Z</kbd> auf dem Mac, <kbd>Ctrl</kbd><kbd>Z</kbd> und <kbd>Ctrl</kbd><kbd>Y</kbd> sonst. Dicht aufeinanderfolgende Tastenanschläge zählen als ein einziger Schritt, Farbänderungen bilden einen eigenen Schritt, und der Cursor kehrt an die geänderte Stelle zurück.

### Anzeige und Bildschirme

- **Spiegelung** nach Wahl: keine, horizontal (klassische Prompterscheibe), vertikal oder beides (Drehung um 180°). Getrennte Einstellungen für die Vorschau und das Vollbild.
- **Originalgetreue Vorschau**: Die Vorschau wird in der exakten Auflösung des Ausgabebildschirms gerendert, die Zeilenumbrüche sind also identisch.
- **Leselinie**, markiert durch zwei Pfeile und ein Band, mit einstellbarer Position, ein- oder ausblendbar.
- **Verlauf** oben und unten am Bildschirm, damit der Blick auf der aktiven Zeile bleibt.
- Ausgabe auf **jedem angeschlossenen Bildschirm**, im Vollbild ohne Rahmen, mit automatischer Erkennung beim An- und Abstecken.
- **Vollbild** für den Einsatz allein: Schaltfläche in der Werkzeugleiste oder <kbd>⌘</kbd><kbd>⇧</kbd><kbd>F</kbd> / <kbd>Ctrl</kbd><kbd>Umschalt</kbd><kbd>F</kbd>, Verlassen mit <kbd>Esc</kbd>.
- Tastatur und Rad funktionieren auch, wenn sich die Maus über dem Ausgabebildschirm befindet.

<p align="center">
  <img src="docs/screenshot-fullscreen.png" alt="Vollbildmodus" width="720">
</p>

### Aufnahmen

Die Schaltfläche **Audioaufnahme** unter den Wiedergabetasten startet eine **Aufnahme**, die den Teleprompter mitzieht: erst der Countdown, dann der Bildlauf; das Beenden versetzt den Teleprompter in Pause.

Die Aufnahmen sind an den Text gebunden, für den sie aufgezeichnet wurden: Der Block zeigt nur die des geöffneten Textes, und das Kästchen „Alle Aufnahmen“ gibt Zugriff auf sämtliche. Jede Aufnahme wird automatisch **TAKE 01**, **TAKE 02** … benannt (die Nummerierung beginnt für jeden Text wieder bei 01) und behält ihre Uhrzeit, ihre Dauer, den verwendeten Text, die erreichte Position, die Geschwindigkeit und ihre Analyse. Sie lässt sich **umbenennen, sperren, mit einer Notiz versehen, markieren, abspielen, vergleichen, im Finder zeigen, exportieren und löschen**. Eine gesperrte Aufnahme kann weder umbenannt noch gelöscht werden. Der Ton wird als **WAV** aufgezeichnet (PCM 16 Bit, Mono, in der Abtastrate des Mikrofons): unkomprimiert, von jeder Schnittsoftware lesbar und direkt für die in 2.0 vorgesehene Transkription verwendbar.

### Rhythmus-Coach

Während einer Aufnahme wird der Ton fortlaufend analysiert, **ohne Transkription**: Pegel, Sprachaktivität, Silbenansätze. CariPrompt leitet daraus ein ungefähres Sprechtempo ab, vergleicht es mit der Geschwindigkeit des Teleprompters und zeigt einen dezenten Hinweis an — „Gutes Tempo“, „Etwas langsamer“, „Etwas schneller“. Er erscheint erst nach 2,5 Sekunden Stabilität, unterbricht die Wiedergabe nie, und ein Schalter deaktiviert ihn vollständig.

Jede Aufnahme behält ihre Analyse: durchschnittliches Sprechtempo, Abweichung vom Prompter, Anzahl der Pausen, Gesamtstille, Sprechzeit, Unregelmäßigkeit.

> [!NOTE]
> Diese Live-Analyse beruht allein auf dem Audiosignal: Sie verortet ein Tempo, sie liest die Wörter nicht. Die Analyse der Rede, Wort für Wort, erfolgt nach der Aufnahme auf Grundlage der Transkription (siehe unten).

### Sprachverfolgung

Die Schaltfläche **Stimmverfolgung** unter den Wiedergabetasten lässt den Teleprompter **Ihrer Stimme folgen**: Der Text läuft weiter, wenn Sie sprechen, **hält an, wenn Sie eine Pause machen**, und **holt eine übersprungene Stelle auf** — mit dem Hinweis „Stelle übersprungen“ auf dem Bildschirm, wenn der Coach aktiv ist. Wenn Sie zurückgehen, um einen Satz zu wiederholen, geht der Text ebenfalls zurück. Alles läuft auf dem Computer, offline.

So funktioniert es:
1. **Kontinuierliche Erkennung.** Whisper transkribiert nicht im Datenstrom: Sobald es frei ist und neue Sprache eingetroffen ist, wird es auf die letzten sechs Sekunden der laufenden Äußerung neu gestartet. Die Sprachaktivitätserkennung entscheidet, wann dekodiert wird — nie bei Stille, wo Whisper bereitwillig Text erfindet.
2. **Ausrichtung.** Das Ende jeder Transkription wird durch eine lokale Wort-für-Wort-Ausrichtung (Smith-Waterman) auf den Text bezogen, tolerant gegenüber schlecht erkannten Wörtern, in einem Fenster um die aktuelle Position. Rückwärts kostet mehr als vorwärts, und ein großer Sprung verlangt eine starke Übereinstimmung: Die Verfolgung läuft bei einem ähnlich klingenden Satz nicht davon.
3. **Regelung.** Zehnmal pro Sekunde wird die Bildlaufgeschwindigkeit zu Ihrem gemessenen Tempo plus einer Korrektur der Abweichung. Eine **Vorhersage** gleicht die Latenz von Whisper aus: Zwischen zwei Transkriptionen läuft die Position in Ihrem Tempo weiter.

Die Verfolgung nutzt das **leichteste der installierten Modelle**, für die geringste Latenz: Laden Sie **Base** (198 MB) herunter, auch wenn Sie die Aufnahmen mit Turbo transkribieren. Sprachverfolgung und eingestellte Geschwindigkeit lassen sich nicht kombinieren: Ist die Verfolgung aktiv, gibt Ihre Stimme das Tempo vor; ist sie abgeschaltet, übernimmt wieder die eingestellte Geschwindigkeit.

> [!NOTE]
> Entwicklungsmessungen, synthetische Stimme und Prozessor mit 2 Kernen: mittlere Abweichung zwischen Stimme und Text von 1,8 Wörtern mit der Engine allein, von 3 Wörtern in der vollständigen Anwendung, in der Whisper nur über einen Kern verfügt und 1,5 s pro Dekodierung braucht. Auf einem aktuellen Mac dekodiert Whisper Base in einem Bruchteil einer Sekunde: Die Abweichung verringert sich entsprechend.

### Transkription, Analyse der Rede und Untertitel

Jede Aufnahme kann **auf dem Computer transkribiert werden, ohne Verbindung**, durch Whisper. Das Modell wird einmalig aus dem Block **Transkription** heruntergeladen; danach wird jede Aufnahme am Ende der Aufzeichnung automatisch transkribiert (abschaltbar) oder auf Anforderung.

| Modell | Download | Auf der Festplatte | Anmerkung |
|---|---|---|---|
| **Turbo** (Standard) | 538 MB | 1,0 GB | Am genauesten und schneller als Small |
| Small | 610 MB | 375 MB | Mittelweg |
| Base | 198 MB | 160 MB | Am leichtesten, im Französischen merklich ungenauer |

Entwicklungsmessungen, mit einer französischen synthetischen Stimme unter sauberen Bedingungen und einem Prozessor mit 2 Kernen: Turbo machte nur einen Wortfehler auf 150 und transkribiert eine Minute Aufnahme in etwa 30 Sekunden. Eine echte Stimme, ein echter Raum und ein Mac mit 10 Kernen verändern diese Zahlen — die Genauigkeit nach unten, die Geschwindigkeit nach oben.

**Analyse der Rede**, verglichen mit dem Text des Teleprompters:

| Messwert | Was er aussagt |
|---|---|
| Texttreue | Anteil der Wörter des gelesenen Abschnitts, die tatsächlich gesprochen wurden |
| Ausgelassene Stellen | Passagen von mindestens drei nicht gesprochenen Wörtern; ein Klick führt den Teleprompter dorthin |
| Hinzugefügte Wörter | gesprochene Wörter, die im Text fehlen |
| Tempo | Wörter pro Minute, zwischen dem ersten und dem letzten Gesprochenen |
| Füllwörter, Wiederholungen | „äh“, „also“, „wir werden, wir werden“ … nur gezählt, wenn sie nicht im Text stehen |
| Zögern | Pausen von mehr als 0,8 s mitten in einem Satz |

Angaben in eckigen Klammern (`[LÄCHELN]`) werden ignoriert, und „hundertzwanzig“ im Text entspricht korrekt „120“ in der Transkription.

> [!IMPORTANT]
> Whisper **glättet Sprechstörungen gern weg**: „äh“, Fehlstarts, wiederholte Wörter. Das Modell Turbo tut dies stärker als Base. Die Zählungen von Füllwörtern und Wiederholungen sind daher **Mindestwerte**. Die ausgelassenen Stellen, die Texttreue und das Zögern hängen dagegen nicht von diesem Verhalten ab.

**Untertitel**: Die Transkription wird nach den Sendenormen aufgeteilt — höchstens zwei Zeilen à 42 Zeichen, 1 bis 7 Sekunden sichtbar, höchstens 17 Zeichen pro Sekunde —, wobei bevorzugt an Satzenden, an Kommas und vor Konjunktionen getrennt wird, nie nach einem Artikel oder einer Präposition. Die Schnitte werden an den tatsächlichen Sprechpausen ausgerichtet. Der Editor erlaubt es, die Aufnahme abzuspielen, den Text zu korrigieren, die Zeiten anzupassen (↑/↓ für ±0,1 s), am Cursor zu teilen, zusammenzuführen und zu löschen; zu schnelle Untertitel werden gekennzeichnet. **Export als SRT** (UTF-8 mit BOM, Zeilenenden CRLF, für Schnittsoftware).

### KI-Texte

Zwei Umwandlungen, ausgehend vom geöffneten Text, die jeweils einen **neuen Text** erzeugen, der direkt darunter abgelegt wird — das Original wird nie verändert:

- **Text übersetzen** ins Englische, Französische, Spanische, Deutsche, Italienische, Portugiesische oder Niederländische. Die Anweisung verlangt eine Anpassung fürs Ohr, keine Wort-für-Wort-Übersetzung.
- **Fürs Sprechen umschreiben**: kurze Sätze, die in einen Atemzug passen, Listen in Sätze umgewandelt, Entfernen dessen, was man nicht ausspricht (Klammern, Abkürzungen, „vgl.“). Eine kurze Pause wird durch „/“ markiert, eine lange Pause durch einen neuen Absatz, und die zu betonenden Wörter werden **fett** gesetzt. Keine Information, keine Zahl, kein Name und kein Handlungsaufruf wird entfernt.

Drei Schutzmechanismen hängen nicht vom Modell ab:

| Element | Behandlung |
|---|---|
| URLs, E-Mails, Variablen (`{{prenom}}`, `{x}`, `%s`, `$VAR`), Angaben in eckigen Klammern (`[LÄCHELN]`) | **Vor dem Versand durch Platzhalter ersetzt** und anschließend unverändert wiederhergestellt. Der Anbieter sieht sie nicht. |
| Zahlen | Zwischen Original und Ergebnis verglichen. Jeder Absatz, in dem eine Zahl verschwunden ist oder sich geändert hat, wird **mit seiner Nummer gemeldet**. |
| Sprecherfarben | Die Farbe eines Absatzes folgt allen Absätzen, zu denen er wird. Teilweiser Fettdruck bleibt erhalten. |

Der Anbieter wird im Block gewählt: **Claude (Anthropic)** oder **OpenAI**, mit Ihrem eigenen API-Schlüssel. Die Liste der Modelle wird direkt beim Anbieter gelesen; standardmäßig Claude Sonnet 5 und GPT-5.6 Terra. Der Schlüssel wird im Schlüsselbund des Systems verschlüsselt (Schlüsselbund von macOS, Anmeldeinformationsverwaltung von Windows, Schlüsselbund von GNOME/KDE), wird nie an die Oberfläche weitergegeben und nur an den gewählten Anbieter gesendet. Lange Texte werden in Paketen von etwa 1 200 Wörtern versendet, drei auf einmal, mit einer Fortschrittsleiste und einer Schaltfläche zum Abbrechen.

> [!NOTE]
> Da die Anwendung unter macOS nicht von einem identifizierten Entwickler signiert ist, kann der Schlüsselbund nach jedem Update Ihr Passwort verlangen, um CariPrompt das erneute Lesen seines Schlüssels zu erlauben. Wählen Sie „Immer erlauben“.

### Texte, Projekte und Voreinstellungen

- **Textbibliothek**: so viele Texte wie nötig, jeder mit seiner Geschwindigkeit, seiner Zieldauer und seinen Farben.
- **Mitgelieferte Texte**: ein Text **Welcome**, der alle Funktionen in den fünf Sprachen der Oberfläche vorstellt, und ein kurzes **Testskript** je Sprache, um die Geschwindigkeit einzustellen und die Sprachverfolgung auszuprobieren. Sie werden nur einmal hinzugefügt; ältere, unveränderte Willkommenstexte werden ersetzt, die von Ihnen bearbeiteten bleiben erhalten.
- **Mehrfachauswahl** wie im Finder: <kbd>⇧</kbd> + Klick für einen Bereich, <kbd>⌘</kbd> / <kbd>Ctrl</kbd> + Klick, um einen Text hinzuzufügen oder zu entfernen. Der Rechtsklick wirkt dann auf die gesamte Auswahl.
- **Suche nach Stichwort** in den Titeln, oben in der Liste. Unabhängig von Groß- und Kleinschreibung sowie Akzenten: „presi“ findet „Vœux du président“.
- **Automatisches Sichern** bei jeder Änderung und beim Schließen.
- **Import** per Ziehen und Ablegen an beliebiger Stelle im Fenster, über die Ablagezone der linken Spalte oder über die eigens dafür vorgesehene Schaltfläche. Jede Datei wird ein neuer Text: Nichts wird überschrieben.
- **Duplizieren, als .txt exportieren, löschen** (Rechtsklick auf einen Text), wobei das Löschen 6 Sekunden lang widerrufen werden kann.
- **Projekte `.cariprompt`**: ein Text und alle seine Einstellungen in einer Datei.
- **Voreinstellungen**: die Gesamtheit der Anzeigeeinstellungen, unter einem Namen gesichert („iPad CACE“, „Studio 2“ …) und mit einem Klick wieder aufgerufen. Sie merken sich auch die Reihenfolge der Blöcke im Bereich.
- **Neu ordenbarer Einstellungsbereich**: Jeder Block lässt sich durch Ziehen an seiner Kopfzeile verschieben, um die am häufigsten genutzten nach oben zu holen. Die Reihenfolge kehrt beim nächsten Start zur Standardanordnung zurück; um sie zu behalten, sichern Sie sie in einer Voreinstellung.

### Oberfläche

- **Fünf Sprachen**: Englisch (Standard), Französisch, Spanisch, Deutsch, Italienisch. Menüs, Dialogfenster, Meldungen und Rechtschreibprüfung folgen der gewählten Sprache.
- **Erscheinungsbild System, Hell oder Dunkel** (System als Standard).
- macOS-Stil, identisch unter Windows und Linux.
- **Einklappbare Kurzbefehl-Übersicht** unten in der linken Spalte.
- **Kein Ton**: Die Oberfläche gibt keinen Piepton von sich, auch nicht bei einer nicht erkannten Taste.
- Versionsnummer neben dem Namen der Anwendung angezeigt.
- **Einstellungsbereich mit Tabs**: **Basis** (Ausgabe, Geschwindigkeit, Zieldauer, Steuerung, Fernbedienung), **Layout** (Typografie, Farben, Layout, Timecode), **Transkript** (Aufnahmen, Transkription), **KI-Tools** und **Eigene**. In jedem Tab lassen sich die Blöcke per Ziehen und Ablegen neu ordnen und über den Pfeil in ihrer Titelzeile einklappen; das „i“ liefert die Erklärung des Blocks.
- **Tab Eigene**: Über das Menü oben im Tab fügen Sie dort einen beliebigen Block hinzu, der auch in seinem ursprünglichen Tab bleibt. Sein Inhalt bleibt von Start zu Start erhalten, und die Voreinstellungen sichern mehrere Anordnungen.
- **Unter macOS** lassen die seitlichen Spalten die Materialität des Systems durchscheinen (Vibrancy), wie die Seitenleisten der Apple-Programme, und die Trennlinien der großen Bereiche weichen schlichten Farbunterschieden.
- **Updates**: Unten im Bereich fragt „Nach Updates suchen“ die zuletzt auf GitHub veröffentlichte Version ab. Die Prüfung beim Start kann deaktiviert werden; es werden keine Daten gesendet, und die Installation bleibt manuell.

### Menüs

| System | Ort |
|---|---|
| macOS | Menüleiste am oberen Bildschirmrand: **CariPrompt**, **Ablage**, **Bearbeiten**, **Darstellung** (Erscheinungsbild, Sprache), **Prompter**, **Fenster** — sowie die Schaltfläche **☰** im Fenster |
| Windows / Linux | Schaltfläche **☰** oben links im Fenster |

Die Schaltfläche **☰** gibt auf allen drei Systemen Zugriff auf **Ablage**, **Prompter**, **Erscheinungsbild**, **Sprache**, **Über CariPrompt** und **Beenden**.
Auf Englisch heißen die Menüs *File*, *Edit*, *View* (*Appearance*, *Language*), *Prompter*, *Window*.
Die Einstellungen für Sprache und Erscheinungsbild werden gesichert und beim nächsten Start übernommen.

## Download

Die Dateien stehen auf der Seite **[Releases](https://github.com/CaribouNathan/CariPrompt/releases/latest)** bereit.

| System | Datei | Anmerkung |
|---|---|---|
| macOS — Apple Silicon (M1 bis M4) | `CariPrompt-2.2.2-macOS-AppleSilicon.dmg` | macOS 12 oder neuer, Installation per Ziehen und Ablegen |
| macOS — Apple Silicon (M1 bis M4) | `CariPrompt-2.2.2-macOS-AppleSilicon.zip` | Dieselbe Anwendung, ohne Image-Datei |
| Windows 10 / 11 (64 Bit) | `CariPrompt-2.2.2-Windows-Setup.exe` | Klassisches Installationsprogramm |
| Windows 10 / 11 (64 Bit) | `CariPrompt-2.2.2-Windows-Portable.exe` | Ohne Installation, startet direkt |
| Linux x86_64 | `CariPrompt-2.2.2-Linux-x86_64.AppImage` | Alle Distributionen |
| Debian, Ubuntu und Derivate | `CariPrompt-2.2.2-Linux-amd64.deb` | Installierbares Paket |

> Seit 2.0.2 werden nur noch Macs mit **Apple Silicon** (M1 und neuer) bereitgestellt: Menü  › **Über diesen Mac**, Zeile **Chip**. Auf einem Intel-Mac lässt sich die Anwendung mit `MAC_ARCHS=x64 npm run dist:mac` aus den Quellen kompilieren.

## Installation — nicht signierte Anwendung

> [!IMPORTANT]
> CariPrompt ist ein kostenloses, persönliches Projekt. Es **ist nicht signiert**, weder mit einem Apple-Developer-Zertifikat noch mit einem Windows-Code-Signing-Zertifikat: Diese Zertifikate sind kostenpflichtig und jährlich zu erneuern.
> Ihr System zeigt daher beim ersten Start eine Warnung an. Das ist normal. Der Quellcode ist in diesem Repository vollständig einsehbar.

### macOS

1. Öffnen Sie die `.dmg`-Datei und ziehen Sie **CariPrompt** auf die Verknüpfung **Programme** (oder entpacken Sie die `.zip`-Datei und ziehen Sie **CariPrompt.app** in **Programme**).
2. Starten Sie die Anwendung. macOS meldet, dass sie nicht überprüft werden kann: Klicken Sie auf **Fertig** (oder **OK**).
3. Öffnen Sie **Systemeinstellungen › Datenschutz & Sicherheit**. Klicken Sie unten auf der Seite neben der Meldung zu CariPrompt auf **Trotzdem öffnen** und bestätigen Sie.
4. Starten Sie CariPrompt erneut: Die Warnung erscheint nicht mehr.

**Alternative über das Terminal** (entfernt das vom Browser hinzugefügte Quarantäne-Attribut):

```bash
xattr -cr /Applications/CariPrompt.app
```

> Wenn macOS meldet, die Anwendung sei „beschädigt“, handelt es sich um denselben Schutzmechanismus: Verwenden Sie den obigen Befehl.

### Windows

1. Starten Sie `CariPrompt-2.2.2-Windows-Setup.exe` (oder die portable Version).
2. **Der Computer wurde durch Windows geschützt** (SmartScreen) erscheint: Klicken Sie auf **Weitere Informationen** und dann auf **Trotzdem ausführen**.
3. Das Installationsprogramm erlaubt die Wahl des Installationsordners. Eine Verknüpfung wird im Startmenü und auf dem Desktop angelegt.

### Linux

**AppImage**:

```bash
chmod +x CariPrompt-2.2.2-Linux-x86_64.AppImage
./CariPrompt-2.2.2-Linux-x86_64.AppImage
```

Einige aktuelle Distributionen verlangen die Bibliothek FUSE 2 (`sudo apt install libfuse2t64` unter Ubuntu 24.04).

**Paket .deb**:

```bash
sudo apt install ./CariPrompt-2.2.2-Linux-amd64.deb
```

## Erste Schritte

1. **Laden Sie den Text**: tippen Sie ihn ein, fügen Sie ihn ein oder legen Sie eine Datei im Fenster ab.
2. **Färben Sie die Sprecher ein** (optional): Wählen Sie eine Replik aus und klicken Sie in der Leiste **Auswahl** auf eine Farbe.
3. **Stellen Sie die Geschwindigkeit ein** oder aktivieren Sie **Zieldauer** und geben Sie die gewünschte Dauer an.
4. **Wählen Sie den Ausgabebildschirm** und die **Spiegelung**, und klicken Sie dann auf **Ausgabe einblenden**. Ohne zweiten Bildschirm nutzen Sie das **Vollbild**.
5. **Starten Sie** mit <kbd>⌥</kbd><kbd>Leertaste</kbd>. Passen Sie live mit dem Rad oder den Pfeiltasten an.
6. **Sichern** Sie Ihre Einstellungen als Voreinstellung oder die Gesamtheit aus Text + Einstellungen als Projekt `.cariprompt`.

## Kurzbefehle

Die Kurzbefehle des Teleprompters sind aktiv, sobald sich der Cursor nicht in einem Eingabefeld befindet. <kbd>Esc</kbd> verlässt das Textfeld, ein Klick auf die Vorschau ebenfalls.

| Taste | Aktion |
|---|---|
| <kbd>⌥</kbd> <kbd>Leertaste</kbd> (<kbd>Alt</kbd> <kbd>Leertaste</kbd> unter Windows und Linux) | Wiedergabe / Pause (bricht den laufenden Countdown ab). Funktioniert auch während der Texteingabe. |
| <kbd>↓</kbd> / <kbd>↑</kbd> | Schneller / langsamer (±1) |
| <kbd>←</kbd> / <kbd>→</kbd> | 10 Sekunden zurück / vor |
| <kbd>+</kbd> / <kbd>−</kbd> | Text vergrößern / verkleinern, auch während der Wiedergabe |
| Rad oder Trackpad über der Vorschau | Im Text navigieren (<kbd>⌥</kbd>: Geschwindigkeit ändern) |
| Rad oder Trackpad anderswo | Schneller / langsamer |
| <kbd>B</kbd> oder <kbd>.</kbd> | Schwarzbild |
| <kbd>Bild ab</kbd> / <kbd>Bild auf</kbd> | Tasten der Fernbedienung (Aktionen einstellbar) |
| <kbd>F5</kbd> | Wiedergabe |
| <kbd>Pos 1</kbd> | Zurück zum Anfang |
| <kbd>Esc</kbd> | Eingabefeld oder Vollbild verlassen |

| macOS | Windows / Linux | Aktion |
|---|---|---|
| <kbd>⌘</kbd> <kbd>Z</kbd> | <kbd>Ctrl</kbd> <kbd>Z</kbd> | Widerrufen |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>Z</kbd> | <kbd>Ctrl</kbd> <kbd>Y</kbd> | Wiederholen |
| <kbd>⌘</kbd> <kbd>N</kbd> | <kbd>Ctrl</kbd> <kbd>N</kbd> | Neuer Text |
| <kbd>⌘</kbd> <kbd>O</kbd> | <kbd>Ctrl</kbd> <kbd>O</kbd> | Dateien importieren |
| <kbd>⌘</kbd> <kbd>S</kbd> | <kbd>Ctrl</kbd> <kbd>S</kbd> | Projekt sichern |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>O</kbd> | <kbd>Ctrl</kbd> <kbd>Umschalt</kbd> <kbd>O</kbd> | Projekt öffnen |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>F</kbd> | <kbd>Ctrl</kbd> <kbd>Umschalt</kbd> <kbd>F</kbd> oder <kbd>F11</kbd> | Vollbild |
| <kbd>⌘</kbd> <kbd>D</kbd> | <kbd>Ctrl</kbd> <kbd>D</kbd> | Text duplizieren |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>E</kbd> | <kbd>Ctrl</kbd> <kbd>Umschalt</kbd> <kbd>E</kbd> | Als .txt exportieren |
| <kbd>⌘</kbd> <kbd>R</kbd> | <kbd>Ctrl</kbd> <kbd>R</kbd> | Zurück zum Anfang |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>D</kbd> | <kbd>Ctrl</kbd> <kbd>Umschalt</kbd> <kbd>D</kbd> | Ausgabe ein- / ausblenden |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>T</kbd> | <kbd>Ctrl</kbd> <kbd>Umschalt</kbd> <kbd>T</kbd> | Sprachverfolgung (ein / aus) |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>R</kbd> | <kbd>Ctrl</kbd> <kbd>Umschalt</kbd> <kbd>R</kbd> | Audioaufnahme (ein / aus) |

Die Richtung des Rades folgt der Einstellung **natürliches Scrollen** von macOS. Sie lässt sich unter **Einstellungen › Steuerung** umkehren, wo auch die Aktion des Rades über der Vorschau gewählt wird: **im Text navigieren** (Standard) oder **Geschwindigkeit ändern**. Die Taste <kbd>⌥</kbd> löst jeweils die andere Aktion aus.
In der Bearbeitungsspalte, der Textliste und den Einstellungen scrollt das Rad ganz normal.

## Präsentationsfernbedienung

CariPrompt lässt sich mit den für PowerPoint gedachten Fernbedienungen steuern (Logitech R400 / R500 / Spotlight, Kensington, Targus …), die sich wie eine Tastatur verhalten:

| Taste | Aktion |
|---|---|
| Weiter (Bild ab) | Frei wählbar, standardmäßig **Wiedergabe / Pause** |
| Zurück (Bild auf) | Frei wählbar, standardmäßig **10 s zurück** |
| Präsentation starten (F5) | Wiedergabe |
| Schwarzbild (B oder .) | Schwarzbild / zurück zum Text |

Verfügbare Aktionen für Weiter und Zurück: Wiedergabe / Pause, nächster Absatz, vorheriger Absatz, 10 s vor oder zurück, schneller, langsamer, zurück zum Anfang, nichts.

## Importierbare Formate

| Format | Endungen | Anmerkung |
|---|---|---|
| Reiner Text | `.txt` `.text` `.md` `.markdown` | UTF-8, UTF-16 oder Windows-1252 automatisch erkannt |
| Word | `.docx` | |
| Word 97-2003 | `.doc` | Nur der Haupttext |
| RTF | `.rtf` | |
| OpenDocument | `.odt` | LibreOffice, OpenOffice |
| HTML | `.html` `.htm` | |
| PDF | `.pdf` | Layoutbedingte Zeilenumbrüche werden entfernt |
| CariPrompt-Projekt | `.cariprompt` | Text **und** Einstellungen |

Nicht unterstützt: **Pages**-Dateien (zuerst als `.docx` oder `.pdf` exportieren) und **gescannte PDFs** ohne Textebene. Der Import übernimmt den Text, nicht die Formatierung des Ursprungsdokuments.

## Projekte und Voreinstellungen

|  | Projekt `.cariprompt` | Voreinstellung |
|---|---|---|
| Enthält den Text und seine Farben | Ja | Nein |
| Enthält die Anzeigeeinstellungen | Ja | Ja |
| Enthält die Reihenfolge der Blöcke im Bereich | Ja | Ja |
| Speicherort | Datei, an einem Ort Ihrer Wahl | In der Anwendung |
| Verwendung | Ein vollständiges Thema archivieren oder weitergeben | Eine Gerätekonfiguration wieder aufrufen |

- **Ein Projekt sichern**: <kbd>⌘</kbd><kbd>S</kbd> / <kbd>Ctrl</kbd><kbd>S</kbd>. **Es öffnen**: <kbd>⌘</kbd><kbd>⇧</kbd><kbd>O</kbd>, Ziehen und Ablegen oder Doppelklick auf die Datei. Der Text wird der Bibliothek hinzugefügt und die Einstellungen werden angewendet.
- **Eine Voreinstellung sichern**: Schaltfläche **Aktuelle Einstellungen sichern…** oben in den Einstellungen, dann ein Name („iPad CACE“). Ein Klick auf ihre Plakette ruft sie auf, das Kreuz löscht sie.
- In beiden Fällen werden **Sprache**, **Erscheinungsbild** und **Ausgabebildschirm** nicht übernommen: Sie bleiben dem jeweils verwendeten Computer eigen.
- Die Projektdatei liegt im JSON-Format vor, lesbar und bearbeitbar.

## Wo werden meine Texte gespeichert?

Die Texte (`scripts.json`) und die Einstellungen (`settings.json`, die auch die Voreinstellungen enthält) werden lokal gesichert:

| System | Ordner |
|---|---|
| macOS | `~/Library/Application Support/CariPrompt/` |
| Windows | `%APPDATA%\CariPrompt\` |
| Linux | `~/.config/CariPrompt/` |

Die Aufnahmen liegen im Unterordner `takes/`: eine Audiodatei je Aufnahme und ein Index `index.json`.
Die API-Schlüssel der KI-Texte liegen in `ai-keys.json`, verschlüsselt durch den Schlüsselbund des Systems.
Die Transkriptionsmodelle liegen im Unterordner `stt/`; sie lassen sich über den Block Transkription entfernen.
Um Ihre Texte zu sichern oder zu übertragen, kopieren Sie `scripts.json`.
Bei Problemen werden interne Fehler in `cariprompt.log` im selben Ordner protokolliert.

## Versionsverlauf

Die Einzelheiten stehen im [CHANGELOG](CHANGELOG.md).

| Version | Technologie | Plattformen | Wichtigste Neuerungen |
|---|---|---|---|
| **2.2.2** | Electron | macOS Apple Silicon, Windows, Linux | macOS-Vibrancy auf den Spalten, besser abgesetzte Vorschau, README in fünf Sprachen |
| 2.2.1 | Electron | macOS Apple Silicon, Windows, Linux | Freigestelltes Symbol, Tabs in einer Zeile in allen Sprachen, durchscheinende Spalten unter macOS |
| 2.2.0 | Electron | macOS Apple Silicon, Windows, Linux | Einstellungsbereich mit Tabs, einklappbare Blöcke, anpassbarer Tab, Update-Prüfung, .dmg-Image, schlankere Anwendung |
| 2.1.0 | Electron | macOS Apple Silicon, Windows, Linux | Mehrsprachiger Text „Welcome“ und mitgelieferte Testskripte; Kurzbefehle für die Sprachverfolgung und die Aufnahme |
| 2.0.2 | Electron | macOS Apple Silicon, Windows, Linux | Neues Symbol; Ende der Mac-Intel-Version |
| 2.0.1 | Electron | macOS, Windows, Linux | Schaltflächen „Stimmverfolgung“ und „Audioaufnahme“ beschriftet und übersetzt, samt ihrem Zustand |
| 2.0.0 | Electron | macOS, Windows, Linux | Sprachverfolgung: Der Teleprompter folgt der Stimme, hält bei Pausen an, holt übersprungene Stellen auf; Text bis 500 pt |
| 1.9.1 | Electron | macOS, Windows, Linux | Klare Meldung, wenn das API-Konto kein Guthaben mehr hat; Rückkehr von Windows, Linux und macOS Intel |
| 1.9.0 | Electron | macOS, Windows, Linux | Lokale Transkription (Whisper), Analyse der Rede im Vergleich zum Text, Untertitel und SRT-Export |
| 1.8.0 | Electron | macOS, Windows, Linux | KI-Texte: Übersetzung und Umschreiben fürs Sprechen, Claude oder OpenAI, geschützte Elemente und geprüfte Zahlen |
| 1.7.3 | Electron | macOS, Windows, Linux | Aufzeichnung der Aufnahmen als WAV, an ihren Text gebunden, Rhythmus-Coach, Widerrufen im Editor |
| 1.6.0 | Electron | macOS, Windows, Linux | Fünf Sprachen der Oberfläche, Textsuche, Leistung an 20 000 Wörtern bestätigt |
| 1.5.0 | Electron | macOS, Windows, Linux | Neu ordenbarer Einstellungsbereich, Text bis 400 pt, Wiedergabe/Pause auf ⌥ + Leertaste |
| 1.4.2 | Electron | macOS, Windows, Linux | Navigation mit dem Rad, Mehrfachauswahl, Synchronisierung per Klick, macOS-Korrektur der Menüleiste |
| 1.4.1 | Electron | macOS, Windows, Linux | Stil pro Auswahl (Farbe je Sprecher), Voreinstellungen, Ablagezone, neues Symbol |
| 1.4.0 | Electron | macOS, Windows, Linux | Typografie und Farben, Projekte `.cariprompt`, Präsentationsfernbedienung, Zeilenabstand, Geschwindigkeit 0–100, Vollbild, Timecode |
| 1.3.1 | Electron | macOS, Windows, Linux | Ausblendbare Leselinie, englische und französische Willkommenstexte, Layout-Korrekturen |
| 1.3.0 | Electron | macOS, Windows, Linux | Oberfläche auf Englisch oder Französisch, Erscheinungsbild System / Hell / Dunkel, Schaltfläche ☰ |
| 1.2.0 | Electron | macOS, Windows, Linux | Erste plattformübergreifende Version, Symbol, einsatzbereite Binärdateien |
| 1.1.0 | SwiftUI | macOS | Dokumentenimport, Textbibliothek |
| 1.0.0 | SwiftUI | macOS | Erste Version: gespiegelte Ausgabe, Zieldauer, Countdown, Kurzbefehle |

Die Versionen 1.0 und 1.1 (nativ für macOS) werden durch die Electron-Version ersetzt. Auf dem Mac wird die Textbibliothek von einer Version zur nächsten automatisch übernommen.

## Bekannte Grenzen

- **Nicht signierte Anwendung**: Warnung beim ersten Start (siehe [Installation](#installation--nicht-signierte-anwendung)).
- **Gleichförmige Geschwindigkeit über die Höhe**: Die Geschwindigkeit wird aus der durchschnittlichen Wortzahl pro Zeile berechnet. Eine kurze Zeile läuft mit derselben Geschwindigkeit durch wie eine volle Zeile.
- **Schriften**: Die Liste wird beim ersten Anzeigen der Einstellungen gelesen (einige Sekunden auf einem Mac mit vielen Schriften). Eine Schrift, die auf dem Computer fehlt, der ein Projekt öffnet, wird durch die Systemschrift ersetzt.
- **Verbleibender Timecode**: Schätzung auf Grundlage der aktuellen Geschwindigkeit, er ändert sich, wenn sich die Geschwindigkeit ändert.
- **Trackpad**: Der Nachlauf lässt sich nicht von einer gewollten Geste unterscheiden, die Taktrate der Geschwindigkeitsänderung ist daher begrenzt.
- **Keine automatische Aktualisierung**: Neue Versionen sind in den Releases herunterzuladen.
- **Linux**: Nur die Architektur x86_64 wird bereitgestellt.
- **Sprachverfolgung**: Der Text muss gelesen werden. Eine Improvisation, die davon abweicht, versetzt die Verfolgung in den Zustand „verloren“ (orange Schaltfläche): Der Text wartet, bis die Stimme den Text wiederfindet. Ein Satz, der an anderer Stelle im Text wiederholt wird, kann die Verfolgung in seltenen Fällen anziehen; sie richtet sich beim nächsten Satz wieder aus.
- **Transkription**: Whisper liefert mit diesen Modellen nicht den Zeitstempel jedes Wortes, sondern nur den jedes Segments. Die Aufteilung der Untertitel innerhalb eines Segments erfolgt daher proportional, ausgerichtet an den erkannten Sprechpausen. Die Zählungen von Füllwörtern und Wiederholungen sind Mindestwerte (siehe oben).
- **KI-Texte**: Die Prüfung der Zahlen vergleicht Ziffernfolgen, keine Werte. „10000“, umgeschrieben zu „10 000“, wird fälschlich gemeldet; umgekehrt bleibt eine Zahl, die in einen anderen Satz desselben Absatzes verschoben wurde, unbemerkt. Eine schließende Klammer am Ende einer URL (`…/Page_(X)`) wird für Satzzeichen gehalten.

## Aus den Quellen kompilieren

Voraussetzung: [Node.js](https://nodejs.org) 22 oder neuer.

```bash
git clone https://github.com/CaribouNathan/CariPrompt.git
cd CariPrompt
npm install
npm start            # startet die Anwendung im Entwicklungsmodus
```

Erstellung der Pakete (abgelegt in `release/`):

| Befehl | Ergebnis | Auszuführen unter |
|---|---|---|
| `npm run dist:mac` | `.zip` für Apple Silicon, ad hoc signiert (`MAC_ARCHS=x64` für Intel) | macOS oder Linux (mit [rcodesign](https://github.com/indygreg/apple-platform-rs)) |
| `npm run dist:win` | NSIS-Installationsprogramm und portable Version | Windows, oder Linux/macOS mit Wine |
| `npm run dist:linux` | AppImage und `.deb` | Linux |

Auf dem Mac verkettet `build.command` die Installation der Abhängigkeiten und die Erstellung der Pakete.

### Architektur

```
src/
├── main/          Electron-Hauptprozess
│   ├── main.ts        Bedien- und Ausgabefenster, Bildschirme, Speicherung, Menüs, Projekte
│   ├── preload.ts     der Oberfläche zur Verfügung gestellte API
│   ├── importer.ts    Lesen von txt, rtf, doc, docx, odt, html, pdf
│   ├── fonts.ts       Liste der installierten Schriften
│   ├── takes.ts       Speicherung der Aufnahmen und ihres Index
│   ├── ai.ts          API-Schlüssel, Aufrufe an Claude / OpenAI, geschützte Platzhalter, Zahlenprüfung
│   ├── stt.ts         Whisper-Modelle: Download, Entpacken, Transkriptionswarteschlange, Sprachverfolgung
│   ├── liveStt.ts     kontinuierliche Erkennung: VAD im Datenstrom, Whisper mit gleitenden Fenstern
│   ├── sttEngine.ts   WAV, Neuabtastung auf 16 kHz, VAD Silero, Whisper nach Fenstern
│   └── sttExtract.ts  Ersatz-Entpacken von .tar.bz2, in einem Thread
├── renderer/      React-Oberfläche
│   ├── App.tsx            Bedienbildschirm und Vollbild
│   ├── Output.tsx         Ausgabebildschirm
│   ├── PrompterCanvas.tsx Rendering, Bildlauf, Timecode
│   ├── RichEditor.tsx     Editor mit Stilen pro Auswahl
│   ├── recorder.ts        Mikrofonaufnahme und Signalanalyse
│   ├── pcmTap.ts          PCM-Erfassung (AudioWorklet), wav.ts: WAV-Kodierung
│   ├── aiText.ts          Aufteilung in Absätze, Übertragung der Stile
│   ├── speechAnalysis.ts  Wort-für-Wort-Ausrichtung, ausgelassene Stellen, Füllwörter, Zögern
│   ├── liveAlign.ts       Live-Ausrichtung (Smith-Waterman), Tempo, Vorhersage
│   ├── subtitles.ts       Aufteilung nach Sendenormen, SRT
│   ├── store.ts           Zustand, Wiedergabe, Bibliothek, Projekte, Aufnahmen (zustand)
│   └── input.ts           Tastatur, Rad, Fernbedienung
└── shared/        Gemeinsamer Code
    ├── types.ts       Typen und Berechnungen
    ├── marks.ts       Teilstile des Textes
    ├── i18n.ts        Übersetzungen
    └── locales/       en, fr, es, de, it
```

Prinzip der Synchronisierung: Die Wiedergabeposition ist ein Fortschritt von 0 bis 1, unabhängig vom Layout. Der Bedienbildschirm sendet einen Ankerpunkt (Position und Zeitstempel) an den Ausgabebildschirm. Jedes Fenster berechnet anschließend seine Position bei jedem Bild. Beide Bildschirme bleiben ohne fortlaufenden Austausch synchron.

Stack: Electron, React, TypeScript, Vite, zustand, mammoth, word-extractor, unpdf, JSZip, sherpa-onnx (Whisper, VAD Silero).

### Mitwirken

Fehlermeldungen und Vorschläge sind in den [Issues](https://github.com/CaribouNathan/CariPrompt/issues) willkommen. Geben Sie Ihr System, die Version von CariPrompt und nach Möglichkeit die betroffene Datei an.

## Roadmap — von 1.6 bis 2.0

| Schritt | Inhalt | Status |
|---|---|---|
| 1.6.0 | Fünf Sprachen, Textsuche, garantiert offline, bestätigte Leistung | ausgeliefert |
| 1.7.3 | Aufzeichnung und Verwaltung der Aufnahmen, Rhythmus-Coach, Widerrufen im Editor | ausgeliefert |
| 1.8.0 | Übersetzung von Skripten, Umwandlung schriftlich → mündlich (Claude oder OpenAI) | ausgeliefert |
| **1.9.0** | Lokale Transkription (Whisper), Untertitel und SRT-Export, Analyse der Rede nach der Aufnahme | ausgeliefert |
| **2.0.0** | Sprachverfolgung in Echtzeit | ausgeliefert |

Die Transkriptionsfunktionen werden eine **lokale** Engine nutzen, damit sie bei Dreharbeiten ohne Netz nutzbar bleiben. Die KI-Textfunktionen (Übersetzung, Umschreiben fürs Sprechen) werden eine Verbindung und einen vom Benutzer bereitgestellten API-Schlüssel benötigen; sie bleiben optional und ohne Auswirkung auf den Teleprompter selbst.

## Lizenz

CariPrompt ist **freie und kostenlose Software**, veröffentlicht unter der [MIT-Lizenz](LICENSE).
Sie dürfen sie nutzen, auch für kommerzielle Drehs, sie verändern und frei weitergeben.

© 2026 Nathan Carrillat — Caribou Labs
