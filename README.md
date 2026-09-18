<p align="center">
  <img src="docs/icon.png" width="132" height="132" alt="Icône CariPrompt">
</p>

<h1 align="center">CariPrompt</h1>

<p align="center">
  Français | <a href="README.en.md">English</a>
</p>

<p align="center">
  Prompteur multi-écrans complet et moderne, pour macOS, Windows et Linux.<br>
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
- [Prise en main](#prise-en-main)
- [Raccourcis](#raccourcis)
- [Télécommande de présentation](#télécommande-de-présentation)
- [Formats importables](#formats-importables)
- [Projets et préréglages](#projets-et-préréglages)
- [Où sont stockés mes textes ?](#où-sont-stockés-mes-textes-)
- [Historique des versions](#historique-des-versions)
- [Limites connues](#limites-connues)
- [Compiler depuis les sources](#compiler-depuis-les-sources)
- [Licence](#licence)

## Présentation

CariPrompt transforme n'importe quel ordinateur en régie de prompteur :

- l'**écran opérateur** sert à écrire et corriger le texte, régler la vitesse et piloter la lecture ;
- l'**écran de sortie** (moniteur de prompteur, TV, projecteur, iPad utilisé comme écran) affiche le texte en plein écran, retourné pour la glace semi-réfléchissante ;
- le **plein écran** remplace les deux pour une utilisation solo, face à l'ordinateur.

L'application est **gratuite, open source (licence MIT), sans compte, sans publicité et sans connexion Internet**. Aucune donnée ne quitte votre ordinateur.

## Fonctionnalités

### Lecture et vitesse

- **Vitesse de 0 à 100**, par paliers de 1 (0 = texte arrêté, 35 ≈ débit parlé courant). En interne, 1 point correspond à 4 mots par minute.
- **Durée estimée** calculée en direct à partir du nombre de mots et de la vitesse.
- **Durée cible** : indiquez la durée voulue pour la vidéo, la vitesse est calculée automatiquement. Un avertissement s'affiche si la durée demande une vitesse hors plage. Toute modification manuelle de la vitesse désactive la durée cible.
- **Décompte de 3 secondes** avant chaque lancement (désactivable). Espace pendant le décompte l'annule.
- **Navigation** par pas de 10 secondes, par paragraphe, à la molette au-dessus de l'aperçu, et barre de progression cliquable.
- **Clic dans l'éditeur** : l'aperçu se cale immédiatement sur le passage cliqué.
- **Changement de vitesse et de taille en pleine lecture**, sans saut du texte : la position est conservée.
- **Timecode** optionnel sur l'écran du speaker : chronomètre réel de la prise (pauses exclues, remis à zéro au retour au début), temps restant estimé, ou les deux.
- **Écran noir** instantané (touche <kbd>B</kbd> ou <kbd>.</kbd>), comme dans PowerPoint.
- **Défilement fluide** synchronisé sur le rafraîchissement de l'écran, **mise en veille bloquée** pendant la lecture.

### Texte et typographie

- **Style par sélection** : sélectionnez une partie du texte et donnez-lui une couleur, du gras ou de l'italique. Prévu pour attribuer **une couleur par intervenant** dans un dialogue. Les styles suivent le texte quand vous l'éditez.
- **Police** au choix parmi toutes les polices installées sur l'ordinateur.
- **Graisse** (maigre à noir), **italique**, **majuscules**.
- **Couleurs** du texte, du fond et de la ligne de lecture, avec retour aux couleurs par défaut.
- **Taille** de 24 à 400 pt et **interligne** de 1 à 2,5.
- **Alignement** gauche ou centré, **marges** latérales réglables.
- **Correcteur orthographique** (français et anglais) dans l'éditeur.

### Affichage et écrans

- **Miroir** au choix : aucun, horizontal (glace de prompteur classique), vertical ou les deux (rotation à 180°). Réglages séparés pour l'aperçu et le plein écran.
- **Aperçu fidèle** : l'aperçu est rendu à la résolution exacte de l'écran de sortie, les retours à la ligne sont donc identiques.
- **Ligne de lecture** repérée par deux flèches et un bandeau, position réglable, affichable ou masquable.
- **Dégradé** en haut et en bas de l'écran pour garder le regard sur la ligne active.
- Sortie sur **n'importe quel écran connecté**, en plein écran sans bordure, avec détection automatique des branchements et débranchements.
- **Plein écran** pour l'utilisation solo : bouton dans la barre d'outils ou <kbd>⌘</kbd><kbd>⇧</kbd><kbd>F</kbd> / <kbd>Ctrl</kbd><kbd>Maj</kbd><kbd>F</kbd>, sortie par <kbd>Échap</kbd>.
- Le clavier et la molette fonctionnent aussi quand la souris est sur l'écran de sortie.

<p align="center">
  <img src="docs/screenshot-fullscreen.png" alt="Mode plein écran" width="720">
</p>

### Textes, projets et préréglages

- **Bibliothèque de textes** : autant de textes que nécessaire, chacun avec sa vitesse, sa durée cible et ses couleurs.
- **Sélection multiple** comme dans le Finder : <kbd>⇧</kbd> + clic pour une plage, <kbd>⌘</kbd> / <kbd>Ctrl</kbd> + clic pour ajouter ou retirer un texte. Le clic droit agit alors sur toute la sélection.
- **Enregistrement automatique** à chaque modification et à la fermeture.
- **Import** par glisser-déposer n'importe où dans la fenêtre, par la zone de dépôt de la colonne de gauche, ou par le bouton dédié. Chaque fichier devient un nouveau texte : rien n'est écrasé.
- **Dupliquer, exporter en .txt, supprimer** (clic droit sur un texte), avec annulation de la suppression pendant 6 secondes.
- **Projets `.cariprompt`** : un texte et tous ses réglages dans un fichier.
- **Préréglages** : l'ensemble des réglages d'affichage enregistré sous un nom (« iPad CACE », « Studio 2 »…) et rappelé en un clic. Ils mémorisent aussi l'ordre des blocs du panneau.
- **Panneau de réglages réorganisable** : chaque bloc se déplace en le glissant par son en-tête, pour mettre en haut ceux que vous utilisez le plus. L'ordre revient à la disposition par défaut au lancement suivant ; pour le conserver, enregistrez-le dans un préréglage.

### Interface

- **Anglais ou français** (anglais par défaut) : menus, boîtes de dialogue et messages suivent la langue choisie.
- **Apparence Système, Claire ou Sombre** (Système par défaut).
- Style macOS, identique sur Windows et Linux.
- **Rappel des raccourcis** repliable en bas de la colonne de gauche.
- **Aucun son** : l'interface n'émet aucun bip, même sur une touche non reconnue.
- Numéro de version affiché à côté du nom de l'application.

### Menus

| Système | Emplacement |
|---|---|
| macOS | Barre de menus en haut de l'écran : **CariPrompt**, **Fichier**, **Édition**, **Présentation** (Apparence, Langue), **Prompteur**, **Fenêtre** — et bouton **☰** dans la fenêtre |
| Windows / Linux | Bouton **☰** en haut à gauche de la fenêtre |

Le bouton **☰** donne accès, sur les trois systèmes, à **Fichier**, **Prompteur**, **Apparence**, **Langue**, **À propos** et **Quitter**.
En anglais, les menus s'appellent *File*, *Edit*, *View* (*Appearance*, *Language*), *Prompter*, *Window*.
Les préférences de langue et d'apparence sont enregistrées et reprises au lancement suivant.

## Télécharger

Les fichiers sont disponibles dans la page **[Releases](https://github.com/CaribouNathan/CariPrompt/releases/latest)**.

| Système | Fichier | Remarque |
|---|---|---|
| macOS — Apple Silicon (M1 à M4) | `CariPrompt-1.5.0-macOS-AppleSilicon.zip` | macOS 12 ou plus récent |
| macOS — Intel | `CariPrompt-1.5.0-macOS-Intel.zip` | macOS 12 ou plus récent |
| Windows 10 / 11 (64 bits) | `CariPrompt-1.5.0-Windows-Setup.exe` | Installeur classique |
| Windows 10 / 11 (64 bits) | `CariPrompt-1.5.0-Windows-Portable.exe` | Sans installation, se lance directement |
| Linux x86_64 | `CariPrompt-1.5.0-Linux-x86_64.AppImage` | Toutes distributions |
| Debian, Ubuntu et dérivés | `CariPrompt-1.5.0-Linux-amd64.deb` | Paquet installable |

> Pour savoir si votre Mac est Apple Silicon ou Intel : menu  › **À propos de ce Mac**, ligne **Puce** (Apple M…) ou **Processeur** (Intel).

## Installation — application non signée

> [!IMPORTANT]
> CariPrompt est un projet personnel gratuit. Il **n'est pas signé** avec un certificat Apple Developer ni avec un certificat de signature de code Windows : ces certificats sont payants et annuels.
> Votre système affichera donc un avertissement au premier lancement. C'est normal. Le code source est entièrement consultable dans ce dépôt.

### macOS

1. Décompressez le `.zip`, puis glissez **CariPrompt.app** dans le dossier **Applications**.
2. Lancez l'application. macOS indique qu'elle ne peut pas être vérifiée : cliquez sur **Terminé** (ou **OK**).
3. Ouvrez **Réglages Système › Confidentialité et sécurité**. En bas de la page, à côté du message concernant CariPrompt, cliquez sur **Ouvrir quand même**, puis confirmez.
4. Relancez CariPrompt : l'avertissement n'apparaîtra plus.

**Autre méthode, par le Terminal** (retire l'attribut de quarantaine ajouté par le navigateur) :

```bash
xattr -cr /Applications/CariPrompt.app
```

> Si macOS indique que l'application « est endommagée », c'est la même protection : utilisez la commande ci-dessus.

### Windows

1. Lancez `CariPrompt-1.5.0-Windows-Setup.exe` (ou la version portable).
2. **Windows a protégé votre ordinateur** (SmartScreen) s'affiche : cliquez sur **Informations complémentaires**, puis sur **Exécuter quand même**.
3. L'installeur permet de choisir le dossier d'installation. Un raccourci est créé dans le menu Démarrer et sur le bureau.

### Linux

**AppImage** :

```bash
chmod +x CariPrompt-1.5.0-Linux-x86_64.AppImage
./CariPrompt-1.5.0-Linux-x86_64.AppImage
```

Certaines distributions récentes demandent la bibliothèque FUSE 2 (`sudo apt install libfuse2t64` sur Ubuntu 24.04).

**Paquet .deb** :

```bash
sudo apt install ./CariPrompt-1.5.0-Linux-amd64.deb
```

## Prise en main

1. **Chargez le texte** : tapez-le, collez-le, ou déposez un fichier dans la fenêtre.
2. **Colorez les intervenants** (facultatif) : sélectionnez une réplique, cliquez sur une couleur dans la barre **Sélection**.
3. **Réglez la vitesse**, ou activez **Durée cible** et indiquez la durée voulue.
4. **Choisissez l'écran de sortie** et le **miroir**, puis cliquez sur **Afficher la sortie**. Sans second écran, utilisez le **plein écran**.
5. **Lancez** avec <kbd>⌥</kbd><kbd>Espace</kbd>. Ajustez en direct à la molette ou aux flèches.
6. **Enregistrez** vos réglages en préréglage, ou l'ensemble texte + réglages en projet `.cariprompt`.

## Raccourcis

Les raccourcis du prompteur sont actifs dès que le curseur n'est pas dans une zone de saisie. <kbd>Échap</kbd> quitte la zone de texte, un clic sur l'aperçu aussi.

| Touche | Action |
|---|---|
| <kbd>⌥</kbd> <kbd>Espace</kbd> (<kbd>Alt</kbd> <kbd>Espace</kbd> sous Windows et Linux) | Lecture / pause (annule le décompte s'il est en cours). Fonctionne aussi pendant la saisie du texte. |
| <kbd>↓</kbd> / <kbd>↑</kbd> | Plus vite / moins vite (±1) |
| <kbd>←</kbd> / <kbd>→</kbd> | Reculer / avancer de 10 secondes |
| <kbd>+</kbd> / <kbd>−</kbd> | Agrandir / réduire le texte, même pendant la lecture |
| Molette ou trackpad sur l'aperçu | Naviguer dans le texte (<kbd>⌥</kbd> : régler la vitesse) |
| Molette ou trackpad ailleurs | Plus vite / moins vite |
| <kbd>B</kbd> ou <kbd>.</kbd> | Écran noir |
| <kbd>Page suivante</kbd> / <kbd>Page précédente</kbd> | Boutons de la télécommande (actions réglables) |
| <kbd>F5</kbd> | Lecture |
| <kbd>Début</kbd> | Retour au début |
| <kbd>Échap</kbd> | Quitter la zone de saisie, ou le plein écran |

| macOS | Windows / Linux | Action |
|---|---|---|
| <kbd>⌘</kbd> <kbd>N</kbd> | <kbd>Ctrl</kbd> <kbd>N</kbd> | Nouveau texte |
| <kbd>⌘</kbd> <kbd>O</kbd> | <kbd>Ctrl</kbd> <kbd>O</kbd> | Importer des fichiers |
| <kbd>⌘</kbd> <kbd>S</kbd> | <kbd>Ctrl</kbd> <kbd>S</kbd> | Enregistrer le projet |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>O</kbd> | <kbd>Ctrl</kbd> <kbd>Maj</kbd> <kbd>O</kbd> | Ouvrir un projet |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>F</kbd> | <kbd>Ctrl</kbd> <kbd>Maj</kbd> <kbd>F</kbd> ou <kbd>F11</kbd> | Plein écran |
| <kbd>⌘</kbd> <kbd>D</kbd> | <kbd>Ctrl</kbd> <kbd>D</kbd> | Dupliquer le texte |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>E</kbd> | <kbd>Ctrl</kbd> <kbd>Maj</kbd> <kbd>E</kbd> | Exporter en .txt |
| <kbd>⌘</kbd> <kbd>R</kbd> | <kbd>Ctrl</kbd> <kbd>R</kbd> | Retour au début |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>D</kbd> | <kbd>Ctrl</kbd> <kbd>Maj</kbd> <kbd>D</kbd> | Afficher / masquer la sortie |

Le sens de la molette suit le réglage **défilement naturel** de macOS. Il peut être inversé dans **Réglages › Commandes**, où l'on choisit aussi l'action de la molette sur l'aperçu : **naviguer dans le texte** (par défaut) ou **régler la vitesse**. La touche <kbd>⌥</kbd> donne l'autre action.
Dans la colonne d'édition, la liste des textes et les réglages, la molette fait défiler normalement.

## Télécommande de présentation

CariPrompt se pilote avec les télécommandes prévues pour PowerPoint (Logitech R400 / R500 / Spotlight, Kensington, Targus…), qui se comportent comme un clavier :

| Bouton | Action |
|---|---|
| Suivant (Page suivante) | Au choix, par défaut **lecture / pause** |
| Précédent (Page précédente) | Au choix, par défaut **reculer de 10 s** |
| Lancer le diaporama (F5) | Lecture |
| Écran noir (B ou .) | Écran noir / retour au texte |

Actions disponibles pour Suivant et Précédent : lecture / pause, paragraphe suivant, paragraphe précédent, avancer ou reculer de 10 s, plus vite, moins vite, retour au début, rien.

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
| Projet CariPrompt | `.cariprompt` | Texte **et** réglages |

Non pris en charge : les fichiers **Pages** (à exporter d'abord en `.docx` ou `.pdf`) et les **PDF scannés** sans couche texte. L'import récupère le texte, pas la mise en forme du document d'origine.

## Projets et préréglages

|  | Projet `.cariprompt` | Préréglage |
|---|---|---|
| Contient le texte et ses couleurs | Oui | Non |
| Contient les réglages d'affichage | Oui | Oui |
| Contient l'ordre des blocs du panneau | Oui | Oui |
| Stockage | Fichier, à l'endroit de votre choix | Dans l'application |
| Usage | Archiver ou transmettre un sujet complet | Rappeler une configuration de matériel |

- **Enregistrer un projet** : <kbd>⌘</kbd><kbd>S</kbd> / <kbd>Ctrl</kbd><kbd>S</kbd>. **L'ouvrir** : <kbd>⌘</kbd><kbd>⇧</kbd><kbd>O</kbd>, glisser-déposer, ou double-clic sur le fichier. Le texte est ajouté à la bibliothèque et les réglages sont appliqués.
- **Enregistrer un préréglage** : bouton **Enregistrer les réglages actuels…** en haut des réglages, puis un nom (« iPad CACE »). Un clic sur sa pastille le rappelle, la croix le supprime.
- Dans les deux cas, la **langue**, l'**apparence** et l'**écran de sortie** ne sont pas repris : ils restent propres à l'ordinateur utilisé.
- Le fichier projet est au format JSON, lisible et modifiable.

## Où sont stockés mes textes ?

Les textes (`scripts.json`) et les réglages (`settings.json`, qui contient aussi les préréglages) sont enregistrés localement :

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
| **1.5.0** | Electron | macOS, Windows, Linux | Panneau de réglages réorganisable, texte jusqu'à 400 pt, lecture/pause sur ⌥ + Espace |
| 1.4.2 | Electron | macOS, Windows, Linux | Navigation à la molette, sélection multiple, synchro au clic, correctif macOS de la barre de menus |
| 1.4.1 | Electron | macOS, Windows, Linux | Style par sélection (couleur par intervenant), préréglages, zone de dépôt, nouvelle icône |
| 1.4.0 | Electron | macOS, Windows, Linux | Typographie et couleurs, projets `.cariprompt`, télécommande de présentation, interligne, vitesse 0–100, plein écran, timecode |
| 1.3.1 | Electron | macOS, Windows, Linux | Ligne de lecture masquable, textes de bienvenue anglais et français, corrections de mise en page |
| 1.3.0 | Electron | macOS, Windows, Linux | Interface en anglais ou en français, apparence Système / Claire / Sombre, bouton ☰ |
| 1.2.0 | Electron | macOS, Windows, Linux | Première version multiplateforme, icône, binaires prêts à l'emploi |
| 1.1.0 | SwiftUI | macOS | Import de documents, bibliothèque de textes |
| 1.0.0 | SwiftUI | macOS | Première version : sortie miroir, durée cible, décompte, raccourcis |

Les versions 1.0 et 1.1 (natives macOS) sont remplacées par la version Electron. Sur Mac, la bibliothèque de textes est reprise automatiquement d'une version à l'autre.

## Limites connues

- **Application non signée** : avertissement au premier lancement (voir [Installation](#installation--application-non-signée)).
- **Vitesse uniforme en hauteur** : la vitesse est calculée à partir du nombre moyen de mots par ligne. Une ligne courte passe à la même vitesse qu'une ligne pleine.
- **Polices** : la liste est lue au premier affichage des réglages (quelques secondes sur un Mac qui contient beaucoup de polices). Une police absente de l'ordinateur qui ouvre un projet est remplacée par la police système.
- **Timecode restant** : estimation basée sur la vitesse actuelle, il change si la vitesse change.
- **Trackpad** : l'inertie ne peut pas être distinguée d'un geste volontaire, la cadence de changement de vitesse est donc limitée.
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

Sur Mac, `build.command` enchaîne l'installation des dépendances et la fabrication des paquets.

### Architecture

```
src/
├── main/          Processus principal Electron
│   ├── main.ts        fenêtres opérateur et sortie, écrans, stockage, menus, projets
│   ├── preload.ts     API exposée à l'interface
│   ├── importer.ts    lecture txt, rtf, doc, docx, odt, html, pdf
│   └── fonts.ts       liste des polices installées
├── renderer/      Interface React
│   ├── App.tsx            écran opérateur et plein écran
│   ├── Output.tsx         écran de sortie
│   ├── PrompterCanvas.tsx rendu, défilement, timecode
│   ├── RichEditor.tsx     éditeur avec styles par sélection
│   ├── store.ts           état, lecture, bibliothèque, projets (zustand)
│   └── input.ts           clavier, molette, télécommande
└── shared/        Code commun
    ├── types.ts       types et calculs
    ├── marks.ts       styles partiels du texte
    └── i18n.ts        traductions anglais / français
```

Principe de synchronisation : la position de lecture est une progression de 0 à 1, indépendante de la mise en page. L'écran opérateur envoie un point d'ancrage (position et horodatage) à l'écran de sortie. Chaque fenêtre calcule ensuite sa position à chaque image. Les deux écrans restent synchronisés sans échange continu.

Stack : Electron, React, TypeScript, Vite, zustand, mammoth, word-extractor, unpdf, JSZip.

### Contribuer

Les signalements de bugs et suggestions sont les bienvenus dans les [Issues](https://github.com/CaribouNathan/CariPrompt/issues). Précisez votre système, la version de CariPrompt et, si possible, le fichier concerné.

## Licence

CariPrompt est un **logiciel libre et gratuit**, distribué sous [licence MIT](LICENSE).
Vous pouvez l'utiliser, y compris pour des tournages commerciaux, le modifier et le redistribuer librement.

© 2026 Nathan Carrillat — Caribou Labs
