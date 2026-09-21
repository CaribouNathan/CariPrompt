<p align="center">
  <img src="docs/icon.png" width="132" height="132" alt="Icône CariPrompt">
</p>

<h1 align="center">CariPrompt</h1>

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
  <strong>Français</strong> ·
  <a href="README.en.md">English</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.de.md">Deutsch</a> ·
  <a href="README.it.md">Italiano</a>
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

### Fonctionne hors ligne, par construction

Aucune télémétrie, aucune vérification de licence, aucune requête au lancement. Tout ce qui sert pendant un tournage — affichage, défilement, vitesse, miroir, commandes, enregistrement des prises, projets locaux — fonctionne sans connexion, y compris au premier lancement.

Deux exceptions, toutes deux déclenchées par un clic et jamais pendant la lecture :
- la **rédaction IA** (traduction, adaptation à l'oral) contacte le fournisseur choisi ;
- la **transcription** télécharge une fois son modèle Whisper ; ensuite, elle fonctionne entièrement hors ligne.

### Performance

Mesures sur un script de **20 000 mots** (2 h 22 de lecture), en rendu logiciel sans accélération graphique :

| Indicateur | Valeur |
|---|---|
| Temps par image pendant le défilement | 16,7 ms (médiane), 17,6 ms au pire |
| Images perdues | aucune |
| Nœuds affichés | 515 |
| Mémoire JavaScript | 10 Mo |

Le défilement tient 60 images par seconde sans à-coup. Il est appliqué directement au DOM par `requestAnimationFrame`, hors du cycle de rendu de l'interface : la taille du script n'influe pas sur la fluidité.

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
- **Taille** de 24 à 500 pt et **interligne** de 1 à 2,5.
- **Alignement** gauche ou centré, **marges** latérales réglables.
- **Correcteur orthographique** dans l'éditeur, aligné sur la langue de l'interface.
- **Annulation et rétablissement** : <kbd>⌘</kbd><kbd>Z</kbd> et <kbd>⌘</kbd><kbd>⇧</kbd><kbd>Z</kbd> sur Mac, <kbd>Ctrl</kbd><kbd>Z</kbd> et <kbd>Ctrl</kbd><kbd>Y</kbd> ailleurs. Les frappes rapprochées comptent pour une seule étape, les changements de couleur en forment une à part, et le curseur revient à l'endroit modifié.

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

### Prises

Le bouton **Enreg. audio**, sous les commandes de lecture, lance une **prise**, qui entraîne le prompteur : décompte, puis défilement ; l'arrêt met le prompteur en pause.

Les prises sont rattachées au texte pour lequel elles ont été enregistrées : le bloc n'affiche que celles du texte ouvert, et une case « Toutes les prises » donne accès à l'ensemble. Chaque prise est nommée automatiquement **PRISE 01**, **PRISE 02**… (la numérotation repart à 01 pour chaque texte) et conserve son heure, sa durée, le script utilisé, la position atteinte, la vitesse et son analyse. On peut la **renommer, verrouiller, annoter, marquer, lire, comparer, révéler dans le Finder, exporter et supprimer**. Une prise verrouillée ne peut être ni renommée ni supprimée. L'audio est enregistré en **WAV** (PCM 16 bits, mono, à la fréquence du micro) : non compressé, lisible par tous les logiciels de montage, et directement exploitable par la transcription prévue en 2.0.

### Coach de rythme

Pendant une prise, le son est analysé en continu, **sans transcription** : niveau, activité vocale, attaques syllabiques. CariPrompt en déduit un débit approché, le compare à la vitesse du prompteur et affiche une indication discrète — « Bon rythme », « Ralentissez légèrement », « Accélérez légèrement ». Elle n'apparaît qu'après 2,5 secondes de stabilité, n'interrompt jamais la lecture, et un interrupteur la désactive complètement.

Chaque prise garde son analyse : débit moyen, écart avec le prompteur, nombre de pauses, silence total, temps de parole, irrégularité.

> [!NOTE]
> Cette analyse en direct repose sur le signal audio seul : elle situe un rythme, elle ne lit pas les mots. L'analyse du discours, mot à mot, se fait après la prise, à partir de la transcription (voir ci-dessous).

### Suivi vocal

Le bouton **Suivi voix**, sous les commandes de lecture, fait **suivre votre voix** au prompteur : le texte avance quand vous parlez, **s'arrête quand vous marquez une pause**, et **rattrape un passage sauté** — avec l'indication « Passage sauté » à l'écran si le coach est actif. Si vous revenez en arrière pour reprendre une phrase, le texte y revient aussi. Tout se passe sur l'ordinateur, hors ligne.

Comment ça marche :
1. **Reconnaissance continue.** Whisper ne transcrit pas en flux : dès qu'il est libre et que de la parole nouvelle est arrivée, il est relancé sur les six dernières secondes de l'énoncé en cours. La détection d'activité vocale décide quand décoder — jamais sur du silence, où Whisper invente volontiers du texte.
2. **Alignement.** La fin de chaque transcription est recalée sur le texte par un alignement local mot à mot (Smith-Waterman), tolérant aux mots mal reconnus, dans une fenêtre autour de la position courante. Reculer coûte plus cher qu'avancer, et un grand saut exige une correspondance forte : le suivi ne s'emballe pas sur une phrase ressemblante.
3. **Régulation.** Dix fois par seconde, le débit de défilement devient votre rythme mesuré plus une correction de l'écart. Une **prédiction** compense la latence de Whisper : entre deux transcriptions, la position avance à votre rythme.

Le suivi utilise le **plus léger des modèles installés**, pour la latence la plus faible : téléchargez **Base** (198 Mo) même si vous transcrivez les prises avec Turbo. Le suivi vocal et la vitesse réglée ne se combinent pas : quand le suivi est actif, c'est votre voix qui donne le rythme ; quand il est coupé, la vitesse réglée reprend la main.

> [!NOTE]
> Mesures de développement, voix de synthèse et processeur à 2 cœurs : écart médian entre la voix et le texte de 1,8 mot avec le moteur seul, de 3 mots dans l'application complète, où Whisper ne dispose que d'un cœur et met 1,5 s par décodage. Sur un Mac récent, Whisper Base décode en une fraction de seconde : l'écart se réduit d'autant.

### Transcription, analyse du discours et sous-titres

Chaque prise peut être **transcrite sur l'ordinateur, sans connexion**, par Whisper. Le modèle se télécharge une fois depuis le bloc **Transcription** ; ensuite, chaque prise est transcrite automatiquement à la fin de l'enregistrement (désactivable), ou à la demande.

| Modèle | Téléchargement | Sur le disque | Remarque |
|---|---|---|---|
| **Turbo** (par défaut) | 538 Mo | 1,0 Go | Le plus précis, et plus rapide que Small |
| Small | 610 Mo | 375 Mo | Intermédiaire |
| Base | 198 Mo | 160 Mo | Le plus léger, sensiblement moins juste en français |

Mesures de développement, sur une voix de synthèse française en conditions propres et un processeur à 2 cœurs : Turbo n'a fait qu'une erreur de mot sur 150, et transcrit une minute de prise en 30 secondes environ. Une vraie voix, une vraie pièce et un Mac à 10 cœurs changeront ces chiffres — la précision vers le bas, la vitesse vers le haut.

**Analyse du discours**, comparée au texte du prompteur :

| Mesure | Ce qu'elle dit |
|---|---|
| Fidélité au texte | part des mots du passage lu effectivement prononcés |
| Passages sautés | extraits d'au moins trois mots non prononcés ; un clic y amène le prompteur |
| Mots ajoutés | mots prononcés absents du texte |
| Débit | mots par minute, entre la première et la dernière parole |
| Mots parasites, répétitions | « euh », « du coup », « nous allons, nous allons »… comptés seulement s'ils ne sont pas dans le texte |
| Hésitations | pauses de plus de 0,8 s au milieu d'une phrase |

Les indications entre crochets (`[SOURIRE]`) sont ignorées, et « cent vingt » dans le texte correspond bien à « 120 » dans la transcription.

> [!IMPORTANT]
> Whisper **gomme volontiers les disfluences** : « euh », faux départs, mots répétés. Le modèle Turbo le fait davantage que Base. Les décomptes de mots parasites et de répétitions sont donc des **minimums**. Les passages sautés, la fidélité et les hésitations, eux, ne dépendent pas de ce comportement.

**Sous-titres** : la transcription est découpée selon les usages de diffusion — deux lignes de 42 caractères au plus, 1 à 7 secondes à l'écran, 17 caractères par seconde au plus — en coupant de préférence aux fins de phrase, aux virgules et avant les conjonctions, jamais après un article ou une préposition. Les coupures sont calées sur les silences réels. L'éditeur permet de lire la prise, corriger le texte, ajuster les temps (↑/↓ pour ±0,1 s), couper au curseur, fusionner, supprimer ; les sous-titres trop rapides sont signalés. **Export en SRT** (UTF-8 avec BOM, fins de ligne CRLF, pour les logiciels de montage).

### Rédaction IA

Deux transformations, à partir du texte ouvert, qui produisent chacune un **nouveau texte** placé juste en dessous — l'original n'est jamais modifié :

- **Traduire le texte** en anglais, français, espagnol, allemand, italien, portugais ou néerlandais. La consigne demande une adaptation pour l'oreille, pas une traduction mot à mot.
- **Adapter pour l'oral** : phrases courtes qui tiennent sur une respiration, listes converties en phrases, suppression de ce qui ne se dit pas (parenthèses, abréviations, « cf. »). Une pause courte est marquée par « / », une pause longue par un nouveau paragraphe, et les mots à appuyer passent en **gras**. Aucune information, aucun chiffre, aucun nom ni aucun appel à l'action n'est retiré.

Trois garde-fous ne dépendent pas du modèle :

| Élément | Traitement |
|---|---|
| URL, e-mails, variables (`{{prenom}}`, `{x}`, `%s`, `$VAR`), indications entre crochets (`[SOURIRE]`) | **Remplacés par des jetons avant l'envoi**, puis restaurés à l'identique. Le fournisseur ne les voit pas. |
| Chiffres | Comparés entre l'original et le résultat. Tout paragraphe où un chiffre a disparu ou changé est **signalé par son numéro**. |
| Couleurs d'intervenant | La couleur d'un paragraphe suit tous les paragraphes qu'il devient. Le gras partiel est conservé. |

Le fournisseur se choisit dans le bloc : **Claude (Anthropic)** ou **OpenAI**, avec votre propre clé API. La liste des modèles est lue directement chez le fournisseur ; par défaut, Claude Sonnet 5 et GPT-5.6 Terra. La clé est chiffrée dans le trousseau du système (Trousseau macOS, Gestionnaire d'identification Windows, trousseau GNOME/KDE), n'est jamais transmise à l'interface, et n'est envoyée qu'au fournisseur choisi. Les longs textes partent en lots d'environ 1 200 mots, trois à la fois, avec une barre de progression et un bouton d'annulation.

> [!NOTE]
> Sur macOS, l'application n'étant pas signée par un développeur identifié, le Trousseau peut demander votre mot de passe après chaque mise à jour pour autoriser CariPrompt à relire sa clé. Choisissez « Toujours autoriser ».

### Textes, projets et préréglages

- **Bibliothèque de textes** : autant de textes que nécessaire, chacun avec sa vitesse, sa durée cible et ses couleurs.
- **Textes fournis** : un texte **Welcome** qui présente toutes les fonctions dans les cinq langues de l'interface, et un **script de test** court par langue pour régler la vitesse et essayer le suivi vocal. Ils sont ajoutés une seule fois ; les anciens textes de bienvenue non modifiés sont remplacés, ceux que vous avez retouchés sont conservés.
- **Sélection multiple** comme dans le Finder : <kbd>⇧</kbd> + clic pour une plage, <kbd>⌘</kbd> / <kbd>Ctrl</kbd> + clic pour ajouter ou retirer un texte. Le clic droit agit alors sur toute la sélection.
- **Recherche par mot-clé** dans les titres, en haut de la liste. Insensible à la casse et aux accents : « presi » trouve « Vœux du président ».
- **Enregistrement automatique** à chaque modification et à la fermeture.
- **Import** par glisser-déposer n'importe où dans la fenêtre, par la zone de dépôt de la colonne de gauche, ou par le bouton dédié. Chaque fichier devient un nouveau texte : rien n'est écrasé.
- **Dupliquer, exporter en .txt, supprimer** (clic droit sur un texte), avec annulation de la suppression pendant 6 secondes.
- **Projets `.cariprompt`** : un texte et tous ses réglages dans un fichier.
- **Préréglages** : l'ensemble des réglages d'affichage enregistré sous un nom (« iPad CACE », « Studio 2 »…) et rappelé en un clic. Ils mémorisent aussi l'ordre des blocs du panneau.
- **Panneau de réglages réorganisable** : chaque bloc se déplace en le glissant par son en-tête, pour mettre en haut ceux que vous utilisez le plus. L'ordre revient à la disposition par défaut au lancement suivant ; pour le conserver, enregistrez-le dans un préréglage.

### Interface

- **Cinq langues** : anglais (par défaut), français, espagnol, allemand, italien. Menus, boîtes de dialogue, messages et correcteur orthographique suivent la langue choisie.
- **Apparence Système, Claire ou Sombre** (Système par défaut).
- Style macOS, identique sur Windows et Linux.
- **Rappel des raccourcis** repliable en bas de la colonne de gauche.
- **Aucun son** : l'interface n'émet aucun bip, même sur une touche non reconnue.
- Numéro de version affiché à côté du nom de l'application.
- **Panneau de réglages en onglets** : **Essentiel** (sortie, vitesse, durée cible, commandes, télécommande), **Mise en page** (typographie, couleurs, mise en page, timecode), **Transcription** (prises, transcription), **Outils IA** et **Perso**. Dans chaque onglet, les blocs se réordonnent par glisser-déposer et se replient par la flèche de leur ligne de titre ; le « i » donne l'explication du bloc.
- **Onglet Perso** : le menu en haut de l'onglet y ajoute n'importe quel bloc, qui reste aussi dans son onglet d'origine. Son contenu est conservé au redémarrage, et les préréglages en enregistrent plusieurs dispositions.
- **Sur macOS**, les colonnes latérales laissent voir la matière du système (vibrance), comme les barres latérales des applications d'Apple, et les traits de séparation des grandes zones laissent place à de simples écarts de teinte.
- **Mises à jour** : en bas du panneau, « Vérifier les mises à jour » interroge la dernière version publiée sur GitHub. La vérification au lancement peut être désactivée ; aucune donnée n'est envoyée et l'installation reste manuelle.

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
| macOS — Apple Silicon (M1 à M4) | `CariPrompt-2.2.2-macOS-AppleSilicon.dmg` | macOS 12 ou plus récent, installation par glisser-déposer |
| macOS — Apple Silicon (M1 à M4) | `CariPrompt-2.2.2-macOS-AppleSilicon.zip` | Même application, sans image disque |
| Windows 10 / 11 (64 bits) | `CariPrompt-2.2.2-Windows-Setup.exe` | Installeur classique |
| Windows 10 / 11 (64 bits) | `CariPrompt-2.2.2-Windows-Portable.exe` | Sans installation, se lance directement |
| Linux x86_64 | `CariPrompt-2.2.2-Linux-x86_64.AppImage` | Toutes distributions |
| Debian, Ubuntu et dérivés | `CariPrompt-2.2.2-Linux-amd64.deb` | Paquet installable |

> Depuis la 2.0.2, seuls les Mac **Apple Silicon** (M1 et suivants) sont fournis : menu  › **À propos de ce Mac**, ligne **Puce**. Sur un Mac Intel, l'application se compile depuis les sources avec `MAC_ARCHS=x64 npm run dist:mac`.

## Installation — application non signée

> [!IMPORTANT]
> CariPrompt est un projet personnel gratuit. Il **n'est pas signé** avec un certificat Apple Developer ni avec un certificat de signature de code Windows : ces certificats sont payants et annuels.
> Votre système affichera donc un avertissement au premier lancement. C'est normal. Le code source est entièrement consultable dans ce dépôt.

### macOS

1. Ouvrez le `.dmg` et glissez **CariPrompt** sur le raccourci **Applications** (ou décompressez le `.zip` et glissez **CariPrompt.app** dans **Applications**).
2. Lancez l'application. macOS indique qu'elle ne peut pas être vérifiée : cliquez sur **Terminé** (ou **OK**).
3. Ouvrez **Réglages Système › Confidentialité et sécurité**. En bas de la page, à côté du message concernant CariPrompt, cliquez sur **Ouvrir quand même**, puis confirmez.
4. Relancez CariPrompt : l'avertissement n'apparaîtra plus.

**Autre méthode, par le Terminal** (retire l'attribut de quarantaine ajouté par le navigateur) :

```bash
xattr -cr /Applications/CariPrompt.app
```

> Si macOS indique que l'application « est endommagée », c'est la même protection : utilisez la commande ci-dessus.

### Windows

1. Lancez `CariPrompt-2.2.2-Windows-Setup.exe` (ou la version portable).
2. **Windows a protégé votre ordinateur** (SmartScreen) s'affiche : cliquez sur **Informations complémentaires**, puis sur **Exécuter quand même**.
3. L'installeur permet de choisir le dossier d'installation. Un raccourci est créé dans le menu Démarrer et sur le bureau.

### Linux

**AppImage** :

```bash
chmod +x CariPrompt-2.2.2-Linux-x86_64.AppImage
./CariPrompt-2.2.2-Linux-x86_64.AppImage
```

Certaines distributions récentes demandent la bibliothèque FUSE 2 (`sudo apt install libfuse2t64` sur Ubuntu 24.04).

**Paquet .deb** :

```bash
sudo apt install ./CariPrompt-2.2.2-Linux-amd64.deb
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
| <kbd>⌘</kbd> <kbd>Z</kbd> | <kbd>Ctrl</kbd> <kbd>Z</kbd> | Annuler |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>Z</kbd> | <kbd>Ctrl</kbd> <kbd>Y</kbd> | Rétablir |
| <kbd>⌘</kbd> <kbd>N</kbd> | <kbd>Ctrl</kbd> <kbd>N</kbd> | Nouveau texte |
| <kbd>⌘</kbd> <kbd>O</kbd> | <kbd>Ctrl</kbd> <kbd>O</kbd> | Importer des fichiers |
| <kbd>⌘</kbd> <kbd>S</kbd> | <kbd>Ctrl</kbd> <kbd>S</kbd> | Enregistrer le projet |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>O</kbd> | <kbd>Ctrl</kbd> <kbd>Maj</kbd> <kbd>O</kbd> | Ouvrir un projet |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>F</kbd> | <kbd>Ctrl</kbd> <kbd>Maj</kbd> <kbd>F</kbd> ou <kbd>F11</kbd> | Plein écran |
| <kbd>⌘</kbd> <kbd>D</kbd> | <kbd>Ctrl</kbd> <kbd>D</kbd> | Dupliquer le texte |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>E</kbd> | <kbd>Ctrl</kbd> <kbd>Maj</kbd> <kbd>E</kbd> | Exporter en .txt |
| <kbd>⌘</kbd> <kbd>R</kbd> | <kbd>Ctrl</kbd> <kbd>R</kbd> | Retour au début |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>D</kbd> | <kbd>Ctrl</kbd> <kbd>Maj</kbd> <kbd>D</kbd> | Afficher / masquer la sortie |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>T</kbd> | <kbd>Ctrl</kbd> <kbd>Maj</kbd> <kbd>T</kbd> | Suivi vocal (marche / arrêt) |
| <kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>R</kbd> | <kbd>Ctrl</kbd> <kbd>Maj</kbd> <kbd>R</kbd> | Enregistrement audio (marche / arrêt) |

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

Les prises sont dans le sous-dossier `takes/` : un fichier audio par prise et un index `index.json`.
Les clés API de la rédaction IA sont dans `ai-keys.json`, chiffrées par le trousseau du système.
Les modèles de transcription sont dans le sous-dossier `stt/` ; on peut les supprimer depuis le bloc Transcription.
Pour sauvegarder ou transférer vos textes, copiez `scripts.json`.
En cas de problème, les erreurs internes sont consignées dans `cariprompt.log`, dans le même dossier.

## Historique des versions

Le détail est dans le [CHANGELOG](CHANGELOG.md).

| Version | Technologie | Plateformes | Nouveautés principales |
|---|---|---|---|
| **2.2.2** | Electron | macOS Apple Silicon, Windows, Linux | Vibrance macOS sur les colonnes, aperçu mieux détaché, README en cinq langues |
| 2.2.1 | Electron | macOS Apple Silicon, Windows, Linux | Icône détourée, onglets sur une ligne dans toutes les langues, colonnes translucides sur macOS |
| 2.2.0 | Electron | macOS Apple Silicon, Windows, Linux | Panneau de réglages en onglets, blocs repliables, onglet personnalisable, vérification des mises à jour, image .dmg, application allégée |
| 2.1.0 | Electron | macOS Apple Silicon, Windows, Linux | Texte « Welcome » multilingue et scripts de test fournis ; raccourcis pour le suivi vocal et l'enregistrement |
| 2.0.2 | Electron | macOS Apple Silicon, Windows, Linux | Nouvelle icône ; fin de la version Mac Intel |
| 2.0.1 | Electron | macOS, Windows, Linux | Boutons « Suivi voix » et « Enreg. audio » libellés et traduits, avec leur état |
| 2.0.0 | Electron | macOS, Windows, Linux | Suivi vocal : le prompteur suit la voix, s'arrête aux pauses, rattrape les passages sautés ; texte jusqu'à 500 pt |
| 1.9.1 | Electron | macOS, Windows, Linux | Message clair quand le compte API n'a plus de crédit ; retour de Windows, Linux et macOS Intel |
| 1.9.0 | Electron | macOS, Windows, Linux | Transcription locale (Whisper), analyse du discours comparée au texte, sous-titres et export SRT |
| 1.8.0 | Electron | macOS, Windows, Linux | Rédaction IA : traduction et adaptation à l'oral, Claude ou OpenAI, éléments protégés et chiffres contrôlés |
| 1.7.3 | Electron | macOS, Windows, Linux | Enregistrement des prises en WAV, rattachées à leur texte, coach de rythme, annulation dans l'éditeur |
| 1.6.0 | Electron | macOS, Windows, Linux | Cinq langues d'interface, recherche de textes, performance validée sur 20 000 mots |
| 1.5.0 | Electron | macOS, Windows, Linux | Panneau de réglages réorganisable, texte jusqu'à 400 pt, lecture/pause sur ⌥ + Espace |
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
- **Suivi vocal** : il faut lire le texte. Une improvisation qui s'en écarte fait passer le suivi à l'état « perdu » (bouton orange) : le texte attend que la voix retrouve le script. Une phrase répétée ailleurs dans le texte peut, rarement, attirer le suivi ; il se recale à la phrase suivante.
- **Transcription** : Whisper ne fournit pas l'horodatage de chaque mot avec ces modèles, seulement celui de chaque segment. Le découpage des sous-titres à l'intérieur d'un segment est donc proportionnel, recalé sur les silences détectés. Les décomptes de mots parasites et de répétitions sont des minimums (voir plus haut).
- **Rédaction IA** : le contrôle des chiffres compare des suites de chiffres, pas des valeurs. « 10000 » réécrit « 10 000 » est signalé à tort ; à l'inverse, un chiffre déplacé dans une autre phrase du même paragraphe passe inaperçu. Une parenthèse finale d'URL (`…/Page_(X)`) est prise pour de la ponctuation.

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
| `npm run dist:mac` | `.zip` Apple Silicon signé en ad hoc (`MAC_ARCHS=x64` pour Intel) | macOS ou Linux (avec [rcodesign](https://github.com/indygreg/apple-platform-rs)) |
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
│   ├── fonts.ts       liste des polices installées
│   ├── takes.ts       stockage des prises et de leur index
│   ├── ai.ts          clés API, appels Claude / OpenAI, jetons protégés, contrôle des chiffres
│   ├── stt.ts         modèles Whisper : téléchargement, extraction, file de transcription, suivi vocal
│   ├── liveStt.ts     reconnaissance continue : VAD en flux, Whisper par fenêtres glissantes
│   ├── sttEngine.ts   WAV, rééchantillonnage 16 kHz, VAD Silero, Whisper par fenêtres
│   └── sttExtract.ts  extraction .tar.bz2 de secours, dans un thread
├── renderer/      Interface React
│   ├── App.tsx            écran opérateur et plein écran
│   ├── Output.tsx         écran de sortie
│   ├── PrompterCanvas.tsx rendu, défilement, timecode
│   ├── RichEditor.tsx     éditeur avec styles par sélection
│   ├── recorder.ts        enregistrement micro et analyse du signal
│   ├── pcmTap.ts          capture PCM (AudioWorklet), wav.ts : encodage WAV
│   ├── aiText.ts          découpe en paragraphes, report des styles
│   ├── speechAnalysis.ts  alignement mot à mot, passages sautés, parasites, hésitations
│   ├── liveAlign.ts       alignement en direct (Smith-Waterman), débit, prédiction
│   ├── subtitles.ts       découpage aux normes de diffusion, SRT
│   ├── store.ts           état, lecture, bibliothèque, projets, prises (zustand)
│   └── input.ts           clavier, molette, télécommande
└── shared/        Code commun
    ├── types.ts       types et calculs
    ├── marks.ts       styles partiels du texte
    ├── i18n.ts        traductions
    └── locales/       en, fr, es, de, it
```

Principe de synchronisation : la position de lecture est une progression de 0 à 1, indépendante de la mise en page. L'écran opérateur envoie un point d'ancrage (position et horodatage) à l'écran de sortie. Chaque fenêtre calcule ensuite sa position à chaque image. Les deux écrans restent synchronisés sans échange continu.

Stack : Electron, React, TypeScript, Vite, zustand, mammoth, word-extractor, unpdf, JSZip, sherpa-onnx (Whisper, VAD Silero).

### Contribuer

Les signalements de bugs et suggestions sont les bienvenus dans les [Issues](https://github.com/CaribouNathan/CariPrompt/issues). Précisez votre système, la version de CariPrompt et, si possible, le fichier concerné.

## Feuille de route — de la 1.6 à la 2.0

| Étape | Contenu | État |
|---|---|---|
| 1.6.0 | Cinq langues, recherche de textes, hors ligne garanti, performance validée | livré |
| 1.7.3 | Enregistrement et gestion des prises, coach de rythme, annulation dans l'éditeur | livré |
| 1.8.0 | Traduction de scripts, transformation écrit → oral (Claude ou OpenAI) | livré |
| **1.9.0** | Transcription locale (Whisper), sous-titres et export SRT, analyse du discours après la prise | livré |
| **2.0.0** | Suivi vocal en temps réel | livré |

Les fonctions de transcription utiliseront un moteur **local**, pour rester utilisables en tournage sans réseau. Les fonctions de texte par IA (traduction, adaptation orale) nécessiteront une connexion et une clé API fournie par l'utilisateur ; elles resteront facultatives et sans effet sur le prompteur lui-même.

## Licence

CariPrompt est un **logiciel libre et gratuit**, distribué sous [licence MIT](LICENSE).
Vous pouvez l'utiliser, y compris pour des tournages commerciaux, le modifier et le redistribuer librement.

© 2026 Nathan Carrillat — Caribou Labs
