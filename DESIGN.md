# Charte visuelle

Direction : **éditoriale**, humaine, sobre. Papier crème et encre, angles droits, filets fins, aplats. Pas de dégradé, pas de flou ni de verre, pas de pilules ni d'icônes arrondies. On garde de frvky.online l'idée d'un site avec une personnalité (écran verrouillé, bureau, applications), pas sa mise en scène arrondie.

## Couleurs (tokens, dans `css/style.css`)
| Token | Clair | Sombre | Usage |
|---|---|---|---|
| `--bg` | `#f4efe4` | `#1c1b18` | fond (papier crème / anthracite) |
| `--surface` | `#fbf8f1` | `#24231f` | fenêtres, encarts |
| `--text` | `#1b1a17` | `#f1ece0` | texte principal, filets forts |
| `--muted` | `#55514a` | `#b9b3a5` | texte secondaire |
| `--accent` | `#a3341a` | `#e8896e` | liens, boutons, état actif (vermillon) |
| `--border` | `#cfc7b6` | `#3a3832` | filets fins |
| `--radius` | `0` | `0` | angles droits partout |

Contrastes à contrôler à chaque changement : texte sur fond ≥ 4,5:1, accent sur fond ≥ 4,5:1 (`npm run test:a11y`).

## Typographie
- Titres : pile à empattements du système, `var(--serif)` = `"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif`.
- Corps : `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. Aucune police externe.
- Corps : 1,125 rem, interligne 1,6. Titres : 600, interligne 1,2.
- Largeur de ligne maximale : 70 caractères (`max-width: 70ch`).

## Espacement et mise en page
- Échelle : 0,5 / 1 / 1,5 / 2 / 3 / 5 rem.
- Conteneur : 64 rem maximum, gouttière 1,25 rem.
- Desktop : navigation en en-tête fixe, sections en grille 12 colonnes légère. Mobile : une colonne.

## Composants
- **Lien d'évitement** : visible au focus, en haut à gauche.
- **Navigation** : liens texte, état courant avec `aria-current="page"` + soulignement (pas la couleur seule).
- **Réalisation** : filet fin en haut, titre `h3` à empattements, période, contexte / rôle / résultat. Photo facultative : `<img class="case-media">` en tête.
- **Bouton** : vrai `<button>` ou `<a>`, angles droits, hauteur 44 px minimum, focus avec contour 3 px.
- **Icônes d'applications** : carrés à filet, pictogramme au trait, dessinés maison (pas de logos de marques).
- **Bascule de thème** : bouton avec `aria-pressed`, respecte le thème système par défaut.

## Mouvement
- Transitions courtes (150 ms) sur couleur et ombre uniquement.
- Tout est désactivé sous `prefers-reduced-motion: reduce`.
