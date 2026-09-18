# Changelog

Toutes les évolutions notables de CariPrompt sont listées ici.
Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et la numérotation suit le [versionnage sémantique](https://semver.org/lang/fr/).

## [1.5.0] — 2026-09-18

### Ajouté
- **Panneau de réglages réorganisable** : chaque bloc se déplace en le glissant par son en-tête. Un lien remet la disposition par défaut.
- L'**ordre des blocs** est enregistré dans les préréglages et dans les projets `.cariprompt`.

### Modifié
- La **taille du texte** monte désormais jusqu'à **400 pt** (au lieu de 220).
- **Lecture / pause** passe de Espace à **⌥ + Espace** (Alt + Espace sous Windows et Linux), pour éviter les déclenchements involontaires. Le raccourci fonctionne désormais aussi pendant la saisie du texte, et le rappel des raccourcis est à jour. Espace seul n'a plus d'effet, sans bip.

### Remarque
- L'ordre des blocs revient à la disposition par défaut à chaque lancement : c'est le comportement demandé. Pour le retrouver, appliquez un préréglage qui le contient.

## [1.4.2] — 2026-09-18

### Ajouté
- **Molette dans toute la fenêtre** : défilement normal dans la colonne d'édition et la liste des textes ; au-dessus de l'aperçu, la molette **navigue dans le texte**. La touche ⌥ donne l'autre action, et un réglage (Commandes › Molette sur l'aperçu) permet d'inverser les deux.
- **Sélection multiple** dans la liste des textes : ⇧ + clic pour une plage, ⌘ ou Ctrl + clic pour ajouter ou retirer. Duplication et suppression agissent sur toute la sélection, avec annulation.
- **Synchronisation au clic** : cliquer dans le texte de l'éditeur place l'aperçu au même endroit.

### Modifié
- Le **timecode** a son propre bloc dans les réglages, en dehors de la mise en page.
- Le bouton **Masquer la sortie** passe en rouge quand la sortie est affichée, ainsi que l'indicateur de la barre d'outils.

### Corrigé
- **macOS** : après l'affichage de la sortie, l'application disparaissait du Dock, de Cmd+Tab et de la barre de menus. L'option `skipTransformProcessType` évite le changement de type de processus, la fenêtre de sortie n'est plus créée comme panneau non activant, et la fenêtre opérateur reprend le premier plan.

## [1.4.1] — 2026-09-18

### Ajouté
- **Style par sélection** : couleur, gras et italique applicables à une partie du texte seulement (une couleur par intervenant, par exemple). Les styles suivent le texte quand il est modifié, et sont enregistrés dans les projets.
- **Préréglages** de réglages d'affichage, enregistrés sous un nom (« iPad CACE »…) et rappelables en un clic.
- **Zone de dépôt visible** dans la colonne de gauche, qui ouvre aussi la fenêtre d'import au clic.
- Nouvelle **icône** de l'application.

### Modifié
- Le rappel des raccourcis passe en bas de la colonne de gauche, repliable. La liste des textes défile au-dessus.
- L'interligne rejoint le bloc **Mise en page**.

### Corrigé
- Bouton « Masquer la sortie » dont le texte débordait du cadre.

## [1.4.0] — 2026-09-17

### Ajouté
- **Typographie** : choix de la police parmi les polices installées, graisse, italique, majuscules.
- **Couleurs** du texte, du fond et de la ligne de lecture.
- **Interligne** réglable (1 à 2,5).
- **Projets `.cariprompt`** : enregistrement et ouverture d'un texte avec tous ses réglages (⌘S / ⌘⇧O, glisser-déposer, double-clic).
- **Télécommande de présentation** (PowerPoint) : boutons Suivant et Précédent configurables, F5 pour lancer, B ou . pour l'écran noir.
- Navigation **par paragraphe** (via la télécommande).
- **Écran noir** (B ou .).
- **Plein écran** pour une utilisation solo, avec bouton de sortie et touche Échap ; miroir en plein écran réglable.
- **Timecode** optionnel sur l'écran du speaker : chrono réel de la prise, temps restant, ou les deux.

### Modifié
- La vitesse s'exprime désormais de **0 à 100** (au lieu des mots par minute). Les textes existants sont convertis automatiquement.
- Réglages réorganisés : Vitesse, Durée cible, Typographie, Couleurs, Mise en page, Sortie, Télécommande, Commandes.

## [1.3.1] — 2026-09-16

