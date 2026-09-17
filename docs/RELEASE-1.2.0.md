## CariPrompt 1.2.0 — version multiplateforme

Prompteur multi-écrans **gratuit et open source**, désormais disponible pour **macOS, Windows et Linux**.

### Nouveautés
- Versions Windows (installeur et portable) et Linux (AppImage et .deb)
- Icône de l'application et numéro de version dans l'interface
- Import .odt et .html, correcteur orthographique
- Clavier et molette actifs depuis l'écran de sortie
- Réécriture complète en Electron : un seul code pour les trois systèmes

### Quel fichier choisir ?
| Système | Fichier |
|---|---|
| Mac Apple Silicon (M1 à M4) | `CariPrompt-1.2.0-macOS-AppleSilicon.zip` |
| Mac Intel | `CariPrompt-1.2.0-macOS-Intel.zip` |
| Windows, avec installation | `CariPrompt-1.2.0-Windows-Setup.exe` |
| Windows, sans installation | `CariPrompt-1.2.0-Windows-Portable.exe` |
| Linux, toutes distributions | `CariPrompt-1.2.0-Linux-x86_64.AppImage` |
| Debian / Ubuntu | `CariPrompt-1.2.0-Linux-amd64.deb` |

### ⚠️ Application non signée
CariPrompt n'est pas signé avec un certificat Apple ou Microsoft (payants). Un avertissement s'affiche au premier lancement :
- **macOS** : Réglages Système › Confidentialité et sécurité › **Ouvrir quand même**, ou `xattr -cr /Applications/CariPrompt.app`
- **Windows** : **Informations complémentaires** › **Exécuter quand même**

Détails dans le [README](https://github.com/CaribouNathan/CariPrompt#installation--application-non-signée).
