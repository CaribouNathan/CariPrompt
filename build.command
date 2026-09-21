#!/bin/bash
# CariPrompt — fabrication des paquets macOS depuis un Mac.
# Les fichiers sont déposés dans ./release. Aucune suppression, aucun dossier système modifié.
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js est requis : https://nodejs.org"
  exit 1
fi

echo "▸ Installation des dépendances…"
npm install --no-audit --no-fund

echo "▸ Fabrication macOS (Apple Silicon)…"
npm run dist:mac

echo "✓ Paquets disponibles dans ./release"
open release
