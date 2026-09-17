[README.md](https://github.com/user-attachments/files/32324628/README.md)
<p align="center">
  <img src="docs/icon.png" width="128" height="128" alt="Icône CariPrompt">
</p>

<h1 align="center">CariPrompt</h1>

<p align="center">
  Prompteur multi-écrans simple et moderne, pour macOS, Windows et Linux.<br>
  <strong>Gratuit et open source</strong> — un outil <a href="https://github.com/CaribouNathan">Caribou Labs</a>.
</p>

<p align="center">
  <a href="https://github.com/CaribouNathan/CariPrompt/releases/latest"><img src="https://img.shields.io/github/v/release/CaribouNathan/CariPrompt?label=version&color=007aff" alt="Dernière version"></a>
  <img src="https://img.shields.io/badge/plateformes-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey" alt="Plateformes">
  <a href="LICENSE"><img src="https://img.shields.io/badge/licence-MIT-green" alt="Licence MIT"></a>
  <img src="https://img.shields.io/badge/prix-gratuit-brightgreen" alt="Gratuit">
</p>

<p align="center">
  <img src="docs/screenshot.png" alt="Interface de CariPrompt" width="900">
</p>

---

## Sommaire

- [Présentation](#présentation)
- [Fonctionnalités](#fonctionnalités)
- [Télécharger](#télécharger)
- [Installation — application non signée](#installation--application-non-signée)
- [Raccourcis](#raccourcis)
- [Formats importables](#formats-importables)
- [Où sont stockés mes textes ?](#où-sont-stockés-mes-textes-)
- [Historique des versions](#historique-des-versions)
- [Limites connues](#limites-connues)
- [Compiler depuis les sources](#compiler-depuis-les-sources)
- [Licence](#licence)

## Présentation

CariPrompt transforme n'importe quel ordinateur en régie de prompteur :

- l'**écran opérateur** sert à écrire et corriger le texte, régler la vitesse et piloter la lecture ;
- l'**écran de sortie** (n'importe quel écran branché : moniteur de prompteur, TV, projecteur) affiche le texte en plein écran, retourné pour la glace semi-réfléchissante.

L'application est **gratuite, open source (licence MIT), sans compte, sans publicité et sans connexion Internet**. Aucune donnée ne quitte votre ordinateur.

## Fonctionnalités

### Lecture et vitesse

- **Vitesse en mots par minute** : de 40 à 400 mots/min, par paliers de 5.
- **Durée estimée** : calculée en direct à partir du nombre de mots et de la vitesse.
- **Durée cible** : indiquez la durée voulue pour la vidéo (minutes et secondes), la vitesse est calculée automatiquement. Un avertissement s'affiche si la durée demande une vitesse hors plage. Toute modification manuelle de la vitesse désactive la durée cible.
- **Décompte de 3 secondes** avant chaque lancement (désactivable). Espace pendant le décompte l'annule.
- **Navigation par pas de 10 secondes** en avant et en arrière, et barre de progression cliquable.
- **Changement de vitesse et de taille en pleine lecture**, sans saut du texte : la position est conservée.
- **Défilement fluide**, synchronisé sur le rafraîchissement de l'écran.
- **Mise en veille de l'écran bloquée** pendant la lecture.

### Affichage

- **Miroir** au choix : aucun, horizontal (glace de prompteur classique), vertical ou les deux (rotation à 180°).
- **Miroir dans l'aperçu** activable séparément, pour que l'opérateur lise le texte à l'endroit.
- **Aperçu fidèle** : l'aperçu est rendu à la résolution exacte de l'écran de sortie, les retours à la ligne sont donc identiques.
- **Taille du texte** de 24 à 220 pt, **alignement** gauche ou centré, **marges** latérales réglables.
- **Ligne de lecture** repérée par deux flèches et un bandeau, position verticale réglable, **affichable ou masquable** (sur l'aperçu et l'écran de sortie).
- **Dégradé** en haut et en bas de l'écran pour garder le regard sur la ligne active.

### Écrans

- Sortie sur **n'importe quel écran connecté**, en plein écran sans bordure.
- Détection automatique des écrans branchés ou débranchés en cours de session.
- Si la sortie est placée sur l'écran de la fenêtre opérateur (pour un test), elle ne passe pas au premier plan de force.
- Le clavier et la molette fonctionnent aussi quand la souris est sur l'écran de sortie.

### Textes

- **Bibliothèque de textes** : autant de textes que nécessaire, chacun avec sa propre vitesse et sa propre durée cible.
- **Enregistrement automatique** à chaque modification et à la fermeture.
- **Titre automatique** tiré de la première ligne, ou titre personnalisé.
- **Dupliquer, exporter en .txt, supprimer** (clic droit sur un texte). La suppression s'annule depuis le bandeau affiché pendant 6 secondes.
- **Glisser-déposer** de fichiers n'importe où dans la fenêtre, ou import par le bouton dédié. Chaque fichier devient un nouveau texte : rien n'est écrasé.
- **Correcteur orthographique** (français et anglais) dans l'éditeur.

### Interface

- **Anglais ou français**, au choix dans le menu **Présentation › Langue** (anglais par défaut). Menus, boîtes de dialogue et messages suivent la langue choisie.
- **Apparence Système, Claire ou Sombre** dans le menu **Présentation › Apparence** (Système par défaut : suit le réglage de l'ordinateur).
- Style macOS, identique sur Windows et Linux.
- **Aucun son** : l'interface n'émet aucun bip, même sur une touche non reconnue.
- Numéro de version affiché à côté du nom de l'application.

### Menus

| Système | Emplacement |
|---|---|
| macOS | Barre de menus en haut de l'écran : **CariPrompt**, **Fichier**, **Édition**, **Présentation** (Apparence, Langue), **Prompteur**, **Fenêtre** — et bouton **☰** dans la fenêtre |
| Windows / Linux | Bouton **☰** en haut à gauche de la fenêtre |

Le bouton **☰** donne accès, sur les trois systèmes, à **Fichier**, **Prompteur**, **Apparence**, **Langue**, **À propos** et **Quitter**.

Les noms ci-dessus sont ceux de l'interface française ; en anglais : *File*, *Edit*, *View* (*Appearance*, *Language*), *Prompter*, *Window*.
Les préférences de langue et d'apparence sont enregistrées et reprises au lancement suivant.

## Télécharger

Les fichiers sont disponibles dans la page **[Releases](https://github.com/CaribouNathan/CariPrompt/releases/latest)**.

| Système | Fichier | Remarque |
|---|---|---|
| macOS — Apple Silicon (M1 à M4) | `CariPrompt-1.3.1-macOS-AppleSilicon.zip` | macOS 12 ou plus récent |
| macOS — Intel | `CariPrompt-1.3.1-macOS-Intel.zip` | macOS 12 ou plus récent |
| Windows 10 / 11 (64 bits) | `CariPrompt-1.3.1-Windows-Setup.exe` | Installeur classique |
| Windows 10 / 11 (64 bits) | `CariPrompt-1.3.1-Windows-Portable.exe` | Sans installation, se lance directement |
| Linux x86_64 | `CariPrompt-1.3.1-Linux-x86_64.AppImage` | Toutes distributions |
| Debian, Ubuntu et dérivés | `CariPrompt-1.3.1-Linux-amd64.deb` | Paquet installable |

> Pour savoir si votre Mac est Apple Silicon ou Intel : menu  › **À propos de ce Mac**, ligne **Puce** (Apple M…) ou **Processeur** (Intel).

## Installation — application non signée

> [!IMPORTANT]
> CariPrompt est un projet personnel gratuit. Il **n'est pas signé** avec un certificat Apple Developer ni avec un certificat de signature de code Windows : ces certificats sont payants et annuels.
> Votre système affichera donc un avertissement au premier lancement. C'est normal. Le code source est entièrement consultable dans ce dépôt.

### macOS

1. Décompressez le `.zip`, puis glissez **CariPrompt.app** dans le dossier **Applications**.
2. Lancez l'application. macOS indique qu'elle ne peut pas être vérifiée : cliquez sur **Terminé** (ou **OK**).
3. Ouvrez **Réglages Système › Confidentialité et sécurité**. En bas de la page, à côté du message concernant CariPrompt, cliquez sur **Ouvrir quand même**, puis confirmez avec votre mot de passe.
4. Relancez CariPrompt : l'avertissement n'apparaîtra plus.

**Autre méthode, par le Terminal** (retire l'attribut de quarantaine ajouté par le navigateur) :

```bash
xattr -cr /Applications/CariPrompt.app
```

> Si macOS indique que l'application « est endommagée », c'est la même protection : utilisez la commande ci-dessus.

### Windows

1. Lancez `CariPrompt-1.3.1-Windows-Setup.exe` (ou la version portable).
2. **Windows a protégé votre ordinateur** (SmartScreen) s'affiche : cliquez sur **Informations complémentaires**, puis sur **Exécuter quand même**.
3. L'installeur permet de choisir le dossier d'installation. Un raccourci est créé dans le menu Démarrer et sur le bureau.

### Linux

**AppImage** :

```bash
chmod +x CariPrompt-1.3.1-Linux-x86_64.AppImage
./CariPrompt-1.3.1-Linux-x86_64.AppImage
```

Certaines distributions récentes demandent la bibliothèque FUSE 2 (`sudo apt install libfuse2t64` sur Ubuntu 24.04).

**Paquet .deb** :

```bash
sudo apt install ./CariPrompt-1.3.1-Linux-amd64.deb
```

## Raccourcis

Les raccourcis du prompteur sont actifs dès que le curseur n'est pas dans une zone de saisie. **Échap** quitte la zone de texte, un clic sur l'aperçu aussi.

| Touche | Action |
|---|---|
| <kbd>Espace</kbd> | Lecture / pause (annule le décompte s'il est en cours) |
| <kbd>↓</kbd> | Plus vite (+5 mots/min) |
| <kbd>↑</kbd> | Moins vite (−5 mots/min) |
| <kbd>←</kbd> / <kbd>→</kbd> | Reculer / avancer de 10 secondes |
| <kbd>+</kbd> / <kbd>−</kbd> | Agrandir / réduire le texte, même pendant la lecture |
| Molette ou trackpad vers le bas / le haut | Plus vite / moins vite |
| <kbd>Début</kbd> | Retour au début |
| <kbd>Échap</kbd> | Quitter la zone de saisie |

| macOS | Windows / Linux | Action |
|---|---|---|
| <kbd>⌘</kbd> <kbd>N</kbd> | <kbd>Ctrl</kbd> <kbd>N</kbd> | Nouveau texte |
| <kbd>⌘</kbd> <kbd>O</kbd> | <kbd>Ctrl</kbd> <kbd>O</kbd> | Importer des fichiers |
| <kbd>⌘</kbd> <kbd>D</kbd> | <kbd>Ctrl</kbd> <kbd>D</kbd> | Dupliquer le texte |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>E</kbd> | <kbd>Ctrl</kbd> <kbd>Maj</kbd> <kbd>E</kbd> | Exporter en .txt |
| <kbd>⌘</kbd> <kbd>R</kbd> | <kbd>Ctrl</kbd> <kbd>R</kbd> | Retour au début |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>D</kbd> | <kbd>Ctrl</kbd> <kbd>Maj</kbd> <kbd>D</kbd> | Afficher / masquer la sortie |

Le sens de la molette suit le réglage **défilement naturel** de macOS. Il peut être inversé dans **Réglages › Commandes**.

## Formats importables

| Format | Extensions | Remarque |
|---|---|---|
| Texte brut | `.txt` `.text` `.md` `.markdown` | UTF-8, UTF-16 ou Windows-1252 détectés automatiquement |
| Word | `.docx` | |
| Word 97-2003 | `.doc` | Texte principal uniquement |
| RTF | `.rtf` | |
| OpenDocument | `.odt` | LibreOffice, OpenOffice |
| HTML | `.html` `.htm` | |
| PDF | `.pdf` | Les retours à la ligne de mise en page sont supprimés |

Non pris en charge : les fichiers **Pages** (à exporter d'abord en `.docx` ou `.pdf`) et les **PDF scannés** sans couche texte.

## Où sont stockés mes textes ?

Les textes (`scripts.json`) et les réglages (`settings.json`) sont enregistrés localement :

| Système | Dossier |
|---|---|
| macOS | `~/Library/Application Support/CariPrompt/` |
| Windows | `%APPDATA%\CariPrompt\` |
| Linux | `~/.config/CariPrompt/` |

Pour sauvegarder ou transférer vos textes, copiez `scripts.json`.
En cas de problème, les erreurs internes sont consignées dans `cariprompt.log`, dans le même dossier.

## Historique des versions

Le détail est dans le [CHANGELOG](CHANGELOG.md).

| Version | Technologie | Plateformes | Nouveautés principales |
|---|---|---|---|
| **1.3.1** | Electron | macOS, Windows, Linux | Ligne de lecture masquable, textes de bienvenue anglais et français, corrections de mise en page et des menus |
| 1.3.0 | Electron | macOS, Windows, Linux | Interface en anglais ou en français, apparence Système / Claire / Sombre, bouton ☰ sous Windows et Linux |
| 1.2.0 | Electron | macOS, Windows, Linux | Version multiplateforme, icône, numéro de version dans l'interface, binaires prêts à l'emploi |
| 1.1.0 | SwiftUI | macOS | Suppression des bips système, glisser-déposer de documents, bibliothèque de textes |
| 1.0.0 | SwiftUI | macOS | Première version : sortie miroir, vitesse en mots/min, durée cible, décompte, raccourcis |

Les versions 1.0 et 1.1 (natives macOS) sont remplacées par la version Electron. Sur Mac, la bibliothèque de textes de la 1.1 est reprise automatiquement.

## Limites connues

- **Application non signée** : avertissement au premier lancement (voir [Installation](#installation--application-non-signée)).
- **Vitesse uniforme en hauteur** : la vitesse est calculée à partir du nombre moyen de mots par ligne. Une ligne courte passe à la même vitesse qu'une ligne pleine.
- **Trackpad** : l'inertie du trackpad ne peut pas être distinguée d'un geste volontaire. La cadence de changement de vitesse est donc limitée.
- **Pas de mise à jour automatique** : les nouvelles versions sont à télécharger dans les Releases.
- **Linux** : seule l'architecture x86_64 est fournie.

## Compiler depuis les sources

Prérequis : [Node.js](https://nodejs.org) 22 ou plus récent.

```bash
git clone https://github.com/CaribouNathan/CariPrompt.git
cd CariPrompt
npm install
npm start            # lance l'application en mode développement
```

Fabrication des paquets (déposés dans `release/`) :

| Commande | Résultat | À lancer depuis |
|---|---|---|
| `npm run dist:mac` | `.zip` Apple Silicon et Intel, signés en ad hoc | macOS ou Linux (avec [rcodesign](https://github.com/indygreg/apple-platform-rs)) |
| `npm run dist:win` | Installeur NSIS et version portable | Windows, ou Linux/macOS avec Wine |
| `npm run dist:linux` | AppImage et `.deb` | Linux |

### Architecture

```
src/
├── main/          Processus principal Electron
│   ├── main.ts        fenêtres opérateur et sortie, écrans, stockage, menus
│   ├── preload.ts     API exposée à l'interface
│   └── importer.ts    lecture txt, rtf, doc, docx, odt, html, pdf
├── shared/i18n.ts   traductions anglais / français
├── renderer/      Interface React
│   ├── App.tsx            écran opérateur
│   ├── Output.tsx         écran de sortie
│   ├── PrompterCanvas.tsx rendu et défilement du texte
│   ├── store.ts           état, lecture, bibliothèque (zustand)
│   └── input.ts           clavier et molette
└── shared/types.ts  types et calculs communs
```

Principe de synchronisation : la position de lecture est une progression de 0 à 1, indépendante de la mise en page. L'écran opérateur envoie un point d'ancrage (position et horodatage) à l'écran de sortie. Chaque fenêtre calcule ensuite sa position à chaque image. Les deux écrans restent synchronisés sans échange continu.

Stack : Electron, React, TypeScript, Vite, zustand, mammoth, word-extractor, unpdf, JSZip.

### Contribuer

Les signalements de bugs et suggestions sont les bienvenus dans les [Issues](https://github.com/CaribouNathan/CariPrompt/issues). Précisez votre système, la version de CariPrompt et, si possible, le fichier concerné.

## Licence

CariPrompt est un **logiciel libre et gratuit**, distribué sous [licence MIT](LICENSE).
Vous pouvez l'utiliser, y compris pour des tournages commerciaux, le modifier et le redistribuer librement.

© 2026 Nathan Carrillat — Caribou Labs