### Ajouté
- Interrupteur **Afficher la ligne de lecture** (réglages › Texte), appliqué à l'aperçu et à l'écran de sortie.
- **Textes de bienvenue** en anglais (chargé par défaut) et en français. Sur une installation existante, le texte anglais est ajouté une seule fois en tête de liste.
- Bouton **☰** également disponible sur macOS.
- Journal d'erreurs `cariprompt.log` dans le dossier de données.

### Corrigé
- Panneau de réglages à moitié masqué quand l'éditeur était élargi : l'éditeur rétrécit désormais pour laisser la place.
- Sélecteurs **Écran** et **Miroir** mal affichés sur macOS : remplacés par des menus natifs du système.
- Barre de menus macOS : installation sécurisée avec menu de secours, et réinstallation à l'ouverture de la fenêtre.

## [1.3.0] — 2026-09-16

### Ajouté
- Interface disponible en **anglais** et en **français**, au choix dans le menu (anglais par défaut). Menus, boîtes de dialogue, messages d'import et texte d'exemple sont traduits.
- Choix de l'**apparence** : Système (par défaut), Claire ou Sombre.
- **Bouton ☰** dans la barre de titre sous Windows et Linux, donnant accès aux menus Fichier, Prompteur, Apparence, Langue, À propos et Quitter.
- Menu **Présentation** sur macOS (Apparence, Langue).

### Modifié
- Le titre automatique d'un texte vide (« Untitled » / « Sans titre ») suit la langue choisie.
- Meilleur contraste du sélecteur d'alignement en mode sombre.

## [1.2.0] — 2026-09-16

### Ajouté
- Versions **Windows** (installeur et portable) et **Linux** (AppImage et .deb), en plus de macOS (Apple Silicon et Intel).
- Icône de l'application sur toutes les plateformes.
- Numéro de version affiché à côté du nom, en haut à gauche.
- Import des fichiers `.odt` et `.htm`/`.html` sur toutes les plateformes.
- Correcteur orthographique français et anglais dans l'éditeur.
- Clavier et molette actifs quand la souris est sur l'écran de sortie.
- Largeur de l'éditeur réglable par glissement.
- Binaires prêts à l'emploi publiés dans les Releases.

### Modifié
- Réécriture complète en **Electron + React + TypeScript** : un seul code pour les trois systèmes.
- Enregistrement de la bibliothèque garanti avant la fermeture de l'application.
- Le sens de la molette suit le réglage « défilement naturel » de macOS.

### Remarque
- Sur macOS, la bibliothèque de textes de la version 1.1 est reprise automatiquement.

## [1.1.0] — 2026-09-16 (macOS, SwiftUI)

### Ajouté
- Glisser-déposer et import de documents : txt, md, rtf, doc, docx, odt, html, pdf.
- Bibliothèque de textes avec enregistrement automatique, vitesse et durée cible propres à chaque texte.
- Dupliquer, renommer, exporter en .txt, supprimer avec annulation.

### Corrigé
- Suppression des bips système lors de l'appui sur une touche non gérée.

## [1.0.0] — 2026-09-16 (macOS, SwiftUI)

### Ajouté
- Écran opérateur avec éditeur et aperçu, sortie plein écran sur un écran externe.
- Miroir horizontal, vertical ou les deux.
- Vitesse en mots par minute, durée estimée, durée cible.
- Décompte de 3 secondes au lancement.
- Raccourcis : Espace, flèches, +/−, molette.

[1.5.0]: https://github.com/CaribouNathan/CariPrompt/releases/tag/v1.5.0
[1.4.2]: https://github.com/CaribouNathan/CariPrompt/releases/tag/v1.4.2
[1.4.1]: https://github.com/CaribouNathan/CariPrompt/releases/tag/v1.4.1
[1.4.0]: https://github.com/CaribouNathan/CariPrompt/releases/tag/v1.4.0
[1.3.1]: https://github.com/CaribouNathan/CariPrompt/releases/tag/v1.3.1
[1.3.0]: https://github.com/CaribouNathan/CariPrompt/releases/tag/v1.3.0
[1.2.0]: https://github.com/CaribouNathan/CariPrompt/releases/tag/v1.2.0
[1.1.0]: https://github.com/CaribouNathan/CariPrompt/releases/tag/v1.1.0
[1.0.0]: https://github.com/CaribouNathan/CariPrompt/releases/tag/v1.0.0
