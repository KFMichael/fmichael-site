# Audit d'accessibilité desktop — frvky.online

## Limites de cet audit
Le site bloque les captures d'écran et l'exécution de scripts depuis mon navigateur. J'ai donc analysé l'arbre d'accessibilité, le texte de la page et ses métadonnées. **Je n'ai pas testé** : la navigation clavier réelle, le focus visible, les contrastes, les animations et `prefers-reduced-motion`. À vérifier à la main (Tab, zoom 200 %, axe DevTools) avant de s'en inspirer plus.

## Ce que le site fait bien (UI/UX)
- Un concept fort et mémorable : le site imite un bureau et un écran de verrouillage avec des « notifications » qui racontent l'activité de la personne.
- Les icônes de réseaux sociaux ont un nom accessible (Instagram, X, YouTube, LinkedIn).
- Les métadonnées de partage sont soignées (description, image Open Graph avec `alt`).

## Problèmes constatés
| Gravité | Constat | Critère WCAG |
|---|---|---|
| Bloquant | La meta viewport contient `maximum-scale=1, user-scalable=no` : le zoom est désactivé. | 1.4.4 Redimensionnement du texte |
| Bloquant | L'arbre d'accessibilité n'expose ni titre (`h1`–`h6`), ni landmark (`main`, `nav`), ni lien d'évitement. Tout est « generic ». | 1.3.1, 2.4.1, 2.4.6 |
| Élevé | La barre de menus (Finder, File, Edit, View, Window) est décorative mais lue comme du contenu. Elle devrait être `aria-hidden`. | 1.3.1, 4.1.2 |
| Élevé | Les notifications sont des blocs génériques, pas des éléments interactifs identifiables. « Swipe up to unlock » est un geste tactile sans équivalent clavier évident. | 2.1.1, 2.5.1 |
| Moyen | Des liens (Instagram, TikTok, LinkedIn) sont lus avec leur URL brute plutôt qu'un libellé clair. | 2.4.4 Objectif du lien |
| Moyen | Contenu qui paraît temps réel (« now », « 38m ago », « 2m ago ») : trompeur pour un lecteur d'écran et sans valeur d'information. | 1.3.1 |
| Moyen | Textes en anglais (« Tap to say something ») : formulation tactile sur desktop, et un seul `lang` pour toute la page. | 3.1.1, 3.1.2 |
| Faible | Le `<title>` est juste « Frvky », peu descriptif. | 2.4.2 |

## Verdict desktop
Visuellement très réussi, mais **l'expérience est pensée pour le tactile (mobile)** : l'interface « téléphone » ne s'adapte pas vraiment au desktop, et le clavier / lecteur d'écran semblent peu pris en compte. Le zoom bloqué est le point le plus grave.

## À reprendre pour fmichael.cloud
- La personnalité : un détail de style marquant (accent de couleur, micro-interaction sobre), sans cacher le contenu derrière une métaphore.
- Les sections courtes et scannables, les liens sociaux clairs.

## À éviter
- Désactiver le zoom.
- Une interface où le contenu n'existe que dans des éléments non sémantiques.
- Les gestes uniquement tactiles (glisser, balayer) sans alternative clavier.
- Des horodatages fictifs.
