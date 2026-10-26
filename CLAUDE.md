# fmichael.cloud — site personnel de Michaël

## Objectif
Site vitrine personnel en français qui présente Michaël (Product Owner / Product Manager, ingénieur, freelance micro-entrepreneur) : ses activités, ses projets et ses hobbies. Cible : recruteurs, clients freelance, contacts.

## Stack
- HTML / CSS / JS statiques, sans framework ni étape de build.
- Hébergement : GitHub Pages (workflow dans `.github/workflows/deploy.yml`), domaine `fmichael.cloud`.
- Pas de dépendance externe tant que ce n'est pas nécessaire (pas de CDN, pas de tracker).

## Structure
- `index.html` : page unique avec les sections Accueil, Activités, Projets, Hobbies, Contact.
- `css/style.css` : styles et variables (tokens dans `:root`).
- `js/main.js` : thème clair/sombre et petites améliorations. Le site doit rester utilisable sans JS.
- `docs/` : audit d'accessibilité et plan de contenu.
- `DESIGN.md` : charte visuelle.

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
