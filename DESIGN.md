# Charte visuelle

Direction retenue par Michaël : **glass** (verre dépoli sur fond dégradé coloré). Le design éditorial (angles droits, aplats) a été testé puis refusé : ne pas le reproposer.

Le site a trois vues qui partagent le contenu de `index.html` :
- **Bureau** (`html.os-mode`, écran d'au moins 900×560 px) : écran verrouillé, fenêtres, dock.
- **Téléphone** (`html.phone-mode`) : écran verrouillé, accueil, applications plein écran en pile de navigation.
- **Classique** : page simple, toujours disponible (bouton « Version classique », seule vue sans JS).

## Couleurs (tokens)

### Page classique (`css/style.css`)
| Token | Clair | Sombre | Usage |
|---|---|---|---|
| `--bg` | `#fafaf7` | `#111315` | fond |
| `--surface` | `#ffffff` | `#1a1d20` | cartes |
| `--text` | `#16181a` | `#f1f1ee` | texte principal |
| `--muted` | `#4a5056` | `#b4b9be` | texte secondaire |
| `--accent` | `#1d4ed8` | `#8fb0ff` | liens, boutons |
| `--accent-contrast` | `#ffffff` | `#0b0d10` | texte sur accent |
| `--border` | `#d9dbd6` | `#2c3034` | filets |

### Mode téléphone (`css/os.css`, portée `#os`)
Couleurs sémantiques définies une seule fois, en clair et en sombre.

| Token | Clair | Sombre |
|---|---|---|
| `--bg-grouped` | `#ffffff` | `#1c1c1e` |
| `--label` | `#000000` | `#ffffff` |
| `--label-2` | `rgba(60, 60, 67, 0.75)` | `rgba(235, 235, 245, 0.72)` |
| `--separator` | `rgba(60, 60, 67, 0.29)` | `rgba(84, 84, 88, 0.6)` |
| `--tint` | `#0061d5` | `#4da3ff` |
| `--red` / `--red-text` | `#c1271c` / `#a02419` | `#ff6b61` |
| `--green` | `#1f8a3b` | `#30d158` |

`--red-text` sert aux petits textes posés sur le verre (contraste ≥ 4,5:1).

Contrastes à contrôler à chaque changement : texte ≥ 4,5:1, gros texte et composants ≥ 3:1, en clair et en sombre.

## Fond d'écran
Dégradé abstrait en trois taches radiales (bleu, violet, rose en clair ; versions assombries en sombre), défini par `--wall` (téléphone) et `--wp-1..3` / `--wp-base` (bureau). Pas de photo pour l'instant (voir l'issue #6). Si une photo remplace le dégradé, il faut un voile qui garde le texte à 4,5:1.

## Le verre
Toutes les surfaces flottantes (widgets, fenêtres, dock, notifications, barres) suivent la même recette :
- fond semi-transparent : `color-mix(in srgb, var(--surface) 72–78 %, transparent)` ;
- flou : `backdrop-filter: var(--blur)`, soit `blur(24px) saturate(1.8)` (fenêtres bureau : `blur(22px) saturate(1.6)`) ;
- reflet fin sur le bord (bordure claire) et ombre douce ;
- reflet en haut des icônes (`.ico::before`, dégradé blanc vers transparent).

Replis obligatoires :
- `prefers-reduced-transparency: reduce` : surfaces **opaques**, pas de flou ;
- `prefers-contrast: more` : bordures pleines de 2 px, `--label-2` égal à `--label` ;

## Typographie
- Page classique : `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
- Mode téléphone : `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif`. C'est une pile de **polices déjà installées** sur l'appareil : on ne distribue aucune police Apple.
- Aucune police externe. Styles de texte Dynamic Type (`font: -apple-system-*`) quand Safari iOS les gère, tailles relatives sinon. Testé à 200 % sans débordement.
- Corps : 1,125 rem, interligne 1,6. Titres : 700, interligne 1,2. Largeur de ligne maximale : 70 caractères.
- **Pas de césure automatique** : `hyphens: auto` est interdit (il coupait « place-ment »). Coupure des mots très longs avec `overflow-wrap: anywhere`.
- Retours à la ligne : `text-wrap: balance` sur les titres et notes courtes, `text-wrap: pretty` sur les paragraphes des fenêtres.

## Espacement et mise en page
- Échelle : 0,5 / 1 / 1,5 / 2 / 3 / 5 rem. Conteneur de la page classique : 64 rem maximum.
- Cibles tactiles : 44×44 px visés, 24×24 px au minimum.
- Mobile first. Tester à 320, 375, 768 et 1440 px, et à 200 % de zoom.

## Composants
- **Lien d'évitement** : visible au focus, premier élément focusable.
- **Écran verrouillé** : heure réelle, 3 notifications cliquables, bouton « Entrer ».
- **Accueil (téléphone)** : grille d'icônes, widgets, dock. Anneau de focus **blanc** de 3 px avec liseré sombre, visible sur le fond coloré.
- **Pile de navigation** : grand titre qui se réduit, bouton de retour avec le titre de l'écran précédent, glissement depuis le bord gauche, Échap ou Précédent pour revenir. La barre « accueil » ferme l'application.
- **Widget Vibecoding (bureau)** : en haut à droite, en verre, derrière les fenêtres ; deux liens directs vers les projets (nouvel onglet). Sur téléphone, un widget équivalent de l'accueil ouvre la carte Vibecoding, première des Hobbies.
- **Fenêtres (bureau)** : barre de titre translucide, Échap ferme et rend le focus au dock.
- **Cartes Hobbies** : illustration `img/hobby-*.svg` provisoire (en attendant les photos), légende lisible sur l'image.
- **Boutons et liens** : vrais `<button>` et `<a>`, jamais de `div` cliquable. Focus avec contour de 3 px.
- **Bascule de thème** : `aria-pressed`, respecte le thème système par défaut.

## Mouvement
- Transitions courtes sur couleur, ombre et transformation (pile de navigation, ouverture des fenêtres).
- Tout est désactivé sous `prefers-reduced-motion: reduce`. Aucun geste obligatoire.
- Aucune animation automatique de plus de 5 secondes.

## Références et licences
On reprend des **conventions** (verre dépoli, pile de navigation, grille d'icônes), pas des éléments protégés :
- **Interdit** : SF Symbols, police SF Pro hébergée ou distribuée, logos et marques Apple, noms « iOS », « iPhone » ou « Apple » dans l'interface (la seule mention factuelle, « sur iOS et Android » dans une réalisation, décrit un livrable réel), logos de marques tierces, faux horodatages.
- **Autorisé** : icônes SVG dessinées maison, polices système appelées par leur nom, conventions des Human Interface Guidelines.
- Le site doit garder une identité propre (nom, couleurs, contenu) et ne pas passer pour un produit Apple.
