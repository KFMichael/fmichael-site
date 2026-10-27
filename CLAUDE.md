# fmichael.cloud — site personnel de Michaël

## Objectif
Site vitrine personnel en français qui présente Michaël (Product Owner / Product Manager, ingénieur, freelance micro-entrepreneur) : ses activités, ses projets et ses hobbies. Cible : recruteurs, clients freelance, contacts.

## Stack
- HTML / CSS / JS statiques, sans framework ni étape de build.
- Hébergement : GitHub Pages (workflow dans `.github/workflows/deploy.yml`, déclenché sur `main`), dépôt public `KFMichael/fmichael-site`.
- Seul le site est publié : `scripts/assemble-site.sh` copie `index.html`, `404.html`, `favicon.svg`, `CNAME`, `css/`, `js/` et `img/` dans `_site/` (et vérifie que chaque ressource référencée y est). **Tout nouveau fichier ou dossier nécessaire au site doit être ajouté à ce script**, sinon il n'est pas publié. `npm run check:site` le teste en local.
- Domaine `fmichael.cloud` géré chez Cloudflare : 4 enregistrements `A` + `CNAME www` vers `kfmichael.github.io`, en « DNS only » (pas de proxy).
- E-mail : `k@fmichael.cloud` redirigé par Cloudflare Email Routing vers la boîte personnelle de Michaël (jamais écrite dans le dépôt, qui est public).
- Pas de dépendance externe tant que ce n'est pas nécessaire (pas de CDN, pas de tracker), **sauf la mesure d'audience** validée par Michaël : Cloudflare Web Analytics (sans cookie), chargée par `js/analytics.js` uniquement sur `fmichael.cloud` / `www.fmichael.cloud`, jamais avec « Do Not Track », jamais pour un navigateur exclu via `?analytics=off` (`?analytics=on` pour réactiver). Les chiffres se lisent dans Cloudflare, Analytics & Logs, Web Analytics. Le jeton du site est public.

## Structure
- `index.html` : page unique avec les sections Accueil, Parcours, Réalisations, Hobbies, Contact (l'identifiant interne de Réalisations reste `travail` : ancre `#travail`, `data-app="travail"`).
- `css/style.css` : styles et variables (tokens dans `:root`).
- `css/os.css` et `js/os.js` : mode bureau (écran verrouillé + fenêtres + dock), actif seulement si l'écran fait au moins 900×560 px (`html.os-mode`). Le contenu des fenêtres est copié depuis les sections de la page classique : modifier le texte dans `index.html` suffit.
- `js/main.js` : thème clair/sombre et petites améliorations. Le site doit rester utilisable sans JS.
- `docs/` : audit d'accessibilité et plan de contenu.
- `DESIGN.md` : charte visuelle.

## Décisions validées
- Sections : Accueil, Parcours (CV : une ligne par poste, formation, certifications, langues), Réalisations (études de cas : période, contexte, rôle, résultat ; une réalisation par expérience concernée, sans répéter la frise), Hobbies (tennis, football, jeux de société, voyage), Contact.
- Les noms d'entreprises (Louis Vuitton, Galeries Lafayette, BHV, Davidson, Wemanity, Omnilog) et les liens des 4 boutiques Shopify sont publiables, ainsi que le site portfolio de Mirielle Rohr (lien vers l'aperçu `mirielle-r-portfolio.pages.dev`, à remplacer par `www.miriellerohr.com` une fois le domaine branché).
- Contact public : `k@fmichael.cloud`, LinkedIn `linkedin.com/in/kangahmichael`, GitHub `KFMichael`. Jamais de téléphone ni d'adresse postale.
- Pas de CV en téléchargement ni de photo de Michaël. Hobbies : cartes photo, illustrations provisoires dans `img/hobby-*.svg` en attendant ses photos (`img/`, WebP, alt utile).
- Source du contenu : le CV « PO technique senior » de Michaël. Ne pas inventer de chiffres : n'utiliser que ceux du CV.
- Site en français uniquement.

## Façon de travailler avec Michaël
- Répondre en français, ton direct et naturel.
- Avant de commencer un travail, présenter un plan court et attendre sa validation.
- Travailler sur une branche ; ne fusionner dans `main` (donc ne publier) qu'après son accord explicite.

## Mode bureau (inspiré de frvky.online, identité propre)
- Écran verrouillé (heure réelle, 3 notifications cliquables, bouton « Entrer »), puis bureau avec barre de menus, fenêtres (Parcours, Réalisations, Disponibilité, Hobbies, Contact) et dock.
- Toujours une sortie : bouton « Version classique » (mémorisé), page classique sur mobile, petit écran et zoom élevé.
- Clavier : Tab/Entrée pour tout, Échap ferme la fenêtre et rend le focus au dock. Le glisser à la souris est un bonus.
- Choix par défaut en attendant l'avis de Michaël : fond dégradé abstrait (pas de photo), accent bleu, icônes dessinées maison.
- Pas de faux horodatages, pas de logos de marques tierces.

