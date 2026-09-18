## CariPrompt 1.4.2 — molette, sélection multiple, correctif macOS

Prompteur multi-écrans **gratuit et open source** pour **macOS, Windows et Linux**.

### Nouveautés
- **Molette** : défilement normal dans l'éditeur et la liste, navigation dans le texte au-dessus de l'aperçu (⌥ pour la vitesse, réglable)
- **Sélection multiple** des textes : ⇧ + clic et ⌘ / Ctrl + clic, comme dans le Finder
- **Clic dans l'éditeur** : l'aperçu se cale sur le passage cliqué
- Bloc **Timecode** séparé dans les réglages
- Bouton **Masquer la sortie** en rouge quand la sortie est active

### Corrigé
- **macOS** : l'application ne disparaît plus du Dock, de Cmd+Tab et de la barre de menus après l'affichage de la sortie

### Quel fichier choisir ?
| Système | Fichier |
|---|---|
| Mac Apple Silicon (M1 à M4) | `CariPrompt-1.4.2-macOS-AppleSilicon.zip` |
| Mac Intel | `CariPrompt-1.4.2-macOS-Intel.zip` |
| Windows, avec installation | `CariPrompt-1.4.2-Windows-Setup.exe` |
| Windows, sans installation | `CariPrompt-1.4.2-Windows-Portable.exe` |
| Linux, toutes distributions | `CariPrompt-1.4.2-Linux-x86_64.AppImage` |
| Debian / Ubuntu | `CariPrompt-1.4.2-Linux-amd64.deb` |

Vos textes et réglages des versions précédentes sont conservés.

### ⚠️ Application non signée
CariPrompt n'est pas signé avec un certificat Apple ou Microsoft (payants). Un avertissement s'affiche au premier lancement :
- **macOS** : Réglages Système › Confidentialité et sécurité › **Ouvrir quand même**, ou `xattr -cr /Applications/CariPrompt.app`
- **Windows** : **Informations complémentaires** › **Exécuter quand même**

Détails dans le [README](https://github.com/CaribouNathan/CariPrompt#installation--application-non-signée).
