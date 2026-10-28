# fmichael.cloud — site personnel de Michaël

## Objectif
Site vitrine personnel en français qui présente Michaël (Product Owner / Product Manager, ingénieur, freelance micro-entrepreneur) : ses activités, ses projets et ses hobbies. Cible : recruteurs, clients freelance, contacts.

## Stack
- HTML / CSS / JS statiques, sans framework ni étape de build.
- Hébergement : GitHub Pages (workflow dans `.github/workflows/deploy.yml`, déclenché sur `main`), dépôt public `KFMichael/fmichael-site`.
- Seul le site est publié : `scripts/assemble-site.sh` copie `index.html`, `404.html`, `robots.txt`, `sitemap.xml`, `favicon.svg`, `CNAME`, `css/`, `js/` et `img/` dans `_site/` (et vérifie que chaque ressource référencée y est). **Tout nouveau fichier ou dossier nécessaire au site doit être ajouté à ce script**, sinon il n'est pas publié. `npm run check:site` le teste en local.
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
- Sections : Accueil, Parcours (CV : une entrée par poste, avec un court paragraphe, l'environnement technique et un lien quand Michaël donne des détails, comme pour le stage CNRS de 2015 ; formation ; certifications regroupées par thème, avec le lien vers sa page LinkedIn ; langues), Réalisations (études de cas : période, contexte, rôle, résultat ; une réalisation par expérience concernée, sans répéter la frise), Hobbies (tennis, football, jeux de société, voyage), Contact.
- Les noms d'entreprises et d'organismes (Louis Vuitton, Galeries Lafayette, BHV, Davidson, Wemanity, Omnilog, France Télévisions, Canal+, Aptar (ex-Voluntis, à publier sous le nom Aptar), Chaumet (avec le lien chaumet.com), CNRS et le projet de recherche ANR Azkar) et les liens des 4 boutiques Shopify sont publiables, ainsi que le site portfolio de Mirielle Rohr (lien vers l'aperçu `mirielle-r-portfolio.pages.dev`, à remplacer par `www.miriellerohr.com` une fois le domaine branché).
- Contact public : `k@fmichael.cloud`, LinkedIn `linkedin.com/in/kangahmichael`, GitHub `KFMichael`. Jamais de téléphone ni d'adresse postale.
- Pas de CV en téléchargement ni de photo de Michaël. Hobbies : cartes photo, illustrations provisoires dans `img/hobby-*.svg` en attendant ses photos (`img/`, WebP, alt utile).
- Source du contenu : le CV « PO technique senior » de Michaël et son profil LinkedIn. Ne pas inventer de chiffres : n'utiliser que ceux de ces sources.
- Site en français uniquement.

## Façon de travailler avec Michaël
- Répondre en français, ton direct et naturel.
- Avant de commencer un travail, présenter un plan court et attendre sa validation.
- Travailler sur une branche ; ne fusionner dans `main` (donc ne publier) qu'après son accord explicite.

## Mode bureau (identité macOS, décision de Michaël)
- **Direction : le bureau a une identité macOS** (avant : « inspiré de frvky.online, identité propre »). On reprend les conventions et l'esprit de macOS : barre de menus en haut avec le nom de l'application active, fenêtres à boutons de contrôle à gauche, dock centré, verre dépoli sur fond coloré, heure et date en haut à droite. Le mode téléphone garde les conventions iOS (section suivante).
- Écran verrouillé (heure réelle, 3 notifications cliquables, bouton « Entrer »), puis bureau avec barre de menus, fenêtres (Parcours, Réalisations, Disponibilité, Hobbies, Contact), widgets (Vibecoding, Disponibilité, Réalisations), photo cadrée et dock.
- **Priorité d'expérience (Michaël) : la séquence des notifications** de l'écran verrouillé. Elles arrivent une à une (fondu et glissement), une seule fois, en moins de 5 s au total, sans faire bouger la mise en page ; tout est visible tout de suite si `prefers-reduced-motion` est demandé. Pas de boucle automatique.
- Fond d'écran : dégradé abstrait en attendant les photos de Michaël (emplacements `--lock-photo` / `--desk-photo` dans `css/os.css`, mode d'emploi dans `DESIGN.md`).
- Fenêtres : boutons rouge (fermer), jaune (réduire dans le dock : point sous l'icône, un clic la rouvre) et vert (agrandir), double-clic sur la barre de titre pour agrandir ou restaurer. Dock qui grossit au survol (souris seulement, coupé si `prefers-reduced-motion`, la mise en page ne bouge pas).
- Barre de menus : menu à ton nom (Verrouiller l'écran, Thème, Plein écran, Version classique), nom de l'application active, menu « Fenêtre » (Fermer, Réduire, Agrandir ou Restaurer, désactivés sans fenêtre). Motif WAI-ARIA « menu button » : flèches, Début/Fin, Échap (rend le focus au bouton), Entrée, flèches gauche/droite et survol pour passer d'un menu à l'autre.
- Recherche (Ctrl+K ou ⌘K, ou l'icône de la barre de menus) : applications, actions (verrouiller, thème, plein écran, version classique) et liens, en combobox + listbox (flèches, Entrée, Échap), le reste du bureau est inerte tant qu'elle est ouverte ; absente de l'écran verrouillé et du mode téléphone. Le classement est dans `OsUtils.searchEntries` (`js/utils.js`, testé).
- Fenêtres superposées : clic = premier plan, fenêtre inactive grisée (boutons gris, ombre légère), redimensionnement par le bord droit, le bas et le coin (22 × 14 rem minimum, jamais au-delà du bureau) ou Alt + Maj + flèches au clavier.
- Plein écran du navigateur : proposé par un bouton « Plein écran » (Échap en sort), jamais imposé.
- Toujours une sortie : bouton « Version classique » (mémorisé), page classique sur mobile, petit écran et zoom élevé.
- Clavier : Tab/Entrée pour tout, Échap ferme la fenêtre et rend le focus au dock. Le glisser à la souris est un bonus.
- Choix par défaut : accent bleu, icônes dessinées maison.
- **Limites de licence levées par Michaël (28 octobre 2026, risque accepté en connaissance de cause, sans avis juridique)** : le bureau reprend les noms d'apps macOS (Finder, Safari, Pages, Photos, Mail, Calendrier), un logo Apple dessiné en SVG maison, des icônes dessinées maison proches des SF Symbols, et les comportements macOS. Restent valables : aucun fichier Apple dans le dépôt (pas de police SF Pro, pas de SF Symbols) sauf si Michaël les fournit lui-même ; la pile `-apple-system` appelle la police déjà installée ; pas de logos de marques tierces ; le site doit dire qu'il n'a aucun lien avec Apple (pied de page) ; le mode téléphone garde les conventions iOS sans noms de marques.
- Pas de faux horodatages.

## Mode téléphone (conventions des Human Interface Guidelines, version web)
- Le site reste statique : pas de SwiftUI ni de SF Symbols (licence limitée aux plateformes Apple). On reprend les principes avec nos propres icônes SVG.
- Couleurs sémantiques (`--bg`, `--bg-grouped`, `--label`, `--label-2`, `--separator`, `--tint`, `--red`, `--green`) définies une seule fois, en clair et en sombre, avec variantes `prefers-contrast: more` et `prefers-reduced-transparency`.
- Texte en unités relatives ; styles de texte Dynamic Type (`font: -apple-system-*`) quand Safari iOS les gère. Testé à 200 % sans débordement.
- Pile de navigation (`NavigationStack`) : grand titre qui se réduit, bouton de retour qui porte le titre de l'écran précédent, transition en glissement, retour par Précédent, Échap, glissement depuis le bord gauche. La barre « accueil » (clic ou glissement vers le haut) ferme l'application entière. Réalisations est la liste → détail ; les autres applications sont à un seul écran.
- Animations coupées si `prefers-reduced-motion` ; aucun geste obligatoire.

- Référencement : `robots.txt` (tout autorisé, plan du site annoncé) et `sitemap.xml` (une seule page, `https://fmichael.cloud/`, sans date qui deviendrait fausse). Si une page est ajoutée, l'ajouter au plan du site ; `tests/unit/seo.test.js` vérifie la cohérence avec l'adresse canonique.
- Lighthouse : `npm run check:lighthouse` assemble et sert `_site`, audite l'écran d'entrée en mobile et en bureau, et échoue si accessibilité < 95, bonnes pratiques < 90 ou SEO < 90 ; la performance est affichée, jamais bloquante (elle varie d'un runner à l'autre). Dépendances de développement seulement (`lighthouse`, `chrome-launcher`), jamais publiées.

## Où on en est
- **Backlog = les issues GitHub** de `KFMichael/fmichael-site` (étiquettes `contenu`, `design`, `technique`, `hors-code`). Voir aussi `docs/plan-mobile.md` (historique du mode téléphone).
- En ligne : mode bureau, mode téléphone (conventions Human Interface Guidelines en version web, pile de navigation), version classique, Parcours (CV) et Réalisations (études de cas), statut « En mission longue, disponible pour des projets de courte durée » avec bouton de rendez-vous Calendly (lien, sans script tiers), hobbies en cartes (Vibecoding en premier, illustrations provisoires), widgets Vibecoding et Disponibilité sur le bureau, bouton de rendez-vous dès l'accueil, balises de partage (Open Graph, `img/share.png`), page 404, `robots.txt` et `sitemap.xml`, Lighthouse en CI, favicon, mesure d'audience Cloudflare, CI (lint, tests unitaires, axe, comportement, assemblage du site), déploiement du site seul.
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
