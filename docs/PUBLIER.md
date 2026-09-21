# Publier une version sur GitHub

Procédure pour la 2.2.2. Pour une autre version, remplacer le numéro partout.

## 1. Mettre le code à jour

Dans le dossier du dépôt, décompressez `CariPrompt-2.2.2-source.zip` par-dessus le contenu existant (les fichiers ont les mêmes chemins), puis :

```bash
git add -A
git commit -m "CariPrompt 2.2.2"
git tag v2.2.2
git push origin main
git push origin v2.2.2
```

> Si vous préférez l'interface web : **Add file › Upload files**, glissez le contenu décompressé de l'archive source, validez. Créez ensuite le tag `v2.2.2` à l'étape suivante.

## 2. Créer la release

1. Sur la page du dépôt : **Releases › Draft a new release**.
2. **Choose a tag** : `v2.2.2` (ou tapez-le pour le créer sur `main`).
3. **Release title** : `CariPrompt 2.2.2 — icône détourée et colonnes vitrées`
4. **Description** : copiez le contenu de `docs/RELEASE-2.2.2.md`.
5. **Attach binaries** : glissez les sept fichiers du dossier de livraison :

| Fichier | Poids indicatif |
|---|---|
| `CariPrompt-2.2.2-macOS-AppleSilicon.dmg` | ≈ 137 Mo |
| `CariPrompt-2.2.2-macOS-AppleSilicon.zip` | ≈ 136 Mo |
| `CariPrompt-2.2.2-Windows-Setup.exe` | ≈ 106 Mo |
| `CariPrompt-2.2.2-Windows-Portable.exe` | ≈ 105 Mo |
| `CariPrompt-2.2.2-Linux-x86_64.AppImage` | ≈ 132 Mo |
| `CariPrompt-2.2.2-Linux-amd64.deb` | ≈ 105 Mo |
| `SHA256SUMS.txt` | 1 Ko |

GitHub accepte jusqu'à 2 Go par fichier : aucun découpage n'est nécessaire.

6. Cochez **Set as the latest release**, puis **Publish release**.

Le badge de version du README et le lien « Releases » pointent automatiquement vers cette publication.

## 3. Vérifier

- La page de la release affiche les sept fichiers et les notes.
- Le README affiche la nouvelle icône et les nouvelles captures (dossier `docs/`).
- Un téléchargement se vérifie avec `shasum -a 256 <fichier>` (macOS, Linux) ou `certutil -hashfile <fichier> SHA256` (Windows), à comparer à `SHA256SUMS.txt`.

## Ce qu'il ne faut pas publier

- Le dossier `release/` du dépôt (il est ignoré par git) : les binaires vont dans la release, pas dans le code.
- `node_modules/` et `dist/` : régénérés par `npm install` et `npm run build`.
