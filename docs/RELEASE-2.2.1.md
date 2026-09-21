## CariPrompt 2.2.1 — icône détourée et colonnes vitrées

Mise au point de la 2.2, publiée le même jour :

- **Nouvelle icône**, détourée : plus de fond blanc autour de la forme, à toutes les tailles.
- **Onglets du panneau sur une seule ligne** dans les cinq langues — le français et l'italien débordaient sur deux lignes.
- **Colonnes translucides sur macOS** : matière vitrée à gauche et à droite, et les traits de séparation des grandes zones laissent place à de simples écarts de teinte. Windows et Linux sont inchangés.

### Ce qu'apportait la 2.2

Prompteur multi-écrans **gratuit et open source** pour **macOS, Windows et Linux**.

Version de simplification : le panneau de réglages ne se parcourt plus en faisant défiler une longue colonne, et l'application est plus légère.

### Panneau de réglages en onglets
- **Essentiel** : sortie, vitesse, durée cible, commandes, télécommande — ce qu'on veut sous la main pendant un tournage.
- **Mise en page** : typographie, couleurs, mise en page, timecode.
- **Transcription** : prises et transcription. **Outils IA** : rédaction IA.
- **Perso** : vous y ajoutez les blocs de votre choix par un menu déroulant ; ils restent aussi dans leur onglet d'origine. Le contenu de cet onglet est conservé au redémarrage, et les **préréglages** en gardent plusieurs dispositions — ils remplacent le bloc « Préréglages ».

Dans chaque onglet, les blocs se réordonnent par glisser-déposer et **se replient** par la flèche au bout de leur ligne de titre. Les explications en bas de bloc deviennent un **« i » cliquable**.

### Barre de titre
- Bouton **Décompte** (le réglage quitte le bloc Commandes).
- Les icônes de sortie et de plein écran deviennent les boutons **Afficher la sortie** et **Plein écran**, comme dans le bloc Sortie, où ils restent également.

### Et aussi
- **Drapeaux** à côté des titres des scripts de test fournis.
- **Flèches de vitesse cliquables** de part et d'autre du curseur : un point de plus ou de moins.
- **Vérification des mises à jour** : bouton en bas du panneau et vérification silencieuse au lancement, débrayable. Aucune donnée n'est envoyée, l'installation reste manuelle.
- **Application allégée** : AppImage 139 → 132 Mo, paquet Debian 109 → 105 Mo, installeur Windows 117 → 106 Mo, archive macOS 139 → 136 Mo.

### Quel fichier choisir ?
| Système | Fichier |
|---|---|
| Mac Apple Silicon (M1 et suivants) | `CariPrompt-2.2.1-macOS-AppleSilicon.dmg` |
| Mac, sans image disque | `CariPrompt-2.2.1-macOS-AppleSilicon.zip` |
| Windows, avec installation | `CariPrompt-2.2.1-Windows-Setup.exe` |
| Windows, sans installation | `CariPrompt-2.2.1-Windows-Portable.exe` |
| Linux, toutes distributions | `CariPrompt-2.2.1-Linux-x86_64.AppImage` |
| Debian / Ubuntu | `CariPrompt-2.2.1-Linux-amd64.deb` |

**Mac Intel** : pas de paquet prêt à l'emploi. L'application se compile depuis les sources avec `MAC_ARCHS=x64 npm run dist:mac`.

Vos textes, réglages, prises et préréglages des versions précédentes sont conservés. Les sommes de contrôle sont dans `SHA256SUMS.txt`.

### ⚠️ Application non signée
CariPrompt n'est pas signé avec un certificat Apple ou Microsoft (payants). Un avertissement s'affiche au premier lancement :
- **macOS** : Réglages Système › Confidentialité et sécurité › **Ouvrir quand même**, ou `xattr -cr /Applications/CariPrompt.app`
- **Windows** : **Informations complémentaires** › **Exécuter quand même**

Détails dans le [README](https://github.com/CaribouNathan/CariPrompt#installation--application-non-signée). Historique complet dans le [CHANGELOG](https://github.com/CaribouNathan/CariPrompt/blob/main/CHANGELOG.md).
