## CariPrompt 2.1 — prise en main immédiate

Prompteur multi-écrans **gratuit et open source** pour **macOS, Windows et Linux**.

Cette version soigne l'arrivée dans l'application et met le suivi vocal et l'enregistrement à portée de clavier.

### Textes fournis
- Un texte **Welcome** unique, qui présente **toutes les fonctions** de l'application **dans les cinq langues** de l'interface, l'une après l'autre.
- Un **script de test** par langue : cinq textes courts, prêts à lire, pour régler la vitesse, essayer le suivi vocal et l'enregistrement.
- Les anciens textes de bienvenue sont remplacés **seulement s'ils n'ont pas été modifiés**. Vos retouches restent dans la bibliothèque.

### Raccourcis
| macOS | Windows / Linux | Action |
|---|---|---|
| ⌘ ⇧ T | Ctrl Maj T | Suivi vocal (marche / arrêt) |
| ⌘ ⇧ R | Ctrl Maj R | Enregistrement audio (marche / arrêt) |

Ils sont rappelés sur les deux boutons, dans la liste des raccourcis en bas à gauche et dans le menu **Prompteur**.

### Et aussi
- L'écusson de la **Haute-Savoie**, qui apparaît quand la vitesse est réglée sur 74, ouvre la page Wikipédia du département.

### Quel fichier choisir ?
| Système | Fichier |
|---|---|
| Mac Apple Silicon (M1 et suivants) | `CariPrompt-2.1.0-macOS-AppleSilicon.zip` |
| Windows, avec installation | `CariPrompt-2.1.0-Windows-Setup.exe` |
| Windows, sans installation | `CariPrompt-2.1.0-Windows-Portable.exe` |
| Linux, toutes distributions | `CariPrompt-2.1.0-Linux-x86_64.AppImage` |
| Debian / Ubuntu | `CariPrompt-2.1.0-Linux-amd64.deb` |

**Mac Intel** : pas de paquet prêt à l'emploi. L'application se compile depuis les sources avec `MAC_ARCHS=x64 npm run dist:mac`.

Vos textes, réglages et prises des versions précédentes sont conservés. Les sommes de contrôle sont dans `SHA256SUMS.txt`.

### Premier usage de la transcription et du suivi vocal
Dans le bloc **Transcription** du panneau de droite, téléchargez **Base** (198 Mo) pour le suivi vocal, et **Turbo** (538 Mo) pour les meilleures transcriptions de prises. C'est la seule étape qui demande une connexion.

### ⚠️ Application non signée
CariPrompt n'est pas signé avec un certificat Apple ou Microsoft (payants). Un avertissement s'affiche au premier lancement :
- **macOS** : Réglages Système › Confidentialité et sécurité › **Ouvrir quand même**, ou `xattr -cr /Applications/CariPrompt.app`
- **Windows** : **Informations complémentaires** › **Exécuter quand même**

Détails dans le [README](https://github.com/CaribouNathan/CariPrompt#installation--application-non-signée). Historique complet dans le [CHANGELOG](https://github.com/CaribouNathan/CariPrompt/blob/main/CHANGELOG.md).
