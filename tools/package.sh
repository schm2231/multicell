#!/usr/bin/env bash
# Build a zip for upload to the Chrome Web Store (or to share for loading unpacked).
set -euo pipefail
cd "$(dirname "$0")/.."
version=$(python3 -c "import json;print(json.load(open('manifest.json'))['version'])")
mkdir -p dist
out="dist/multicell-$version.zip"
rm -f "$out"
zip -r -q "$out" manifest.json src icons
echo "$out"
