# Changelog

Toutes les évolutions notables de CariPrompt sont listées ici.
Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et la numérotation suit le [versionnage sémantique](https://semver.org/lang/fr/).

## [2.2.2] — 2026-09-21

### Modifié
- **Vibrance macOS** : les colonnes de gauche et de droite laissent voir la matière du système, comme les barres latérales des applications d'Apple. La fenêtre n'a plus de fond opaque sous ces colonnes ; le texte et l'aperçu restent sur des surfaces pleines.
- **Aperçu mieux détaché de la colonne d'édition** : la zone de l'aperçu a désormais sa propre teinte, nettement plus sombre en thème sombre et plus grise en thème clair.
- **README en cinq langues** : anglais, français, espagnol, allemand et italien, avec un sélecteur en tête de page.

## [2.2.1] — 2026-09-21

### Modifié
- **Nouvelle icône**, détourée : plus de fond blanc autour de la forme, contours nets à toutes les tailles (Dock, barre des tâches, lanceurs Linux, barre de titre).
- **Onglets du panneau sur une seule ligne** dans les cinq langues : le panneau gagne quelques pixels et les libellés les plus longs sont raccourcis. Le français et l'italien passaient sur deux lignes.
- **Matière translucide sur macOS** : les colonnes de gauche et de droite prennent une teinte vitrée, et les traits de séparation entre les grandes zones disparaissent — ce sont les teintes qui les distinguent. Windows et Linux gardent l'aspect actuel.

## [2.2.0] — 2026-09-21

Version de simplification : le panneau de réglages passe en onglets, l'application s'allège.

### Ajouté
- **Panneau de réglages en onglets** : **Essentiel** (sortie, vitesse, durée cible, commandes, télécommande), **Mise en page** (typographie, couleurs, mise en page, timecode), **Transcription** (prises, transcription), **Outils IA** (rédaction IA) et **Perso**. Plus besoin de faire défiler une longue colonne. Les noms sont traduits dans les cinq langues.
- **Onglet Perso** : un menu déroulant ajoute n'importe quel bloc, qui reste aussi dans son onglet d'origine. Son contenu est conservé d'un lancement à l'autre, et les **préréglages** — qui remplacent le bloc « Préréglages » — en enregistrent plusieurs dispositions.
- **Blocs repliables** : une flèche au bout de la ligne de titre replie un bloc ; l'état est conservé. La flèche de la liste des raccourcis a été agrandie.
- **Bulles d'aide** : les explications en bas de bloc sont remplacées par un « i » cliquable dans la ligne de titre.
- **Barre de titre** : bouton **Décompte**, et les icônes de sortie et de plein écran deviennent les boutons libellés **Afficher la sortie** et **Plein écran**, qui restent aussi dans le bloc Sortie. Le réglage du décompte quitte le bloc Commandes.
- **Drapeaux** à côté des titres des scripts de test fournis, selon leur langue.
- **Flèches de vitesse cliquables** de part et d'autre du curseur, pour un point de plus ou de moins.
- **Vérification des mises à jour** : bouton en bas du panneau de réglages, et vérification silencieuse au lancement (débrayable) de la dernière version publiée sur GitHub. Aucune donnée n'est envoyée ; l'installation reste manuelle.
- **Image disque .dmg** pour macOS, en plus du .zip.

### Modifié
- **Application allégée** : les dépendances d'import de documents sont désormais empaquetées et minifiées au lieu d'être copiées avec leurs propres dépendances, seuls les fichiers utiles sont embarqués, et seules les cinq langues de l'interface sont conservées dans Electron. AppImage : 139 → 132 Mo ; paquet Debian : 109 → 105 Mo ; installeur Windows : 117 → 110 Mo.
- La disposition des blocs est conservée au redémarrage (elle repartait par défaut à chaque lancement).

## [2.1.0] — 2026-09-20

### Ajouté
- **Texte « Welcome »** : un seul texte fourni, qui présente toutes les fonctions de l'application dans les cinq langues de l'interface, l'une après l'autre.
- **Script de test** dans chaque langue : cinq textes courts, prêts à lire, pour régler la vitesse, essayer le suivi vocal et l'enregistrement.
- **Raccourcis** <kbd>⌘</kbd><kbd>⇧</kbd><kbd>T</kbd> et <kbd>⌘</kbd><kbd>⇧</kbd><kbd>R</kbd> (<kbd>Ctrl</kbd><kbd>Maj</kbd> sous Windows et Linux) pour le **suivi vocal** et l'**enregistrement audio**. Ils sont rappelés sur les deux boutons, dans la liste des raccourcis en bas à gauche, et dans le menu **Prompteur**.
- L'**écusson de la Haute-Savoie**, affiché quand la vitesse est réglée sur 74, ouvre la page Wikipédia du département dans le navigateur.

### Modifié
- Les anciens textes de bienvenue (anglais et français) sont remplacés par les nouveaux textes fournis, **sauf s'ils ont été modifiés** : dans ce cas ils restent dans la bibliothèque.

## [2.0.2] — 2026-09-20

### Modifié
- **Nouvelle icône** : un prompteur sur son boîtier, pour toutes les plateformes (Dock, barre des tâches, lanceurs Linux, barre de titre).
- **La version Mac Intel n'est plus fournie.** Seuls les Mac Apple Silicon ont un paquet prêt à l'emploi ; un Mac Intel peut toujours compiler l'application depuis les sources (`MAC_ARCHS=x64 npm run dist:mac`).
- Captures d'écran du README refaites sur l'interface de la 2.0.

## [2.0.1] — 2026-09-20

### Modifié
- **Boutons de mode explicites.** Le suivi vocal et l'enregistrement quittent les icônes rondes de la ligne de lecture pour deux vrais boutons libellés, sur une ligne à part : « Suivi voix » et « Enreg. audio » (Voice tracking / Audio rec, Seguir voz / Grabar audio, Stimmverfolgung / Audioaufnahme, Segui voce / Registra audio).
- Chaque bouton affiche son état en clair : « à l'écoute », « suit », « perdu » pour le suivi ; « Arrêter » avec la durée et un vumètre pendant l'enregistrement. Couleurs : bleu pour le suivi, orange s'il est perdu, rouge pendant l'enregistrement.
- Dans une colonne étroite, les deux boutons s'empilent au lieu de tronquer leur libellé.

## [2.0.0] — 2026-09-20

La 2.0 : le prompteur suit la voix.

### Ajouté
- **Suivi vocal**, hors ligne. Le texte avance au rythme de la parole, s'arrête aux pauses, rattrape un passage sauté et revient en arrière si le lecteur reprend une phrase. Bouton en forme d'onde dans la barre de transport, avec son état : chargement, écoute, suivi, perdu.
  - Reconnaissance continue : Whisper relancé sur les six dernières secondes de l'énoncé dès qu'il est libre, déclenché par la détection d'activité vocale (jamais sur du silence).
  - Alignement local mot à mot (Smith-Waterman), tolérant aux mots mal reconnus ; reculer coûte plus cher qu'avancer, un grand saut exige une correspondance forte.
  - Régulation du défilement dix fois par seconde, avec prédiction de la position pendant la latence de Whisper.
  - Utilise le plus léger des modèles installés ; moteur séparé de celui des transcriptions de prises.
- **Coach** : indication « Passage sauté » quand le suivi détecte un saut.
- **Taille du texte jusqu'à 500 pt.**

### Corrigé
- La barre de sélection de l'éditeur débordait sur l'aperçu quand on réduisait la colonne : elle passe désormais à la ligne, et perd son libellé quand la place manque.
- Le chrono de droite du transport était rogné dans une fenêtre étroite : les chronos passent alors au-dessus des boutons.

## [1.9.1] — 2026-09-20

### Corrigé
- **Compte API sans crédit** : message clair dans la langue de l'interface au lieu de l'erreur brute du fournisseur, et bouton « Ajouter du crédit… » qui ouvre la page de facturation d'Anthropic ou d'OpenAI. Chez OpenAI, ce cas renvoie un code 429 identique à une limite de débit : il n'est plus relancé trois fois pendant 19 secondes avant d'échouer.

### Plateformes
- **Windows, Linux et macOS Intel** de nouveau disponibles, avec tout ce qui a été ajouté depuis la 1.7.0 : prises en WAV, rédaction IA, transcription locale, sous-titres. Chaque version embarque uniquement le moteur de transcription de sa plateforme.

## [1.9.0] — 2026-09-19

Quatrième étape vers la 2.0 : la transcription locale et tout ce qui en découle.

### Ajouté
- **Transcription locale par Whisper** (sherpa-onnx, modèles int8), sans connexion une fois le modèle téléchargé. Trois modèles au choix : Turbo (par défaut, 538 Mo), Small (610 Mo), Base (198 Mo). Téléchargement avec progression et annulation, depuis les publications GitHub de sherpa-onnx ; seuls les fichiers utiles de l'archive sont conservés.
- **Transcription automatique après chaque prise** (désactivable), ou à la demande depuis le détail de la prise.
- **Découpage par détection d'activité vocale** (Silero, livré avec l'application) avant Whisper : les prises longues sont traitées par fenêtres, et les pauses réelles servent au coach et aux sous-titres.
- **Analyse du discours**, comparée au texte : fidélité, passages sautés (un clic y amène le prompteur), mots ajoutés, débit réel, mots parasites, répétitions, hésitations. Indications entre crochets ignorées ; nombres en lettres et en chiffres rapprochés.
- **Sous-titres** aux usages de diffusion (2 × 42 caractères, 1 à 7 s, 17 car/s), coupures calées sur les silences, **éditeur** avec lecture de la prise, correction du texte et des temps, coupe, fusion, suppression, signalement des sous-titres trop rapides.
- **Export SRT** (UTF-8 avec BOM, CRLF).
- Bloc **Transcription** dans le panneau de réglages.

