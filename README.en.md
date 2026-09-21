<p align="center">
  <img src="docs/icon.png" width="132" height="132" alt="CariPrompt icon">
</p>

<h1 align="center">CariPrompt</h1>

<p align="center">
  A simple, modern multi-screen teleprompter for macOS, Windows and Linux.<br>
  <strong>Free and open source</strong> — a <a href="https://github.com/CaribouNathan">Caribou Labs</a> tool.
</p>

<p align="center">
  <a href="https://github.com/CaribouNathan/CariPrompt/releases/latest"><img src="https://img.shields.io/github/v/release/CaribouNathan/CariPrompt?label=version&color=007aff" alt="Latest release"></a>
  <img src="https://img.shields.io/badge/platforms-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey" alt="Platforms">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="MIT license"></a>
  <img src="https://img.shields.io/badge/price-free-brightgreen" alt="Free">
</p>

<p align="center">
  <a href="README.md">Français</a> ·
  <strong>English</strong> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.de.md">Deutsch</a> ·
  <a href="README.it.md">Italiano</a>
</p>

<p align="center">
  <img src="docs/screenshot.png" alt="CariPrompt interface" width="900">
</p>

---

## Contents

- [Overview](#overview)
- [Features](#features)
- [Download](#download)
- [Installation — unsigned app](#installation--unsigned-app)
- [Getting started](#getting-started)
- [Shortcuts](#shortcuts)
- [Presentation clicker](#presentation-clicker)
- [Importable formats](#importable-formats)
- [Projects and presets](#projects-and-presets)
- [Where are my scripts stored?](#where-are-my-scripts-stored)
- [Version history](#version-history)
- [Known limitations](#known-limitations)
- [Building from source](#building-from-source)
- [License](#license)

## Overview

CariPrompt turns any computer into a teleprompter control room:

- the **operator screen** is where you write and fix the script, set the speed and drive playback;
- the **output screen** (prompter monitor, TV, projector, iPad used as a display) shows the text full screen, flipped for the beam-splitter glass;
- **full screen** replaces both for solo use, sitting in front of the computer.

The app is **free, open source (MIT license), with no account, no ads and no internet connection**. No data leaves your computer.

### Works offline by design

No telemetry, no license check, no request at startup. Everything you need during a shoot — display, scrolling, speed, mirror, controls, take recording, local projects — works without a connection, including on first launch.

Two exceptions, both triggered by a click and never during playback:
- **AI writing** (translation, adaptation for speaking) contacts the chosen provider;
- **transcription** downloads its Whisper model once; after that, it runs entirely offline.

### Performance

Measurements on a **20,000-word** script (2 h 22 min of reading), in software rendering with no graphics acceleration:

| Metric | Value |
|---|---|
| Frame time while scrolling | 16.7 ms (median), 17.6 ms worst case |
| Dropped frames | none |
| Rendered nodes | 515 |
| JavaScript memory | 10 MB |

Scrolling holds 60 frames per second without stutter. It is applied directly to the DOM by `requestAnimationFrame`, outside the interface render cycle: the size of the script has no effect on smoothness.

## Features

### Playback and speed

- **Speed from 0 to 100**, in steps of 1 (0 = text stopped, 35 ≈ ordinary speaking pace). Internally, 1 point equals 4 words per minute.
- **Estimated duration** computed live from the word count and the speed.
- **Target duration**: enter the duration you want for the video and the speed is computed automatically. A warning appears if the duration would require a speed out of range. Any manual speed change turns off the target duration.
- **3-second countdown** before each start (can be turned off). Space during the countdown cancels it.
- **Navigation** in 10-second steps, by paragraph, with the wheel over the preview, and a clickable progress bar.
- **Click in the editor**: the preview jumps straight to the passage you clicked.
- **Speed and size changes in mid-playback**, with no jump in the text: the position is kept.
- Optional **timecode** on the presenter's screen: real take timer (pauses excluded, reset when you go back to the start), estimated time remaining, or both.
- Instant **black screen** (<kbd>B</kbd> or <kbd>.</kbd>), as in PowerPoint.
- **Smooth scrolling** synchronized with the screen refresh, **sleep blocked** during playback.

### Text and typography

- **Styling by selection**: select part of the text and give it a color, bold or italic. Designed to assign **one color per speaker** in a dialogue. Styles follow the text as you edit it.
- **Font** chosen from every font installed on the computer.
- **Weight** (light to black), **italic**, **all caps**.
- **Colors** for the text, the background and the reading line, with a reset to the default colors.
- **Size** from 24 to 500 pt and **line spacing** from 1 to 2.5.
- **Alignment** left or center, adjustable side **margins**.
- **Spell checker** in the editor, matching the interface language.
- **Undo and redo**: <kbd>⌘</kbd><kbd>Z</kbd> and <kbd>⌘</kbd><kbd>⇧</kbd><kbd>Z</kbd> on a Mac, <kbd>Ctrl</kbd><kbd>Z</kbd> and <kbd>Ctrl</kbd><kbd>Y</kbd> elsewhere. Keystrokes close together count as a single step, color changes form a step of their own, and the cursor returns to the spot that was edited.

### Display and screens

- **Mirror** options: none, horizontal (classic prompter glass), vertical or both (180° rotation). Separate settings for the preview and for full screen.
- **True-to-output preview**: the preview is rendered at the exact resolution of the output screen, so the line breaks are identical.
- **Reading line** marked by two arrows and a band, adjustable position, shown or hidden.
- **Gradient** at the top and bottom of the screen to keep the eye on the active line.
- Output on **any connected screen**, full screen with no border, with automatic detection when screens are plugged in or unplugged.
- **Full screen** for solo use: button in the toolbar or <kbd>⌘</kbd><kbd>⇧</kbd><kbd>F</kbd> / <kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>F</kbd>, exit with <kbd>Esc</kbd>.
- The keyboard and the wheel also work when the mouse is over the output screen.

<p align="center">
  <img src="docs/screenshot-fullscreen.png" alt="Full screen mode" width="720">
</p>

### Takes

The **Audio rec** button, below the playback controls, starts a **take**, which drives the prompter: countdown, then scrolling; stopping puts the prompter on pause.

Takes are attached to the script they were recorded for: the block only lists those of the open script, and an "All takes" checkbox gives access to the whole set. Each take is named automatically **TAKE 01**, **TAKE 02**… (numbering restarts at 01 for each script) and keeps its time, its duration, the script used, the position reached, the speed and its analysis. It can be **renamed, locked, annotated, marked, played, compared, shown in the Finder, exported and deleted**. A locked take can be neither renamed nor deleted. Audio is recorded in **WAV** (16-bit PCM, mono, at the microphone's sample rate): uncompressed, readable by every editing application, and directly usable by the transcription planned for 2.0.

### Rhythm coach

During a take, the sound is analyzed continuously, **without transcription**: level, voice activity, syllable onsets. CariPrompt infers an approximate speech rate from it, compares it with the prompter speed and shows a discreet hint — "Good pace", "Slow down slightly", "Speed up slightly". It only appears after 2.5 seconds of stability, never interrupts playback, and a switch turns it off completely.

Each take keeps its analysis: average speech rate, gap with the prompter, number of pauses, total silence, speaking time, irregularity.

> [!NOTE]
> This live analysis relies on the audio signal alone: it locates a rhythm, it does not read the words. Word-by-word speech analysis happens after the take, from the transcript (see below).

### Voice tracking

The **Voice tracking** button, below the playback controls, makes the prompter **follow your voice**: the text moves forward when you speak, **stops when you pause**, and **catches up when you skip a passage** — with the "Passage skipped" hint on screen if the coach is on. If you go back to redo a sentence, the text goes back too. Everything happens on the computer, offline.

How it works:
1. **Continuous recognition.** Whisper does not transcribe as a stream: as soon as it is free and new speech has come in, it is run again on the last six seconds of the current utterance. Voice activity detection decides when to decode — never on silence, where Whisper happily invents text.
2. **Alignment.** The end of each transcript is matched back to the script by a local word-by-word alignment (Smith-Waterman), tolerant of misrecognized words, in a window around the current position. Going back costs more than going forward, and a long jump requires a strong match: tracking does not run away on a similar-sounding sentence.
3. **Regulation.** Ten times per second, the scrolling rate becomes your measured pace plus a correction for the gap. A **prediction** compensates for Whisper's latency: between two transcripts, the position advances at your pace.

Tracking uses the **lightest of the installed models**, for the lowest latency: download **Base** (198 MB) even if you transcribe takes with Turbo. Voice tracking and the set speed do not combine: when tracking is on, your voice sets the pace; when it is off, the set speed takes over again.

> [!NOTE]
> Development measurements, synthetic voice and a 2-core processor: median gap between voice and text of 1.8 words with the engine alone, 3 words in the full application, where Whisper gets only one core and takes 1.5 s per decode. On a recent Mac, Whisper Base decodes in a fraction of a second: the gap shrinks accordingly.

### Transcription, speech analysis and subtitles

Every take can be **transcribed on the computer, with no connection**, by Whisper. The model is downloaded once from the **Transcription** block; after that, each take is transcribed automatically at the end of the recording (can be turned off), or on demand.

| Model | Download | On disk | Note |
|---|---|---|---|
| **Turbo** (default) | 538 MB | 1.0 GB | The most accurate, and faster than Small |
| Small | 610 MB | 375 MB | Intermediate |
| Base | 198 MB | 160 MB | The lightest, noticeably less accurate in French |

Development measurements, on a French synthetic voice in clean conditions and a 2-core processor: Turbo made only one word error out of 150, and transcribes one minute of take in about 30 seconds. A real voice, a real room and a 10-core Mac will change these figures — accuracy downwards, speed upwards.

**Speech analysis**, compared with the prompter script:

| Measure | What it tells you |
|---|---|
| Script coverage | share of the words in the passage read that were actually spoken |
| Skipped passages | stretches of at least three words that were not spoken; a click takes the prompter there |
| Added words | words spoken that are not in the script |
| Pace | words per minute, between the first and the last speech |
| Filler words, repetitions | "um", "you know", "we are going to, we are going to"… counted only if they are not in the script |
| Hesitations | pauses longer than 0.8 s in the middle of a sentence |

Bracketed cues (`[SMILE]`) are ignored, and "one hundred and twenty" in the script does match "120" in the transcript.

> [!IMPORTANT]
> Whisper **readily smooths out disfluencies**: "um"s, false starts, repeated words. The Turbo model does it more than Base. The filler word and repetition counts are therefore **minimums**. Skipped passages, coverage and hesitations do not depend on that behavior.

**Subtitles**: the transcript is split according to broadcast practice — two lines of 42 characters at most, 1 to 7 seconds on screen, 17 characters per second at most — cutting preferably at sentence ends, at commas and before conjunctions, never after an article or a preposition. The cuts are aligned on the actual silences. The editor lets you play the take, fix the text, adjust the times (↑/↓ for ±0.1 s), split at the cursor, merge, delete; subtitles that are too fast are flagged. **SRT export** (UTF-8 with BOM, CRLF line endings, for editing applications).

### AI writing

Two transformations, applied to the open script, each producing a **new script** placed just below it — the original is never modified:

- **Translate script** into English, French, Spanish, German, Italian, Portuguese or Dutch. The instruction asks for an adaptation for the ear, not a word-for-word translation.
- **Adapt for speaking**: short sentences that fit in one breath, lists turned into sentences, removal of what is not spoken aloud (parentheses, abbreviations, "cf."). A short pause is marked with "/", a long pause with a new paragraph, and the words to stress are set in **bold**. No piece of information, no figure, no name and no call to action is removed.

Three safeguards do not depend on the model:

| Element | Handling |
|---|---|
| URLs, e-mails, variables (`{{firstname}}`, `{x}`, `%s`, `$VAR`), bracketed cues (`[SMILE]`) | **Replaced by tokens before sending**, then restored identically. The provider never sees them. |
| Figures | Compared between the original and the result. Any paragraph where a figure has disappeared or changed is **flagged by its number**. |
| Speaker colors | A paragraph's color follows every paragraph it becomes. Partial bold is kept. |

The provider is chosen in the block: **Claude (Anthropic)** or **OpenAI**, with your own API key. The model list is read directly from the provider; by default, Claude Sonnet 5 and GPT-5.6 Terra. The key is encrypted in the system keychain (macOS Keychain, Windows Credential Manager, GNOME/KDE keyring), is never passed to the interface, and is only sent to the chosen provider. Long scripts are sent in batches of about 1,200 words, three at a time, with a progress bar and a cancel button.

> [!NOTE]
> On macOS, since the app is not signed by an identified developer, the Keychain may ask for your password after each update to let CariPrompt read its key again. Choose "Always Allow".

### Scripts, projects and presets

- **Script library**: as many scripts as you need, each with its own speed, target duration and colors.
- **Bundled scripts**: a **Welcome** script that presents every feature in the five interface languages, and a short **test script** per language to set the speed and try voice tracking. They are added once; older welcome scripts that were not modified are replaced, the ones you have edited are kept.
- **Multiple selection** as in the Finder: <kbd>⇧</kbd> + click for a range, <kbd>⌘</kbd> / <kbd>Ctrl</kbd> + click to add or remove a script. Right-click then acts on the whole selection.
- **Keyword search** in the titles, at the top of the list. Case- and accent-insensitive: "presi" finds "The President's Address".
- **Automatic saving** on every change and on close.
- **Import** by drag and drop anywhere in the window, through the drop zone in the left column, or with the dedicated button. Each file becomes a new script: nothing is overwritten.
- **Duplicate, export as .txt, delete** (right-click on a script), with a 6-second undo for the deletion.
- **`.cariprompt` projects**: one script and all its settings in a single file.
- **Presets**: the whole set of display settings saved under a name ("iPad CACE", "Studio 2"…) and recalled with one click. They also remember the order of the blocks in the panel.
- **Reorderable settings panel**: each block moves by dragging it by its header, so you can put the ones you use most at the top. The order returns to the default layout at the next launch; to keep it, save it in a preset.

### Interface

- **Five languages**: English (default), French, Spanish, German, Italian. Menus, dialogs, messages and the spell checker follow the chosen language.
- **System, Light or Dark appearance** (System by default).
- macOS styling, identical on Windows and Linux.
- **Shortcut reminder**, collapsible, at the bottom of the left column.
- **No sound**: the interface never beeps, not even on an unrecognized key.
- Version number shown next to the application name.
- **Tabbed settings panel**: **Essentials** (output, speed, target duration, controls, clicker), **Layout** (typography, colors, layout, timecode), **Transcript** (takes, transcription), **AI tools** and **Custom**. In each tab, blocks are reordered by drag and drop and fold away with the arrow on their title row; the "i" gives the block's explanation.
- **Custom tab**: the menu at the top of the tab adds any block to it, and that block also stays in its original tab. Its contents are kept across restarts, and presets save several arrangements.
- **On macOS**, the side columns let the system material show through (vibrancy), like the sidebars of Apple's applications, and the separating lines of the large areas give way to simple shifts in tone.
- **Updates**: at the bottom of the panel, "Check for updates" queries the latest version published on GitHub. The check at launch can be turned off; no data is sent and installation stays manual.

### Menus

| System | Location |
|---|---|
| macOS | Menu bar at the top of the screen: **CariPrompt**, **File**, **Edit**, **View** (Appearance, Language), **Prompter**, **Window** — plus the **☰** button in the window |
| Windows / Linux | **☰** button at the top left of the window |

On all three systems, the **☰** button gives access to **File**, **Prompter**, **Appearance**, **Language**, **About** and **Quit**.
In French, the menus are called *Fichier*, *Édition*, *Présentation* (*Apparence*, *Langue*), *Prompteur*, *Fenêtre*.
The language and appearance preferences are saved and restored at the next launch.

## Download

The files are available on the **[Releases](https://github.com/CaribouNathan/CariPrompt/releases/latest)** page.

| System | File | Note |
|---|---|---|
| macOS — Apple Silicon (M1 to M4) | `CariPrompt-2.2.2-macOS-AppleSilicon.dmg` | macOS 12 or newer, drag-and-drop installation |
| macOS — Apple Silicon (M1 to M4) | `CariPrompt-2.2.2-macOS-AppleSilicon.zip` | Same app, without the disk image |
| Windows 10 / 11 (64-bit) | `CariPrompt-2.2.2-Windows-Setup.exe` | Standard installer |
| Windows 10 / 11 (64-bit) | `CariPrompt-2.2.2-Windows-Portable.exe` | No installation, runs directly |
| Linux x86_64 | `CariPrompt-2.2.2-Linux-x86_64.AppImage` | All distributions |
| Debian, Ubuntu and derivatives | `CariPrompt-2.2.2-Linux-amd64.deb` | Installable package |

> Since 2.0.2, only **Apple Silicon** Macs (M1 and later) are provided: menu  › **About This Mac**, **Chip** line. On an Intel Mac, the app builds from source with `MAC_ARCHS=x64 npm run dist:mac`.

## Installation — unsigned app

> [!IMPORTANT]
> CariPrompt is a free personal project. It is **not signed** with an Apple Developer certificate or with a Windows code signing certificate: those certificates are paid and annual.
> Your system will therefore show a warning at first launch. That is normal. The source code can be read in full in this repository.

### macOS

1. Open the `.dmg` and drag **CariPrompt** onto the **Applications** shortcut (or unzip the `.zip` and drag **CariPrompt.app** into **Applications**).
2. Launch the app. macOS says that it cannot be verified: click **Done** (or **OK**).
3. Open **System Settings › Privacy & Security**. At the bottom of the page, next to the message about CariPrompt, click **Open Anyway**, then confirm.
4. Launch CariPrompt again: the warning will not come back.

**Another way, from the Terminal** (removes the quarantine attribute added by the browser):

```bash
xattr -cr /Applications/CariPrompt.app
```

> If macOS says the app "is damaged", it is the same protection: use the command above.

### Windows

1. Run `CariPrompt-2.2.2-Windows-Setup.exe` (or the portable version).
2. **Windows protected your PC** (SmartScreen) appears: click **More info**, then **Run anyway**.
3. The installer lets you choose the installation folder. A shortcut is created in the Start menu and on the desktop.

### Linux

**AppImage**:

```bash
chmod +x CariPrompt-2.2.2-Linux-x86_64.AppImage
./CariPrompt-2.2.2-Linux-x86_64.AppImage
```

Some recent distributions require the FUSE 2 library (`sudo apt install libfuse2t64` on Ubuntu 24.04).

**.deb package**:

```bash
sudo apt install ./CariPrompt-2.2.2-Linux-amd64.deb
```

## Getting started

1. **Load the script**: type it, paste it, or drop a file into the window.
2. **Color the speakers** (optional): select a line, click a color in the **Selection** bar.
3. **Set the speed**, or turn on **Target duration** and enter the duration you want.
4. **Choose the output screen** and the **mirror**, then click **Show output**. With no second screen, use **full screen**.
5. **Start** with <kbd>⌥</kbd><kbd>Space</kbd>. Adjust live with the wheel or the arrow keys.
6. **Save** your settings as a preset, or the script plus its settings as a `.cariprompt` project.

## Shortcuts

The prompter shortcuts are active as soon as the cursor is not in a text field. <kbd>Esc</kbd> leaves the text area, and a click on the preview does too.

| Key | Action |
|---|---|
| <kbd>⌥</kbd> <kbd>Space</kbd> (<kbd>Alt</kbd> <kbd>Space</kbd> on Windows and Linux) | Play / pause (cancels the countdown if it is running). Works while typing the text as well. |
| <kbd>↓</kbd> / <kbd>↑</kbd> | Faster / slower (±1) |
| <kbd>←</kbd> / <kbd>→</kbd> | Back / forward 10 seconds |
| <kbd>+</kbd> / <kbd>−</kbd> | Larger / smaller text, even during playback |
| Wheel or trackpad over the preview | Navigate in the script (<kbd>⌥</kbd>: set the speed) |
| Wheel or trackpad elsewhere | Faster / slower |
| <kbd>B</kbd> or <kbd>.</kbd> | Black screen |
| <kbd>Page Down</kbd> / <kbd>Page Up</kbd> | Clicker buttons (configurable actions) |
| <kbd>F5</kbd> | Play |
| <kbd>Home</kbd> | Back to start |
| <kbd>Esc</kbd> | Leave the text field, or full screen |

| macOS | Windows / Linux | Action |
|---|---|---|
| <kbd>⌘</kbd> <kbd>Z</kbd> | <kbd>Ctrl</kbd> <kbd>Z</kbd> | Undo |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>Z</kbd> | <kbd>Ctrl</kbd> <kbd>Y</kbd> | Redo |
| <kbd>⌘</kbd> <kbd>N</kbd> | <kbd>Ctrl</kbd> <kbd>N</kbd> | New script |
| <kbd>⌘</kbd> <kbd>O</kbd> | <kbd>Ctrl</kbd> <kbd>O</kbd> | Import files |
| <kbd>⌘</kbd> <kbd>S</kbd> | <kbd>Ctrl</kbd> <kbd>S</kbd> | Save project |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>O</kbd> | <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>O</kbd> | Open a project |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>F</kbd> | <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>F</kbd> or <kbd>F11</kbd> | Full screen |
| <kbd>⌘</kbd> <kbd>D</kbd> | <kbd>Ctrl</kbd> <kbd>D</kbd> | Duplicate the script |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>E</kbd> | <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>E</kbd> | Export as .txt |
| <kbd>⌘</kbd> <kbd>R</kbd> | <kbd>Ctrl</kbd> <kbd>R</kbd> | Back to start |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>D</kbd> | <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>D</kbd> | Show / hide the output |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>T</kbd> | <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>T</kbd> | Voice tracking (on / off) |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>R</kbd> | <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>R</kbd> | Audio recording (on / off) |

The wheel direction follows the macOS **natural scrolling** setting. It can be inverted in **Settings › Controls**, where you also choose what the wheel does over the preview: **navigate in the script** (default) or **change the speed**. The <kbd>⌥</kbd> key gives the other action.
In the editing column, the script list and the settings, the wheel scrolls normally.

## Presentation clicker

CariPrompt can be driven with the clickers made for PowerPoint (Logitech R400 / R500 / Spotlight, Kensington, Targus…), which behave like a keyboard:

| Button | Action |
|---|---|
| Next (Page Down) | Your choice, **play / pause** by default |
| Previous (Page Up) | Your choice, **back 10 s** by default |
| Start slideshow (F5) | Play |
| Black screen (B or .) | Black screen / back to the text |

Actions available for Next and Previous: play / pause, next paragraph, previous paragraph, forward or back 10 s, faster, slower, back to start, nothing.

## Importable formats

| Format | Extensions | Note |
|---|---|---|
| Plain text | `.txt` `.text` `.md` `.markdown` | UTF-8, UTF-16 or Windows-1252 detected automatically |
| Word | `.docx` | |
| Word 97-2003 | `.doc` | Main text only |
| RTF | `.rtf` | |
| OpenDocument | `.odt` | LibreOffice, OpenOffice |
| HTML | `.html` `.htm` | |
| PDF | `.pdf` | Layout line breaks are removed |
| CariPrompt project | `.cariprompt` | Script **and** settings |

Not supported: **Pages** files (export them to `.docx` or `.pdf` first) and **scanned PDFs** with no text layer. Import brings in the text, not the formatting of the original document.

## Projects and presets

|  | `.cariprompt` project | Preset |
|---|---|---|
| Contains the script and its colors | Yes | No |
| Contains the display settings | Yes | Yes |
| Contains the order of the panel blocks | Yes | Yes |
| Storage | A file, wherever you want it | Inside the app |
| Use | Archive or hand over a complete piece | Recall a hardware configuration |

- **Save a project**: <kbd>⌘</kbd><kbd>S</kbd> / <kbd>Ctrl</kbd><kbd>S</kbd>. **Open it**: <kbd>⌘</kbd><kbd>⇧</kbd><kbd>O</kbd>, drag and drop, or a double-click on the file. The script is added to the library and the settings are applied.
- **Save a preset**: **Save current settings…** button at the top of the settings, then a name ("iPad CACE"). A click on its chip recalls it, the cross deletes it.
- In both cases, the **language**, the **appearance** and the **output screen** are not restored: they stay specific to the computer in use.
- The project file is JSON, readable and editable.

## Where are my scripts stored?

The scripts (`scripts.json`) and the settings (`settings.json`, which also holds the presets) are saved locally:

| System | Folder |
|---|---|
| macOS | `~/Library/Application Support/CariPrompt/` |
| Windows | `%APPDATA%\CariPrompt\` |
| Linux | `~/.config/CariPrompt/` |

The takes are in the `takes/` subfolder: one audio file per take and an `index.json` index.
The AI writing API keys are in `ai-keys.json`, encrypted by the system keychain.
The transcription models are in the `stt/` subfolder; they can be removed from the Transcription block.
To back up or transfer your scripts, copy `scripts.json`.
If something goes wrong, internal errors are logged in `cariprompt.log`, in the same folder.

## Version history

The details are in the [CHANGELOG](CHANGELOG.md).

| Version | Technology | Platforms | Main changes |
|---|---|---|---|
| **2.2.2** | Electron | macOS Apple Silicon, Windows, Linux | macOS vibrancy on the columns, preview better set apart, README in five languages |
| 2.2.1 | Electron | macOS Apple Silicon, Windows, Linux | Cut-out icon, tabs on a single line in every language, translucent columns on macOS |
| 2.2.0 | Electron | macOS Apple Silicon, Windows, Linux | Tabbed settings panel, collapsible blocks, customizable tab, update check, .dmg image, lighter app |
| 2.1.0 | Electron | macOS Apple Silicon, Windows, Linux | Multilingual "Welcome" script and bundled test scripts; shortcuts for voice tracking and recording |
| 2.0.2 | Electron | macOS Apple Silicon, Windows, Linux | New icon; end of the Mac Intel build |
| 2.0.1 | Electron | macOS, Windows, Linux | "Voice tracking" and "Audio rec" buttons labeled and translated, with their state |
| 2.0.0 | Electron | macOS, Windows, Linux | Voice tracking: the prompter follows the voice, stops at pauses, catches up on skipped passages; text up to 500 pt |
| 1.9.1 | Electron | macOS, Windows, Linux | Clear message when the API account has no credit left; return of Windows, Linux and macOS Intel |
| 1.9.0 | Electron | macOS, Windows, Linux | Local transcription (Whisper), speech analysis compared with the script, subtitles and SRT export |
| 1.8.0 | Electron | macOS, Windows, Linux | AI writing: translation and adaptation for speaking, Claude or OpenAI, protected elements and checked figures |
| 1.7.3 | Electron | macOS, Windows, Linux | Take recording in WAV, attached to their script, rhythm coach, undo in the editor |
| 1.6.0 | Electron | macOS, Windows, Linux | Five interface languages, script search, performance validated on 20,000 words |
| 1.5.0 | Electron | macOS, Windows, Linux | Reorderable settings panel, text up to 400 pt, play/pause on ⌥ + Space |
| 1.4.2 | Electron | macOS, Windows, Linux | Wheel navigation, multiple selection, sync on click, macOS menu bar fix |
| 1.4.1 | Electron | macOS, Windows, Linux | Styling by selection (one color per speaker), presets, drop zone, new icon |
| 1.4.0 | Electron | macOS, Windows, Linux | Typography and colors, `.cariprompt` projects, presentation clicker, line spacing, speed 0–100, full screen, timecode |
| 1.3.1 | Electron | macOS, Windows, Linux | Hideable reading line, English and French welcome scripts, layout fixes |
| 1.3.0 | Electron | macOS, Windows, Linux | Interface in English or French, System / Light / Dark appearance, ☰ button |
| 1.2.0 | Electron | macOS, Windows, Linux | First cross-platform version, icon, ready-to-use binaries |
| 1.1.0 | SwiftUI | macOS | Document import, script library |
| 1.0.0 | SwiftUI | macOS | First version: mirrored output, target duration, countdown, shortcuts |

Versions 1.0 and 1.1 (native macOS) are superseded by the Electron version. On a Mac, the script library carries over automatically from one version to the next.

## Known limitations

- **Unsigned app**: warning at first launch (see [Installation](#installation--unsigned-app)).
- **Uniform speed down the page**: the speed is computed from the average number of words per line. A short line goes by at the same speed as a full one.
- **Fonts**: the list is read the first time the settings are shown (a few seconds on a Mac that holds a lot of fonts). A font missing from the computer that opens a project is replaced by the system font.
- **Remaining timecode**: an estimate based on the current speed, it changes if the speed changes.
- **Trackpad**: inertia cannot be told apart from a deliberate gesture, so the rate of speed changes is limited.
- **No automatic update**: new versions are to be downloaded from the Releases.
- **Linux**: only the x86_64 architecture is provided.
- **Voice tracking**: you have to read the script. An improvisation that strays from it puts tracking in the "lost" state (orange button): the text waits for the voice to find the script again. A sentence repeated elsewhere in the script can, rarely, pull tracking over; it re-syncs at the next sentence.
- **Transcription**: Whisper does not provide the timestamp of each word with these models, only that of each segment. Subtitle splitting inside a segment is therefore proportional, realigned on the silences detected. The filler word and repetition counts are minimums (see above).
- **AI writing**: the figure check compares strings of digits, not values. "10000" rewritten as "10 000" is flagged wrongly; conversely, a figure moved into another sentence of the same paragraph goes unnoticed. A closing parenthesis in a URL (`…/Page_(X)`) is taken for punctuation.

## Building from source

Requirements: [Node.js](https://nodejs.org) 22 or newer.

```bash
git clone https://github.com/CaribouNathan/CariPrompt.git
cd CariPrompt
npm install
npm start            # runs the app in development mode
```

Building the packages (written to `release/`):

| Command | Result | Run from |
|---|---|---|
| `npm run dist:mac` | Ad-hoc signed Apple Silicon `.zip` (`MAC_ARCHS=x64` for Intel) | macOS or Linux (with [rcodesign](https://github.com/indygreg/apple-platform-rs)) |
| `npm run dist:win` | NSIS installer and portable version | Windows, or Linux/macOS with Wine |
| `npm run dist:linux` | AppImage and `.deb` | Linux |

On a Mac, `build.command` chains the dependency installation and the package building.

### Architecture

```
src/
├── main/          Electron main process
│   ├── main.ts        operator and output windows, screens, storage, menus, projects
│   ├── preload.ts     API exposed to the interface
│   ├── importer.ts    reading txt, rtf, doc, docx, odt, html, pdf
│   ├── fonts.ts       list of installed fonts
│   ├── takes.ts       storage of the takes and their index
│   ├── ai.ts          API keys, Claude / OpenAI calls, protected tokens, figure check
│   ├── stt.ts         Whisper models: download, extraction, transcription queue, voice tracking
│   ├── liveStt.ts     continuous recognition: streaming VAD, Whisper on sliding windows
│   ├── sttEngine.ts   WAV, 16 kHz resampling, Silero VAD, windowed Whisper
│   └── sttExtract.ts  fallback .tar.bz2 extraction, in a thread
├── renderer/      React interface
│   ├── App.tsx            operator screen and full screen
│   ├── Output.tsx         output screen
│   ├── PrompterCanvas.tsx rendering, scrolling, timecode
│   ├── RichEditor.tsx     editor with styling by selection
│   ├── recorder.ts        microphone recording and signal analysis
│   ├── pcmTap.ts          PCM capture (AudioWorklet), wav.ts: WAV encoding
│   ├── aiText.ts          splitting into paragraphs, carrying styles over
│   ├── speechAnalysis.ts  word-by-word alignment, skipped passages, fillers, hesitations
│   ├── liveAlign.ts       live alignment (Smith-Waterman), pace, prediction
│   ├── subtitles.ts       splitting to broadcast norms, SRT
│   ├── store.ts           state, playback, library, projects, takes (zustand)
│   └── input.ts           keyboard, wheel, clicker
└── shared/        Shared code
    ├── types.ts      types and computations
    ├── marks.ts      partial styles of the text
    ├── i18n.ts       translations
    └── locales/      en, fr, es, de, it
```

Synchronization principle: the playback position is a progress value from 0 to 1, independent of the layout. The operator screen sends an anchor point (position and timestamp) to the output screen. Each window then computes its position on every frame. The two screens stay in sync with no continuous exchange.

Stack: Electron, React, TypeScript, Vite, zustand, mammoth, word-extractor, unpdf, JSZip, sherpa-onnx (Whisper, Silero VAD).

### Contributing

Bug reports and suggestions are welcome in the [Issues](https://github.com/CaribouNathan/CariPrompt/issues). State your system, your CariPrompt version and, if possible, the file concerned.

## Roadmap — from 1.6 to 2.0

| Step | Contents | Status |
|---|---|---|
| 1.6.0 | Five languages, script search, guaranteed offline, validated performance | shipped |
| 1.7.3 | Take recording and management, rhythm coach, undo in the editor | shipped |
| 1.8.0 | Script translation, written → spoken transformation (Claude or OpenAI) | shipped |
| **1.9.0** | Local transcription (Whisper), subtitles and SRT export, speech analysis after the take | shipped |
| **2.0.0** | Real-time voice tracking | shipped |

The transcription features will use a **local** engine, so that they stay usable on a shoot with no network. The AI text features (translation, adaptation for speaking) will need a connection and an API key supplied by the user; they will stay optional and have no effect on the prompter itself.

## License

CariPrompt is **free and open-source software**, distributed under the [MIT license](LICENSE).
You may use it, including for commercial shoots, modify it and redistribute it freely.

© 2026 Nathan Carrillat — Caribou Labs
