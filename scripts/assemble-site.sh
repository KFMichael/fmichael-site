#!/usr/bin/env bash
# Assemble le dossier publié sur GitHub Pages : seulement le site, sans outils de dev, tests ni docs.
# Échoue si un fichier indispensable manque ou si une ressource référencée n'est pas copiée.
set -euo pipefail

out="${1:-_site}"
rm -rf "$out"
mkdir -p "$out"
cp index.html 404.html favicon.svg CNAME "$out"/
cp -R css js img "$out"/

fail=0
for f in index.html 404.html favicon.svg CNAME img/share.png; do
  [ -f "$out/$f" ] || { echo "Fichier indispensable manquant : $f"; fail=1; }
done

# Ressources locales référencées par la page (src / href, hors ancres et liens externes)
while IFS= read -r ref; do
  [ -e "$out/$ref" ] || { echo "Ressource référencée mais absente du site : $ref"; fail=1; }
done < <(grep -ohE '(src|href)="[^"#:]+"' "$out/index.html" | sed -E 's/^(src|href)="//; s/"$//' | sort -u)

# Ressources locales référencées par les feuilles de style (url(...)), relatives au dossier css/
while IFS= read -r ref; do
  [ -e "$out/css/$ref" ] || { echo "Ressource CSS référencée mais absente du site : $ref"; fail=1; }
done < <(grep -ohE "url\(['\"]?[^)'\"#:]+" "$out"/css/*.css 2>/dev/null | sed -E "s/^url\(['\"]?//" | sort -u)

if [ "$fail" -ne 0 ]; then exit 1; fi
echo "Site assemblé dans $out :"
(cd "$out" && find . -type f | sort | sed 's|^\./|  |')
