## CariPrompt 2.2.2 — vitre macOS et documentation multilingue

Prompteur multi-écrans **gratuit et open source** pour **macOS, Windows et Linux**.

Mise au point de la série 2.2, publiée dans la foulée de la 2.2.0 et de la 2.2.1.

### Cette version
- **Vibrance macOS** : les colonnes de gauche et de droite laissent voir la matière du système, comme les barres latérales des applications d'Apple. Le texte et l'aperçu restent sur des surfaces pleines ; aucun trait ne sépare les zones, seules les teintes les distinguent.
- **Aperçu mieux détaché** de la colonne d'édition : la zone de l'aperçu a sa propre teinte, nettement plus sombre en thème sombre, plus grise en thème clair.
- **README en cinq langues** — anglais, français, espagnol, allemand et italien — avec un sélecteur en tête de page.

### Rappel des 2.2.0 et 2.2.1
- **Panneau de réglages en onglets** : Essentiel, Mise en page, Transcription, Outils IA et **Perso**, où vous rassemblez les blocs de votre choix ; le contenu est conservé au redémarrage et les préréglages en gardent plusieurs dispositions.
- **Blocs repliables** et **bulles d'aide « i »** à la place des notes de bas de bloc.
- **Barre de titre** : bouton Décompte, boutons **Afficher la sortie** et **Plein écran** libellés.
- **Drapeaux** des scripts de test, **flèches de vitesse cliquables**, **icône détourée**.
- **Vérification des mises à jour** : bouton dans le panneau et vérification au lancement, débrayable.
- **Application allégée** : AppImage 139 → 131 Mo, Debian 109 → 104 Mo, Windows 117 → 105 Mo.

### Quel fichier choisir ?
| Système | Fichier |
|---|---|
| Mac Apple Silicon (M1 et suivants) | `CariPrompt-2.2.2-macOS-AppleSilicon.dmg` |
| Mac, sans image disque | `CariPrompt-2.2.2-macOS-AppleSilicon.zip` |
| Windows, avec installation | `CariPrompt-2.2.2-Windows-Setup.exe` |
| Windows, sans installation | `CariPrompt-2.2.2-Windows-Portable.exe` |
| Linux, toutes distributions | `CariPrompt-2.2.2-Linux-x86_64.AppImage` |
| Debian / Ubuntu | `CariPrompt-2.2.2-Linux-amd64.deb` |

**Mac Intel** : pas de paquet prêt à l'emploi. L'application se compile depuis les sources avec `MAC_ARCHS=x64 npm run dist:mac`.

Vos textes, réglages, prises et préréglages des versions précédentes sont conservés. Les sommes de contrôle sont dans `SHA256SUMS.txt`.

### Premier usage de la transcription et du suivi vocal
Dans le bloc **Transcription** de l'onglet du même nom, téléchargez **Base** (198 Mo) pour le suivi vocal, et **Turbo** (538 Mo) pour les meilleures transcriptions de prises. C'est la seule étape qui demande une connexion.

### ⚠️ Application non signée
CariPrompt n'est pas signé avec un certificat Apple ou Microsoft (payants). Un avertissement s'affiche au premier lancement :
- **macOS** : Réglages Système › Confidentialité et sécurité › **Ouvrir quand même**, ou `xattr -cr /Applications/CariPrompt.app`
- **Windows** : **Informations complémentaires** › **Exécuter quand même**

Détails dans le [README](https://github.com/CaribouNathan/CariPrompt#installation--application-non-signée). Historique complet dans le [CHANGELOG](https://github.com/CaribouNathan/CariPrompt/blob/main/CHANGELOG.md).
