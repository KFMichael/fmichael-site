# fmichael.cloud

Site personnel de Michaël Kangah. HTML, CSS et JS statiques, sans build.

## Lancer en local
```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Déploiement (GitHub Pages)
1. Créer le dépôt GitHub et y pousser ce dossier (branche `main`).
2. Dans *Settings → Pages*, choisir *Source : GitHub Actions*.
3. Le workflow `.github/workflows/deploy.yml` publie à chaque push sur `main`.
4. Domaine `fmichael.cloud` : le fichier `CNAME` est déjà présent. Chez le registrar, ajouter quatre enregistrements `A` vers `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`, et un `CNAME` `www` vers `<compte>.github.io`. Vérifier ces valeurs dans la documentation GitHub Pages au moment de le faire.
5. Dans *Settings → Pages*, activer *Enforce HTTPS* une fois le certificat émis.

## Documents
- `CLAUDE.md` : règles du projet pour Claude Code.
- `DESIGN.md` : charte visuelle.
- `docs/audit-accessibilite.md` : audit de frvky.online.
- `docs/plan-contenu.md` : sections et questions ouvertes.
