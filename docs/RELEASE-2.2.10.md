## CariPrompt 2.2.10 — démarrage Windows : plus d'échec silencieux

Prompteur multi-écrans **gratuit et open source** pour **macOS, Windows et Linux**.

### L'application pouvait ne rien afficher du tout
Sous Windows — en particulier dans une machine virtuelle — un double-clic pouvait rester sans le moindre effet : pas de fenêtre, pas de message, pas de journal. Trois défauts s'additionnaient.

- **La fenêtre n'était montrée qu'au premier rendu de l'interface.** Si ce rendu n'arrivait jamais — pilote graphique d'une machine virtuelle, processus d'affichage qui meurt — l'application restait un processus invisible. Passé huit secondes, elle est désormais montrée telle qu'elle est : mieux vaut une fenêtre vide qu'une absence inexplicable.
- **Ce processus invisible gardait le verrou d'instance unique.** Tous les lancements suivants ne faisaient donc plus rien, définitivement, jusqu'au redémarrage. Une fenêtre en vie mais cachée se montre maintenant quand on relance l'application.
- **Aucune exception du démarrage n'était rattrapée.** La création de la fenêtre, les exceptions non traitées et la perte du processus d'affichage sont journalisées et annoncées par une boîte de dialogue qui rappelle le chemin du journal : `%APPDATA%\CariPrompt\cariprompt.log`.

**Et la cause la plus probable du silence** : la couleur des boutons de fenêtre incrustés était transparente — huit chiffres hexadécimaux dont un canal alpha — alors que Windows dessine ces boutons avec une couleur opaque. Elle prend désormais le fond réel de l'application, identique à l'œil. Ce réglage ne concernait que Windows, ce qui explique que macOS et Linux n'aient jamais rien montré d'anormal.

Si le démarrage échoue encore, l'application le dira et le journal en donnera la raison.

### Quel fichier choisir ?
| Système | Fichier |
|---|---|
| Mac Apple Silicon (M1 et suivants) | `CariPrompt-2.2.10-macOS-AppleSilicon.dmg` |
| Mac, sans image disque | `CariPrompt-2.2.10-macOS-AppleSilicon.zip` |
| Windows 10 / 11 Intel ou AMD, avec installation | `CariPrompt-2.2.10-Windows-Setup.exe` |
| Windows 10 / 11 Intel ou AMD, sans installation | `CariPrompt-2.2.10-Windows-Portable.exe` |
| Linux x86_64 | `CariPrompt-2.2.10-Linux-x86_64.AppImage` |
| Windows 11 ARM64 (Snapdragon, machine virtuelle sur Mac Apple Silicon) | `CariPrompt-2.2.10-Windows-ARM64-Setup.exe` ou `-Portable.exe` — **sans transcription ni suivi vocal** |
| Linux ARM64 (Raspberry Pi 64 bits, machine virtuelle ARM, Asahi) | `CariPrompt-2.2.10-Linux-arm64.AppImage` |

Un binaire x86_64 ne démarre pas sur un processeur ARM, quel que soit le format : sur une machine ARM, prenez les fichiers `-ARM64-` ou `-arm64`. La bibliothèque de reconnaissance vocale n'est pas publiée pour Windows ARM64 : sur cette cible, **la transcription des prises et le suivi vocal sont indisponibles**, tout le reste fonctionne.

**Mac Intel** : pas de paquet prêt à l'emploi ; `MAC_ARCHS=x64 npm run dist:mac`.

Sur Fedora et dérivés, les AppImage demandent FUSE 2 : `sudo dnf install fuse`, ou lancement avec `--appimage-extract-and-run`.

Vos textes, réglages, prises et préréglages sont conservés. Sommes de contrôle dans `SHA256SUMS.txt`.

### ⚠️ Application non signée
CariPrompt n'est pas signé avec un certificat Apple ou Microsoft (payants). Un avertissement s'affiche au premier lancement :
- **macOS** : Réglages Système › Confidentialité et sécurité › **Ouvrir quand même**, ou `xattr -cr /Applications/CariPrompt.app`
- **Windows** : **Informations complémentaires** › **Exécuter quand même**. Sur une installation neuve de Windows 11, **Smart App Control** peut bloquer l'application **sans message** : Sécurité Windows › Contrôle des applications et du navigateur.

Détails dans le [README](https://github.com/CaribouNathan/CariPrompt#installation--application-non-signée). Historique complet dans le [CHANGELOG](https://github.com/CaribouNathan/CariPrompt/blob/main/CHANGELOG.md).
