<p align="center">
  <img src="docs/icon.png" width="132" height="132" alt="CariPrompt icon">
</p>

<h1 align="center">CariPrompt</h1>

<p align="center">
  <a href="README.md">Français</a> | English
</p>

<p align="center">
  A simple, modern multi-screen teleprompter for macOS, Windows, and Linux.<br>
  <strong>Free and open source</strong> — a <a href="https://github.com/CaribouNathan">Caribou Labs</a> tool.
</p>

<p align="center">
  <a href="https://github.com/CaribouNathan/CariPrompt/releases/latest"><img src="https://img.shields.io/github/v/release/CaribouNathan/CariPrompt?label=version&color=007aff" alt="Latest version"></a>
  <img src="https://img.shields.io/badge/platforms-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey" alt="Platforms">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/price-free-brightgreen" alt="Free">
</p>

<p align="center">
  <img src="docs/screenshot.png" alt="CariPrompt interface" width="900">
</p>

---

## Contents

- [Overview](#overview)
- [Features](#features)
- [Download](#download)
- [Installation — unsigned application](#installation--unsigned-application)
- [Getting started](#getting-started)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Presentation remote](#presentation-remote)
- [Supported import formats](#supported-import-formats)
- [Projects and presets](#projects-and-presets)
- [Where are my scripts stored?](#where-are-my-scripts-stored)
- [Version history](#version-history)
- [Known limitations](#known-limitations)
- [Build from source](#build-from-source)
- [License](#license)

## Overview

CariPrompt turns any computer into a teleprompter control station:

- the **operator screen** is used to write and edit the script, adjust speed, and control playback;
- the **output screen** (teleprompter monitor, TV, projector, or an iPad used as a display) shows the script full screen, mirrored for a beam-splitter glass;
- **full-screen mode** replaces both for solo use in front of the computer.

The app is **free, open source (MIT license), account-free, ad-free, and does not require an Internet connection**. No data leaves your computer.

## Features

### Playback and speed

- **Speed from 0 to 100**, in increments of 1 (0 = stopped text, 35 ≈ typical speaking pace). Internally, 1 point equals 4 words per minute.
- **Estimated duration** calculated live from the word count and speed.
- **Target duration**: enter the desired video duration and the speed is calculated automatically. A warning is displayed if the required speed is out of range. Any manual speed change disables the target duration.
- **3-second countdown** before each start (can be disabled). Space cancels it during the countdown.
- **Navigation** in 10-second steps, by paragraph, with the scroll wheel over the preview, or with the clickable progress bar.
- **Click in the editor**: the preview immediately moves to the clicked passage.
- **Change speed and text size while playing**, without the text jumping: the position is preserved.
- Optional **timecode** on the speaker screen: actual recording timer (pauses excluded and reset when returning to the beginning), estimated time remaining, or both.
- Instant **black screen** (<kbd>B</kbd> or <kbd>.</kbd>), as in PowerPoint.
- **Smooth scrolling** synchronized with the display refresh rate, with **sleep prevented** during playback.

### Text and typography

- **Selection styling**: select part of the text and assign it a color, bold, or italic styling. Designed to assign **one color per speaker** in a dialogue. Styles stay with the text when you edit it.
- Choose from all **fonts** installed on the computer.
- **Font weight** (thin to black), **italic**, **uppercase**.
- **Text, background, and reading-line colors**, with the ability to restore default colors.
- **Size** from 24 to 400 pt and **line spacing** from 1 to 2.5.
- Left or centered **alignment**, with adjustable side **margins**.
- **Spell checker** (French and English) in the editor.

### Display and screens

- Choose a **mirror** mode: none, horizontal (classic teleprompter glass), vertical, or both (180° rotation). Separate settings for the preview and full screen.
- **Accurate preview**: rendered at the exact resolution of the output screen, so line breaks are identical.
- **Reading line** marked by two arrows and a band; its position is adjustable and it can be shown or hidden.
- **Gradient** at the top and bottom of the screen to keep the viewer's eyes on the active line.
- Output to **any connected screen**, borderless and full-screen, with automatic connection and disconnection detection.
- **Full-screen mode** for solo use: toolbar button or <kbd>⌘</kbd><kbd>⇧</kbd><kbd>F</kbd> / <kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>F</kbd>; exit with <kbd>Esc</kbd>.
- The keyboard and scroll wheel also work while the mouse is over the output screen.

<p align="center">
  <img src="docs/screenshot-fullscreen.png" alt="Full-screen mode" width="720">
</p>

### Scripts, projects, and presets

- **Script library**: as many scripts as you need, each with its own speed, target duration, and colors.
- **Multiple selection** as in Finder: <kbd>⇧</kbd> + click for a range; <kbd>⌘</kbd> / <kbd>Ctrl</kbd> + click to add or remove a script. Right-click then applies to the entire selection.
- **Automatic saving** after every change and on closing.
- **Import** by dragging and dropping anywhere in the window, through the drop zone in the left column, or with the dedicated button. Each file becomes a new script; nothing is overwritten.
- **Duplicate, export as .txt, delete** (right-click a script), with 6 seconds to undo deletion.
- **`.cariprompt` projects**: a script and all its settings in one file.
- **Presets**: save all display settings under a name ("CACE iPad", "Studio 2"…) and restore them in one click. They also store the order of the panel blocks.
- **Reorderable settings panel**: drag each block by its header to put your most-used blocks at the top. The order returns to the default layout at the next launch; save it in a preset to keep it.

### Interface

- **English or French** (English by default): menus, dialogs, and messages follow the selected language.
- **System, Light, or Dark appearance** (System by default).
- macOS style, identical on Windows and Linux.
- Collapsible **keyboard-shortcut reference** at the bottom of the left column.
- **No sounds**: the interface never beeps, even for an unrecognized key.
- Version number shown next to the application name.

### Menus

| System | Location |
|---|---|
| macOS | Menu bar at the top of the screen: **CariPrompt**, **File**, **Edit**, **View** (Appearance, Language), **Prompter**, **Window** — plus a **☰** button in the window |
| Windows / Linux | **☰** button at the top left of the window |

The **☰** button provides access on all three systems to **File**, **Prompter**, **Appearance**, **Language**, **About**, and **Quit**.
In English, the menus are called *File*, *Edit*, *View* (*Appearance*, *Language*), *Prompter*, and *Window*.
Language and appearance preferences are saved and restored at the next launch.

## Download

Files are available on the **[Releases](https://github.com/CaribouNathan/CariPrompt/releases/latest)** page.

| System | File | Notes |
|---|---|---|
| macOS — Apple Silicon (M1 to M4) | `CariPrompt-1.5.0-macOS-AppleSilicon.zip` | macOS 12 or later |
| macOS — Intel | `CariPrompt-1.5.0-macOS-Intel.zip` | macOS 12 or later |
| Windows 10 / 11 (64-bit) | `CariPrompt-1.5.0-Windows-Setup.exe` | Standard installer |
| Windows 10 / 11 (64-bit) | `CariPrompt-1.5.0-Windows-Portable.exe` | No installation; runs directly |
| Linux x86_64 | `CariPrompt-1.5.0-Linux-x86_64.AppImage` | All distributions |
| Debian, Ubuntu, and derivatives | `CariPrompt-1.5.0-Linux-amd64.deb` | Installable package |

> To find out whether your Mac has Apple Silicon or Intel: Apple menu › **About This Mac**, then look for **Chip** (Apple M…) or **Processor** (Intel).

## Installation — unsigned application

> [!IMPORTANT]
> CariPrompt is a free personal project. It **is not signed** with an Apple Developer certificate or a Windows code-signing certificate; these certificates are paid annual subscriptions.
> Your system will therefore show a warning the first time you launch it. This is normal. The complete source code is available in this repository.

### macOS

1. Unzip the `.zip`, then drag **CariPrompt.app** into the **Applications** folder.
2. Launch the app. macOS says it cannot be verified: click **Done** (or **OK**).
3. Open **System Settings › Privacy & Security**. At the bottom of the page, next to the CariPrompt message, click **Open Anyway**, then confirm.
4. Launch CariPrompt again: the warning will no longer appear.

**Alternative Terminal method** (removes the quarantine attribute added by the browser):

```bash
xattr -cr /Applications/CariPrompt.app
```

> If macOS says the app "is damaged," it is the same protection: use the command above.

### Windows

1. Run `CariPrompt-1.5.0-Windows-Setup.exe` (or the portable version).
2. When **Windows protected your PC** (SmartScreen) appears, click **More info**, then **Run anyway**.
3. The installer lets you choose the installation folder. A shortcut is created in the Start menu and on the desktop.

### Linux

**AppImage**:

```bash
chmod +x CariPrompt-1.5.0-Linux-x86_64.AppImage
./CariPrompt-1.5.0-Linux-x86_64.AppImage
```

Some recent distributions require the FUSE 2 library (`sudo apt install libfuse2t64` on Ubuntu 24.04).

**.deb package**:

```bash
sudo apt install ./CariPrompt-1.5.0-Linux-amd64.deb
```

## Getting started

1. **Load a script**: type it, paste it, or drop a file into the window.
2. **Color speakers** (optional): select a line, then click a color in the **Selection** bar.
3. **Set the speed**, or enable **Target duration** and enter the desired duration.
4. **Choose the output screen** and **mirror** mode, then click **Show output**. Without a second screen, use **full-screen mode**.
5. **Start** with <kbd>⌥</kbd><kbd>Space</kbd>. Adjust live with the scroll wheel or arrow keys.
6. **Save** your settings as a preset, or save both the script and settings as a `.cariprompt` project.

## Keyboard shortcuts

Teleprompter shortcuts are active whenever the cursor is not in an input area. <kbd>Esc</kbd> exits the text area; clicking the preview does too.

| Key | Action |
|---|---|
| <kbd>⌥</kbd> <kbd>Space</kbd> (<kbd>Alt</kbd> <kbd>Space</kbd> on Windows and Linux) | Play / pause (cancels the countdown if it is running). Also works while typing text. |
| <kbd>↓</kbd> / <kbd>↑</kbd> | Faster / slower (±1) |
| <kbd>←</kbd> / <kbd>→</kbd> | Back / forward 10 seconds |
| <kbd>+</kbd> / <kbd>−</kbd> | Increase / decrease text size, even while playing |
| Scroll wheel or trackpad over the preview | Navigate through the text (<kbd>⌥</kbd>: adjust speed) |
| Scroll wheel or trackpad elsewhere | Faster / slower |
| <kbd>B</kbd> or <kbd>.</kbd> | Black screen |
| <kbd>Page Down</kbd> / <kbd>Page Up</kbd> | Remote-control buttons (configurable actions) |
| <kbd>F5</kbd> | Play |
| <kbd>Home</kbd> | Return to start |
| <kbd>Esc</kbd> | Exit the input area or full-screen mode |

| macOS | Windows / Linux | Action |
|---|---|---|
| <kbd>⌘</kbd> <kbd>N</kbd> | <kbd>Ctrl</kbd> <kbd>N</kbd> | New script |
| <kbd>⌘</kbd> <kbd>O</kbd> | <kbd>Ctrl</kbd> <kbd>O</kbd> | Import files |
| <kbd>⌘</kbd> <kbd>S</kbd> | <kbd>Ctrl</kbd> <kbd>S</kbd> | Save project |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>O</kbd> | <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>O</kbd> | Open project |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>F</kbd> | <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>F</kbd> or <kbd>F11</kbd> | Full screen |
| <kbd>⌘</kbd> <kbd>D</kbd> | <kbd>Ctrl</kbd> <kbd>D</kbd> | Duplicate script |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>E</kbd> | <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>E</kbd> | Export as .txt |
| <kbd>⌘</kbd> <kbd>R</kbd> | <kbd>Ctrl</kbd> <kbd>R</kbd> | Return to start |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>D</kbd> | <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>D</kbd> | Show / hide output |

Scroll direction follows macOS's **natural scrolling** setting. It can be reversed in **Settings › Controls**, where you can also choose the scroll-wheel action over the preview: **navigate through the text** (default) or **adjust speed**. The <kbd>⌥</kbd> key invokes the other action.
In the editing column, script list, and settings, the scroll wheel scrolls normally.

## Presentation remote

CariPrompt can be controlled with remotes designed for PowerPoint (Logitech R400 / R500 / Spotlight, Kensington, Targus…) that behave like a keyboard:

| Button | Action |
|---|---|
| Next (Page Down) | Choice of action; default: **play / pause** |
| Previous (Page Up) | Choice of action; default: **back 10 s** |
| Start slideshow (F5) | Play |
| Black screen (B or .) | Black screen / return to text |

Available actions for Next and Previous: play / pause, next paragraph, previous paragraph, forward or back 10 s, faster, slower, return to start, or none.

## Supported import formats

| Format | Extensions | Notes |
|---|---|---|
| Plain text | `.txt` `.text` `.md` `.markdown` | UTF-8, UTF-16, or Windows-1252 detected automatically |
| Word | `.docx` | |
| Word 97–2003 | `.doc` | Main text only |
| RTF | `.rtf` | |
| OpenDocument | `.odt` | LibreOffice, OpenOffice |
| HTML | `.html` `.htm` | |
| PDF | `.pdf` | Layout line breaks are removed |
| CariPrompt project | `.cariprompt` | Script **and** settings |

Not supported: **Pages** files (export them first as `.docx` or `.pdf`) and scanned **PDFs** with no text layer. Import retrieves the text, not the source document's formatting.

## Projects and presets

|  | `.cariprompt` project | Preset |
|---|---|---|
| Contains the script and its colors | Yes | No |
| Contains display settings | Yes | Yes |
| Contains the order of settings-panel blocks | Yes | Yes |
| Storage | File, wherever you choose | In the app |
| Use | Archive or send a complete script | Restore a hardware configuration |

- **Save a project**: <kbd>⌘</kbd><kbd>S</kbd> / <kbd>Ctrl</kbd><kbd>S</kbd>. **Open it**: <kbd>⌘</kbd><kbd>⇧</kbd><kbd>O</kbd>, drag and drop, or double-click the file. The script is added to the library and the settings are applied.
- **Save a preset**: click **Save current settings…** at the top of the settings panel, then give it a name ("CACE iPad"). Click its pill to restore it; click the cross to delete it.
- In both cases, **language**, **appearance**, and the **output screen** are not restored: they remain specific to the computer in use.
- The project file is in a readable, editable JSON format.

## Where are my scripts stored?

Scripts (`scripts.json`) and settings (`settings.json`, which also contains presets) are stored locally:

| System | Folder |
|---|---|
| macOS | `~/Library/Application Support/CariPrompt/` |
| Windows | `%APPDATA%\CariPrompt\` |
| Linux | `~/.config/CariPrompt/` |

To back up or transfer your scripts, copy `scripts.json`.
If a problem occurs, internal errors are logged in `cariprompt.log`, in the same folder.

## Version history

See [CHANGELOG](CHANGELOG.md) for details.

| Version | Technology | Platforms | Main additions |
|---|---|---|---|
| **1.5.0** | Electron | macOS, Windows, Linux | Reorderable settings panel, text up to 400 pt, play/pause with ⌥ + Space |
| 1.4.2 | Electron | macOS, Windows, Linux | Scroll-wheel navigation, multiple selection, click synchronization, macOS menu-bar fix |
| 1.4.1 | Electron | macOS, Windows, Linux | Selection styling (one color per speaker), presets, drop zone, new icon |
| 1.4.0 | Electron | macOS, Windows, Linux | Typography and colors, `.cariprompt` projects, presentation remote, line spacing, speed 0–100, full screen, timecode |
| 1.3.1 | Electron | macOS, Windows, Linux | Hideable reading line, English and French welcome scripts, layout fixes |
| 1.3.0 | Electron | macOS, Windows, Linux | English or French interface, System / Light / Dark appearance, ☰ button |
| 1.2.0 | Electron | macOS, Windows, Linux | First cross-platform version, icon, ready-to-use binaries |
| 1.1.0 | SwiftUI | macOS | Document import, script library |
| 1.0.0 | SwiftUI | macOS | First version: mirrored output, target duration, countdown, keyboard shortcuts |

Versions 1.0 and 1.1 (native macOS) are superseded by the Electron version. On Mac, the script library is automatically carried over from one version to the next.

## Known limitations

- **Unsigned application**: warning at first launch (see [Installation](#installation--unsigned-application)).
- **Uniform speed by height**: speed is calculated from the average number of words per line. A short line moves at the same speed as a full line.
- **Fonts**: the list is read the first time the settings are displayed (a few seconds on a Mac with many fonts). A font unavailable on the computer opening a project is replaced with the system font.
- **Remaining timecode**: an estimate based on the current speed; it changes if the speed changes.
- **Trackpad**: inertia cannot be distinguished from an intentional gesture, so the rate of speed change is limited.
- **No automatic updates**: download new versions from Releases.
- **Linux**: only the x86_64 architecture is provided.

## Build from source

Prerequisite: [Node.js](https://nodejs.org) 22 or later.

```bash
git clone https://github.com/CaribouNathan/CariPrompt.git
cd CariPrompt
npm install
npm start            # starts the application in development mode
```

Build packages (placed in `release/`):

| Command | Result | Run from |
|---|---|---|
| `npm run dist:mac` | Apple Silicon and Intel `.zip` files, ad hoc signed | macOS or Linux (with [rcodesign](https://github.com/indygreg/apple-platform-rs)) |
| `npm run dist:win` | NSIS installer and portable version | Windows, or Linux/macOS with Wine |
| `npm run dist:linux` | AppImage and `.deb` | Linux |

On Mac, `build.command` installs dependencies and builds the packages in one go.

### Architecture

```
src/
├── main/          Electron main process
│   ├── main.ts        operator and output windows, displays, storage, menus, projects
│   ├── preload.ts     API exposed to the interface
│   ├── importer.ts    reads txt, rtf, doc, docx, odt, html, pdf
│   └── fonts.ts       list of installed fonts
├── renderer/      React interface
│   ├── App.tsx            operator screen and full screen
│   ├── Output.tsx         output screen
│   ├── PrompterCanvas.tsx rendering, scrolling, timecode
│   ├── RichEditor.tsx     editor with selection styling
│   ├── store.ts           state, playback, library, projects (zustand)
│   └── input.ts           keyboard, scroll wheel, remote
└── shared/        Shared code
    ├── types.ts       types and calculations
    ├── marks.ts       partial text styles
    └── i18n.ts        English / French translations
```

Synchronization principle: the playback position is progress from 0 to 1, independent of layout. The operator screen sends an anchor point (position and timestamp) to the output screen. Each window then calculates its position on every frame. Both screens remain synchronized without continuous communication.

Stack: Electron, React, TypeScript, Vite, zustand, mammoth, word-extractor, unpdf, JSZip.

### Contributing

Bug reports and suggestions are welcome in [Issues](https://github.com/CaribouNathan/CariPrompt/issues). Please include your system, CariPrompt version, and, if possible, the relevant file.

## License

CariPrompt is **free and open-source software**, distributed under the [MIT License](LICENSE).
You may use it, including for commercial shoots, modify it, and redistribute it freely.

© 2026 Nathan Carrillat — Caribou Labs