## Mode téléphone (conventions des Human Interface Guidelines, version web)
- Le site reste statique : pas de SwiftUI ni de SF Symbols (licence limitée aux plateformes Apple). On reprend les principes avec nos propres icônes SVG.
- Couleurs sémantiques (`--bg`, `--bg-grouped`, `--label`, `--label-2`, `--separator`, `--tint`, `--red`, `--green`) définies une seule fois, en clair et en sombre, avec variantes `prefers-contrast: more` et `prefers-reduced-transparency`.
- Texte en unités relatives ; styles de texte Dynamic Type (`font: -apple-system-*`) quand Safari iOS les gère. Testé à 200 % sans débordement.
- Pile de navigation (`NavigationStack`) : grand titre qui se réduit, bouton de retour qui porte le titre de l'écran précédent, transition en glissement, retour par Précédent, Échap, glissement depuis le bord gauche. La barre « accueil » (clic ou glissement vers le haut) ferme l'application entière. Réalisations est la liste → détail ; les autres applications sont à un seul écran.
- Animations coupées si `prefers-reduced-motion` ; aucun geste obligatoire.

## Où on en est
- **Backlog = les issues GitHub** de `KFMichael/fmichael-site` (étiquettes `contenu`, `design`, `technique`, `hors-code`). Voir aussi `docs/plan-mobile.md` (historique du mode téléphone).
- En ligne : mode bureau, mode téléphone (conventions Human Interface Guidelines en version web, pile de navigation), version classique, Parcours (CV) et Réalisations (études de cas), statut « En mission longue, disponible pour des projets de courte durée » avec bouton de rendez-vous Calendly (lien, sans script tiers), hobbies en cartes (Vibecoding en premier, illustrations provisoires), widgets Vibecoding et Disponibilité sur le bureau, bouton de rendez-vous dès l'accueil, balises de partage (Open Graph, `img/share.png`), page 404, favicon, mesure d'audience Cloudflare, CI (lint, tests unitaires, axe, comportement, assemblage du site), déploiement du site seul.
- **Design : le glass (verre dépoli sur fond dégradé) est la direction retenue par Michaël.** Le design éditorial (angles droits, aplats) a été testé puis refusé : ne pas le reproposer. Les surfaces (widgets, fenêtres, dock, notifications) sont en verre : fond semi-transparent, flou, reflet fin sur le bord ; opaques si `prefers-reduced-transparency`. Pas de césure automatique du texte (`hyphens: auto` interdit).
- Publication : fusion dans `main` seulement après le « go » de Michaël.

## Règles d'accessibilité (WCAG 2.2 AA, non négociables)
- `<html lang="fr">`, un seul `h1`, hiérarchie de titres sans saut, landmarks (`header`, `nav`, `main`, `footer`).
- Lien d'évitement « Aller au contenu » en premier élément focusable.
- Tout est atteignable et utilisable au clavier, dans un ordre logique. Focus toujours visible (`:focus-visible`, contraste 3:1 minimum).
- Vrais `<a>` et `<button>`, jamais de `div` cliquable.
- Contraste texte 4,5:1 minimum (3:1 pour le gros texte et les composants d'interface).
- Ne jamais bloquer le zoom : pas de `maximum-scale` ni `user-scalable=no` dans la meta viewport. Le contenu reste lisible à 200 % et en reflow à 320 px.
- Respecter `prefers-reduced-motion` et `prefers-color-scheme`. Aucune animation automatique de plus de 5 secondes sans contrôle.
- Cibles cliquables de 24×24 px minimum (44×44 px visé).
- Les images ont un `alt` utile (ou `alt=""` si décoratives). Les liens ont un nom explicite, pas une URL brute.
- L'information ne passe jamais par la couleur seule.

## Conventions
- Texte en français, ton direct et naturel (pas de jargon corporate).
- CSS : variables dans `:root`, unités relatives (`rem`), mobile first.
- JS : vanilla, pas de librairie. Progressive enhancement.
- Commits courts en français ou en anglais, à l'impératif.

## Avant de livrer une modification
1. Parcourir la page au clavier (Tab, Maj+Tab, Entrée) et vérifier le focus.
2. Zoomer à 200 % et réduire à 320 px de large.
3. Vérifier les contrastes en thème clair et sombre.
4. Passer Lighthouse (accessibilité ≥ 95) et axe DevTools.

## Ne pas faire sans accord de Michaël
- Pousser sur GitHub, configurer le DNS ou modifier le domaine.
- Publier une information personnelle (adresse, famille, finances, clients nommés).
- Ajouter un service tiers (analytics, polices externes, formulaires hébergés).
