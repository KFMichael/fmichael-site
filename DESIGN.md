# Charte visuelle

Direction : sobre, lisible, un peu éditoriale. On garde de frvky.online l'idée d'un site qui a une personnalité, mais pas la mise en scène « écran de verrouillage ».

## Couleurs (tokens)
| Token | Clair | Sombre | Usage |
|---|---|---|---|
| `--bg` | `#fafaf7` | `#111315` | fond |
| `--surface` | `#ffffff` | `#1a1d20` | cartes |
| `--text` | `#16181a` | `#f1f1ee` | texte principal |
| `--muted` | `#4a5056` | `#b4b9be` | texte secondaire |
| `--accent` | `#1d4ed8` | `#8fb0ff` | liens, boutons |
| `--border` | `#d9dbd6` | `#2c3034` | filets |

Contrastes à contrôler à chaque changement : texte sur fond ≥ 4,5:1, accent sur fond ≥ 4,5:1.

## Typographie
- Pile système : `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` (aucune police externe, rapide et sans dépendance).
- Corps : 1,125 rem, interligne 1,6. Titres : 700, interligne 1,2.
- Largeur de ligne maximale : 70 caractères (`max-width: 70ch`).

## Espacement et mise en page
- Échelle : 0,5 / 1 / 1,5 / 2 / 3 / 5 rem.
- Conteneur : 64 rem maximum, gouttière 1,25 rem.
- Desktop : navigation en en-tête fixe, sections en grille 12 colonnes légère. Mobile : une colonne.

## Composants
- **Lien d'évitement** : visible au focus, en haut à gauche.
- **Navigation** : liens texte, état courant avec `aria-current="page"` + soulignement (pas la couleur seule).
- **Carte projet** : titre `h3`, résumé, étiquettes, lien explicite.
- **Bouton** : vrai `<button>` ou `<a>`, hauteur 44 px minimum, focus avec contour 3 px.
- **Bascule de thème** : bouton avec `aria-pressed`, respecte le thème système par défaut.

## Mouvement
- Transitions courtes (150 ms) sur couleur et ombre uniquement.
- Tout est désactivé sous `prefers-reduced-motion: reduce`.
