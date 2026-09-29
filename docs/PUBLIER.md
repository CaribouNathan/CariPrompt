# Publier une version sur GitHub

Procédure pour la 2.2.10. Pour une autre version, remplacer le numéro partout.

## 1. Mettre le code à jour

Dans le dossier du dépôt, décompressez `CariPrompt-2.2.10-source.zip` par-dessus le contenu existant (les fichiers ont les mêmes chemins), puis :

```bash
git add -A
git commit -m "CariPrompt 2.2.10"
git tag v2.2.10
git push origin main
git push origin v2.2.10
```

> Si vous préférez l'interface web : **Add file › Upload files**, glissez le contenu décompressé de l'archive source, validez. Créez ensuite le tag `v2.2.10` à l'étape suivante.

> **Si la 2.2.3 a déjà été publiée**, retirez-la : ses paquets macOS contiennent une application d'avant les corrections d'interface. Sur la page de la release, **Edit › Delete**, puis supprimez le tag correspondant. La vérification de mise à jour de l'application interroge la dernière release publiée.

## 2. Créer la release

1. Sur la page du dépôt : **Releases › Draft a new release**.
2. **Choose a tag** : `v2.2.10` (ou tapez-le pour le créer sur `main`).
3. **Release title** : `CariPrompt 2.2.10 — démarrage Windows : plus d'échec silencieux`
4. **Description** : copiez le contenu de `docs/RELEASE-2.2.10.md`.
5. **Attach binaries** : glissez les fichiers du dossier de livraison :

| Fichier | Poids indicatif |
|---|---|
| `CariPrompt-2.2.10-macOS-AppleSilicon.dmg` | ≈ 137 Mo |
| `CariPrompt-2.2.10-macOS-AppleSilicon.zip` | ≈ 136 Mo |
| `CariPrompt-2.2.10-Windows-Setup.exe` | ≈ 105 Mo |
| `CariPrompt-2.2.10-Windows-Portable.exe` | ≈ 104 Mo |
| `CariPrompt-2.2.10-Linux-x86_64.AppImage` | ≈ 130 Mo |
| `CariPrompt-2.2.10-Windows-ARM64-Setup.exe` | ≈ 94 Mo |
| `CariPrompt-2.2.10-Windows-ARM64-Portable.exe` | ≈ 93 Mo |
| `CariPrompt-2.2.10-Linux-arm64.AppImage` | ≈ 134 Mo |
| `SHA256SUMS.txt` | 1 Ko |

GitHub accepte jusqu'à 2 Go par fichier : aucun découpage n'est nécessaire.

6. Cochez **Set as the latest release**, puis **Publish release**.

Le badge de version du README et le lien « Releases » pointent automatiquement vers cette publication.

## 3. Vérifier

- La page de la release affiche les neuf fichiers et les notes.
- Le README affiche la nouvelle icône et les nouvelles captures (dossier `docs/`).
- Un téléchargement se vérifie avec `shasum -a 256 <fichier>` (macOS, Linux) ou `certutil -hashfile <fichier> SHA256` (Windows), à comparer à `SHA256SUMS.txt`.

## Ce qu'il ne faut pas publier

- Le dossier `release/` du dépôt (il est ignoré par git) : les binaires vont dans la release, pas dans le code.
- `node_modules/` et `dist/` : régénérés par `npm install` et `npm run build`.