### Remarques
- Whisper gomme volontiers les « euh » et les répétitions, Turbo plus encore que Base : ces décomptes sont des minimums.
- L'extraction du modèle passe par la commande `tar` du système ; à défaut, une extraction en JavaScript prend le relais dans un thread séparé.

## [1.8.0] — 2026-09-19

Troisième étape vers la 2.0 : les fonctions de texte par IA.

### Ajouté
- **Bloc « Rédaction IA »** dans le panneau de réglages.
- **Traduction de scripts** vers sept langues (anglais, français, espagnol, allemand, italien, portugais, néerlandais), avec une consigne d'adaptation orale plutôt que littérale.
- **Transformation écrit → oral** : phrases courtes, listes converties, pauses marquées (« / » pour une respiration, un paragraphe pour une pause longue), mots à appuyer en gras, sans perte d'information, de chiffre, de nom ni d'appel à l'action.
- **Choix du fournisseur** : Claude (Anthropic) ou OpenAI, avec votre propre clé. La liste des modèles est lue chez le fournisseur ; par défaut Claude Sonnet 5 et GPT-5.6 Terra.
- **Éléments protégés** : URL, e-mails, variables et indications entre crochets sont remplacés par des jetons avant l'envoi et restaurés au retour — le fournisseur ne les voit jamais.
- **Contrôle des chiffres** : tout paragraphe dont un chiffre ou un élément protégé a changé est signalé par son numéro.
- Le résultat est **un nouveau texte**, placé sous l'original ; la couleur d'un intervenant suit ses paragraphes et le gras partiel est conservé.
- Longs textes : lots d'environ 1 200 mots, trois en parallèle, relance automatique sur limite de débit ou surcharge, progression et annulation.

