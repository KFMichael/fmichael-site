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
Dégradé abstrait en trois taches radiales (bleu, violet, rose en clair ; versions assombries en sombre), défini par `--wall` (téléphone) et `--wp-1..3` / `--wp-base` (bureau). Pas de photo pour l'instant (voir l'issue #6).

**Mettre tes photos** : deux emplacements, un pour l'écran verrouillé (`--lock-photo`) et un pour le bureau (`--desk-photo`), chacun avec son voile (`--lock-veil`, `--desk-veil`). Dans `css/os.css`, bloc `#os` :
1. copie la photo dans `img/` (WebP, environ 2000 px de large, moins de 400 Ko) ;
2. renseigne `--lock-photo` avec l'adresse de l'image, écrite `url("../img/wallpaper-lock.webp")` (idem pour `--desk-photo`) ;
3. renseigne le voile qui garde le texte lisible : `--lock-veil: linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55))` (idem `--desk-veil`). Un voile de 0,55 garantit 4,5:1 pour du texte blanc, même sur une photo claire ;
4. vérifie `npm run check:site` (il échoue si le fichier manque) puis axe.
La photo couvre tout l'écran (`cover`, centrée). Les dégradés restent dessous comme repli.

**Photo cadrée du bureau** : remplace `img/desk-photo.svg` dans `index.html` (`figure.desk-photo`) par ta photo et décris-la dans `alt` (aujourd'hui `alt=""`, car l'illustration est provisoire).

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
- **Séquence des notifications** : elles arrivent une à une (fondu, glissement de 1,1 rem, légère élasticité), à 0,6 s, 1,7 s et 2,8 s, une seule fois (moins de 5 s au total), sans décalage de mise en page. Tout est visible immédiatement sous `prefers-reduced-motion`.
- **Plein écran** : bouton « Plein écran » sur l'écran verrouillé et dans la barre de menus, jamais automatique.
- **Écran verrouillé** : heure réelle, 3 notifications cliquables, bouton « Entrer ».
- **Accueil (téléphone)** : grille d'icônes, widgets, dock. Anneau de focus **blanc** de 3 px avec liseré sombre, visible sur le fond coloré.
- **Pile de navigation** : grand titre qui se réduit, bouton de retour avec le titre de l'écran précédent, glissement depuis le bord gauche, Échap ou Précédent pour revenir. La barre « accueil » ferme l'application.
- **Dock** : icônes qui grossissent près de la souris (échelle jusqu'à 1,55, décalage pour rester centrées, aucun changement de mise en page), coupé sous `prefers-reduced-motion`, sur écran tactile et au clavier.
- **Widgets du bureau** : en haut à droite, en verre, derrière les fenêtres. Vibecoding (deux liens directs vers les projets), Disponibilité (statut et bouton de rendez-vous) puis Réalisations (les 4 boutiques Shopify, mêmes liens que la section Réalisations), liens en nouvel onglet. Sous 820 px de haut, le widget Réalisations, le plus long, se masque (les liens restent dans la fenêtre Réalisations). Sur téléphone, un widget équivalent de l'accueil ouvre la carte Vibecoding, première des Hobbies.
- **Barre de menus (bureau)** : menu à ton nom (brand, en gras), nom de l'application active, menu « Fenêtre ». Menus déroulants quasi opaques (96 %, le flou ne traverse pas la barre qui a déjà le sien), éléments de 32 px, surbrillance en `--accent`, coche pour les options activées, éléments désactivés à 55 % d'opacité (`aria-disabled`).
- **À propos de ce site** : boîte modale de 22 rem, centrée, en verre presque opaque (94 %), logo dessiné, nom, rôle, mention de non-affiliation, tableau des raccourcis (`kbd`), bouton OK en `--accent`. Opaque sous `prefers-reduced-transparency`, bordure pleine sous `prefers-contrast: more`.
- **Menus Fichier, Présentation, Aide et menu contextuel** : même recette que les autres menus (96 %, éléments de 32 px). Le menu Fichier se reconstruit à l'ouverture d'après les liens de la fenêtre active, avec « (nouvel onglet) » pour les lecteurs d'écran ; le menu contextuel du bureau (clic droit sur le fond seulement, pas sur les fenêtres, le dock ou les widgets) est à 99 % pour que rien ne transparaisse.
- **Version express** (`express.html`) : une page courte sur le style de la page classique (mêmes tokens, thème clair ou sombre selon le système, aucun JavaScript) : titre, statut et rendez-vous, quatre chiffres clés en cartes (`.stats`), outils en pastilles groupées (`.tool-groups`), parcours en une ligne par poste (`.brief`), certifications, contact. Sur l'écran verrouillé, le lien « Version express » a le même aspect que les boutons (`a.lock-btn`).
- **Ouvrir sur mon téléphone** : même boîte modale que « À propos » (classe `.about`, fabrique `makeModal` dans `js/os.js` : Échap, OK ou clic à côté ferment, Tab reste dans la boîte, focus rendu à l'élément d'origine). Le code QR (`.qr-img`) est toujours noir sur blanc, en thème clair comme sombre, avec sa marge blanche : c'est ce qui le rend lisible. Liens « PNG · SVG » pour imprimer.
- **Centre de contrôle** : menu (`role="menu"`, cases à cocher) aligné à droite sous l'icône des réglages de la barre de menus ; il reprend le thème, le plein écran et la version classique du menu à ton nom.
- **Recherche** : panneau centré en haut (34 rem), presque opaque (94 %), champ de 44 px, groupes « Applications », « Actions », « Liens » (étiquettes en majuscules discrètes), ligne active en `--accent`, indice à droite. Pas de flou imbriqué (le fond du panneau est déjà quasi opaque). Un message « Aucun résultat » et une annonce `role="status"` donnent le nombre de résultats.
- **Fenêtres (bureau)** : barre de titre translucide, Échap ferme et rend le focus au dock. Boutons à gauche : rouge (fermer), jaune (réduire dans le dock, point sous l'icône), vert (agrandir) ; double-clic sur la barre de titre = agrandir ou restaurer. Fenêtre inactive : boutons gris (couleurs au survol ou au focus) et ombre plus légère ; redimensionnement par le bord droit, le bas et le coin, ou Alt + Maj + flèches au clavier.
- **Cartes Hobbies** : illustration `img/hobby-*.svg` provisoire (en attendant les photos), légende lisible sur l'image.
- **Page 404** (`404.html`) : autonome (styles intégrés, chemins absolus), même verre sur dégradé, non indexée.
- **Image de partage** : `img/share.png` (1200×630), utilisée par les balises Open Graph.
- **Boutons et liens** : vrais `<button>` et `<a>`, jamais de `div` cliquable. Focus avec contour de 3 px.
- **Bascule de thème** : `aria-pressed`, respecte le thème système par défaut.

## Mouvement
- **Dock** : rebond de l'icône à la première ouverture (700 ms, deux sauts décroissants), réduction et retour de la fenêtre le long du trajet vers l'icône (320 ms, déplacement et rétrécissement à 12 %). Variables `--mdx` / `--mdy` calculées à chaque fois d'après la position de l'icône. Sous `prefers-reduced-motion`, aucune de ces animations : la fenêtre est réduite et rouverte tout de suite.
- Transitions courtes sur couleur, ombre et transformation (pile de navigation, ouverture des fenêtres).
- Tout est désactivé sous `prefers-reduced-motion: reduce`. Aucun geste obligatoire.
- Aucune animation automatique de plus de 5 secondes.

## Références et licences
Le bureau suit une **identité macOS** (décision de Michaël) et le téléphone les conventions iOS. On reprend des **conventions** (verre dépoli, pile de navigation, grille d'icônes), pas des éléments protégés :
- **Décision de Michaël (28 octobre 2026)** : les limites de licence sont levées pour le bureau, risque accepté en connaissance de cause, sans avis juridique. Autorisé : noms d'apps macOS (Finder, Safari, Pages, Photos, Mail, Calendrier), logo Apple dessiné en SVG maison, icônes dessinées maison proches des SF Symbols, comportements macOS.
- **Toujours interdit** : tout fichier Apple dans le dépôt (police SF Pro, SF Symbols) sauf s'il les fournit lui-même, logos de marques tierces, faux horodatages, et se faire passer pour Apple : le pied de page indique « sans lien avec Apple ».
- **Polices** : pile `-apple-system, BlinkMacSystemFont, system-ui` (la vraie SF Pro sur Mac et iPhone, une police système proche ailleurs).
- Le mode téléphone garde les conventions iOS, sans noms de marques.

## Directions testées et abandonnées
- **Design éditorial** (angles droits, aplats de couleur, titres en empattement, listes séparées par des filets, ni verre ni dégradés), testé le 26 octobre 2026 puis **refusé par Michaël** : ne pas le reproposer. Pour le retrouver :
  - commit du restyle : `cc0d0f9b679f51d206946cf0109e9bc75b482299` ;
  - tête de la branche `design-editorial` : `f17fda6` (elle ajoute au restyle quelques correctifs déjà repris dans `main`) ;
  - la PR #23, fermée sans fusion, garde ce code même si la branche est supprimée : `git fetch origin refs/pull/23/head` puis `git show cc0d0f9`.
  Les autres commits de cette branche sont déjà dans `main` (PR #24, sans le restyle).
