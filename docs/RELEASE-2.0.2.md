## CariPrompt 2.0 — le prompteur suit votre voix

Prompteur multi-écrans **gratuit et open source** pour **macOS, Windows et Linux**.

Cette version rassemble tout ce qui est arrivé depuis la 1.7.0 : suivi vocal, transcription locale, sous-titres, rédaction par IA, et une nouvelle icône.

### Suivi vocal
- Le texte **avance au rythme de votre voix**, **s'arrête quand vous marquez une pause**, **rattrape un passage sauté** et revient en arrière si vous reprenez une phrase.
- Bouton **Suivi voix** sous les commandes de lecture, avec son état en clair : à l'écoute, suit, perdu.
- **Hors ligne** : reconnaissance Whisper sur l'ordinateur, aucune donnée envoyée.

### Transcription, analyse et sous-titres
- **Transcription locale** de chaque prise par Whisper (modèles Turbo, Small ou Base, téléchargés une seule fois).
- **Analyse du discours** comparée au texte : fidélité, passages sautés, mots ajoutés, débit, mots parasites, répétitions, hésitations.
- **Sous-titres** aux normes de diffusion (2 × 42 caractères, 17 caractères/s), éditeur intégré, **export SRT**.

### Prises audio
- Enregistrement en **WAV** (PCM 16 bits), lisible par tous les logiciels de montage.
- Prises **rattachées à leur texte**, numérotation par texte.
- Bouton **Enreg. audio** avec durée et vumètre.

### Rédaction IA (facultative, avec votre clé)
- **Traduction** vers 7 langues et **adaptation à l'oral** d'un texte écrit, avec **Claude** ou **OpenAI**.
- URL, e-mails, variables et indications `[entre crochets]` ne sont **jamais envoyés** au fournisseur ; les chiffres modifiés sont signalés.
- La clé API est chiffrée dans le trousseau du système.

### Et aussi
- Texte jusqu'à **500 pt**.
- **Nouvelle icône**.
- Interface en **anglais, français, espagnol, allemand et italien**.
- Corrections : lecture des prises, barre de sélection et transport dans une fenêtre étroite, message clair quand un compte API n'a plus de crédit.

### Quel fichier choisir ?
| Système | Fichier |
|---|---|
| Mac Apple Silicon (M1 et suivants) | `CariPrompt-2.0.2-macOS-AppleSilicon.zip` |
| Windows, avec installation | `CariPrompt-2.0.2-Windows-Setup.exe` |
| Windows, sans installation | `CariPrompt-2.0.2-Windows-Portable.exe` |
| Linux, toutes distributions | `CariPrompt-2.0.2-Linux-x86_64.AppImage` |
| Debian / Ubuntu | `CariPrompt-2.0.2-Linux-amd64.deb` |

**Mac Intel** : plus de paquet prêt à l'emploi à partir de cette version. L'application se compile depuis les sources avec `MAC_ARCHS=x64 npm run dist:mac`.

Vos textes, réglages et prises des versions précédentes sont conservés. Les sommes de contrôle sont dans `SHA256SUMS.txt`.

### Premier usage de la transcription et du suivi vocal
Dans le bloc **Transcription** du panneau de droite, téléchargez **Base** (198 Mo) pour le suivi vocal, et **Turbo** (538 Mo) si vous voulez les meilleures transcriptions de prises. C'est la seule étape qui demande une connexion.

### ⚠️ Application non signée
CariPrompt n'est pas signé avec un certificat Apple ou Microsoft (payants). Un avertissement s'affiche au premier lancement :
- **macOS** : Réglages Système › Confidentialité et sécurité › **Ouvrir quand même**, ou `xattr -cr /Applications/CariPrompt.app`
- **Windows** : **Informations complémentaires** › **Exécuter quand même**

Détails dans le [README](https://github.com/CaribouNathan/CariPrompt#installation--application-non-signée). Historique complet dans le [CHANGELOG](https://github.com/CaribouNathan/CariPrompt/blob/main/CHANGELOG.md).