### Sécurité
- La clé API est chiffrée par le trousseau du système (`safeStorage`), reste dans le processus principal et n'est jamais transmise à l'interface. Les requêtes passent par `net.fetch`, qui suit le proxy du système.

### Modifié
- **Écusson de la Haute-Savoie** redessiné d'après le fichier fourni.
- Le hors-ligne reste garanti pour tout ce qui sert en tournage : seule la rédaction IA contacte un serveur, et uniquement sur clic.

## [1.7.3] — 2026-09-18

### Ajouté
- **Avertissement sur un texte vide**. Lancer le défilement d'un texte sans un mot affiche désormais une fenêtre à acquitter, traduite dans les cinq langues, au lieu de ne rien faire. Entrée, Échap, Espace ou le bouton la referment. Le lancement d'une prise n'affiche pas ce message.
- **Écusson de la Haute-Savoie** dans le bloc de vitesse lorsque celle-ci est réglée sur 74.

### Modifié
- **Les prises sont rattachées à leur texte.** Le bloc n'affiche que les prises enregistrées pour le texte ouvert, et la numérotation automatique repart à PRISE 01 pour chaque texte. Une case « Toutes les prises » donne accès à l'ensemble, avec le nombre de prises masquées : c'est le seul moyen d'atteindre celles dont le texte a été supprimé.

## [1.7.2] — 2026-09-18

### Corrigé
- **Lecture des prises dans l'application**. La vraie cause : la politique de sécurité du rendu (`default-src 'self'`) ne déclarait pas de directive `media-src`, et bloquait donc toute source `blob:` — c'est-à-dire l'audio des prises, quel que soit son format. Chromium refusait la source avant même de la décoder, d'où le message « Failed to load because no supported source was found » alors que le fichier lui-même était parfaitement valide. La politique déclare désormais `media-src 'self' blob:`.
- Le correctif de type MIME de la 1.7.1 était nécessaire mais pas suffisant : les deux verrous devaient sauter.

### Modifié
- La capture du signal passe par un **AudioWorklet**, sur le fil audio, au lieu du `ScriptProcessorNode` sur le fil principal : le défilement du prompteur ne peut plus provoquer de trou dans l'enregistrement. Le module est servi comme fichier de l'application, et non comme `blob:`, pour rester compatible avec `script-src 'self'`. Le repli sur `ScriptProcessorNode` subsiste si le worklet ne se charge pas.
- La fin de prise est désormais captée au bloc près (4096 échantillons, ≈ 85 ms) au lieu de 16384.

## [1.7.1] — 2026-09-18

### Corrigé
- **Lecture des prises**. Les données audio étaient transmises à l'élément de lecture sans type MIME : sans indication de format, la lecture échouait sans message. Le type est désormais déduit de l'extension, et un échec de lecture affiche enfin une erreur explicite.

### Modifié
- **Les prises sont enregistrées en WAV** (PCM 16 bits, mono, à la fréquence du micro) au lieu de WebM/Opus. `MediaRecorder` ne sait pas produire de WAV : le signal est capté directement dans le graphe audio et l'en-tête RIFF est écrit à l'arrêt. Le fichier est non compressé, lisible par tous les logiciels de montage, et directement exploitable par la transcription locale prévue en 2.0.
- La durée d'une prise est désormais mesurée sur le signal capté et non sur l'horloge de la page : elle correspond exactement à la durée du fichier.
- Les prises déjà enregistrées en `.webm` restent listées et lisibles.

## [1.7.0] — 2026-09-18

Deuxième étape vers la 2.0 : tout ce qui pouvait se faire en local, sans reconnaissance vocale.

### Ajouté
- **Enregistrement audio** depuis la barre de transport. Chaque enregistrement devient une **prise** nommée automatiquement (PRISE 01, 02…), qui conserve heure, durée, script utilisé, position atteinte, vitesse et analyse.
- **Gestion des prises** : renommer, supprimer, verrouiller, annoter, marqueurs, lecture, comparaison de deux prises, révélation dans le Finder, export du fichier audio.
- **Coach de rythme** pendant la prise : indication discrète « Bon rythme », « Ralentissez légèrement » ou « Accélérez légèrement », affichée seulement après 2,5 s de stabilité, et désactivable.
- **Analyse par prise**, sans transcription : débit estimé, écart avec la vitesse du prompteur, pauses, silence, temps de parole, irrégularité.
- **Choix du micro** dans les réglages.
- **Annulation et rétablissement** dans l'éditeur (⌘Z / ⌘⇧Z, Ctrl+Z / Ctrl+Y), avec regroupement des frappes rapprochées et retour du curseur à l'endroit modifié. Les boutons sont aussi dans la barre de sélection.

### Remarques
- Lancer une prise entraîne le prompteur, et l'arrêter le met en pause.
- L'analyse repose sur le signal audio seul : elle situe un rythme, elle ne lit pas les mots. Hésitations, répétitions et passages sautés relèvent de la transcription locale, prévue en 2.0.
- Sur macOS, la première prise demande l'autorisation d'accès au micro.

## [1.6.0] — 2026-09-18

Première étape vers la 2.0 : les chantiers les plus simples, tous hors ligne et sans dépendance nouvelle.

### Ajouté
- **Recherche de textes** par mot-clé dans les titres, en haut de la liste. Insensible à la casse et aux accents.
- **Trois langues d'interface supplémentaires** : espagnol, allemand, italien, en plus de l'anglais et du français.
- **Correcteur orthographique** aligné sur la langue choisie.

### Modifié
- Les traductions sont réparties en un fichier par langue (`src/shared/locales/`), pour qu'ajouter une langue ne touche plus au reste du code.
- Le texte d'exemple citait encore Espace pour lancer la lecture ; il indique maintenant Option + Espace.

### Vérifié
- **Hors ligne** : le code ne contient aucun appel réseau, ce qui est désormais documenté et testé.
- **Performance** sur un script de 20 000 mots (2 h 22 de lecture) : 16,7 ms par image en médiane, 17,6 ms au pire, aucune image perdue, 515 nœuds affichés, 10 Mo de mémoire JavaScript.

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

[1.7.0]: https://github.com/CaribouNathan/CariPrompt/releases/tag/v1.7.0
[1.6.0]: https://github.com/CaribouNathan/CariPrompt/releases/tag/v1.6.0
[1.5.0]: https://github.com/CaribouNathan/CariPrompt/releases/tag/v1.5.0
[1.4.2]: https://github.com/CaribouNathan/CariPrompt/releases/tag/v1.4.2
[1.4.1]: https://github.com/CaribouNathan/CariPrompt/releases/tag/v1.4.1
[1.4.0]: https://github.com/CaribouNathan/CariPrompt/releases/tag/v1.4.0
[1.3.1]: https://github.com/CaribouNathan/CariPrompt/releases/tag/v1.3.1
[1.3.0]: https://github.com/CaribouNathan/CariPrompt/releases/tag/v1.3.0
[1.2.0]: https://github.com/CaribouNathan/CariPrompt/releases/tag/v1.2.0
[1.1.0]: https://github.com/CaribouNathan/CariPrompt/releases/tag/v1.1.0
[1.0.0]: https://github.com/CaribouNathan/CariPrompt/releases/tag/v1.0.0
