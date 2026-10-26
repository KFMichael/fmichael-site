# Plan : mode téléphone (à valider par Michaël avant publication)

Référence : le mobile de frvky.online (écran verrouillé plein écran, photo de fond, notifications empilées, « Swipe up to unlock »). Même esprit, identité propre.

## État au 26/10/2026
- Mode bureau (écrans ≥ 900×560 px) : fait, sur la branche `bureau-interactif`. Pas encore fusionné dans `main`.
- `main` (site en ligne sur https://fmichael.cloud) : version classique avec parcours, travail, hobbies, contact.
- Mode téléphone (écrans < 900×560 px, ou zoom élevé) : construit sur la branche `claude/blissful-planck-picobc` (classe `html.phone-mode`, mêmes fichiers `os.js` / `os.css` que le bureau). Pas encore fusionné dans `main`, en attente du « go » de Michaël.
- Décisions par défaut retenues : fond en dégradé abstrait (Michaël cherche de meilleures images) ; zoom 200 % sur ordinateur = mode téléphone, avec « Version classique » en secours.

## Construit (à valider)
1. **Écran verrouillé plein écran** : heure réelle, 3 notifications cliquables (parcours, disponibilité, boutiques Shopify), bouton « Entrer » en bas. Glisser vers le haut possible, jamais obligatoire.
2. **Écran d'accueil** : grille d'icônes (Parcours, Travail, Disponibilité, Hobbies, Contact, LinkedIn, GitHub) + dock.
3. **Applications en plein écran** avec bouton « Retour ». Le bouton Précédent du navigateur ferme l'application ouverte (History API).
4. Contenus copiés depuis la page classique (un seul texte à maintenir), comme pour les fenêtres du bureau.

## Accessibilité à garder
- Cibles tactiles ≥ 44 px, zoom non bloqué, marges `env(safe-area-inset-*)`.
- « Version classique » toujours visible et mémorisée.
- Vrais boutons, `inert` sur ce qui est masqué, focus géré à l'ouverture et à la fermeture.
- `prefers-reduced-motion` : animations coupées.
- Aucun geste obligatoire, pas de faux horodatages, pas de logos de marques tierces.

## Questions ouvertes
- Photo de fond : une photo de Michaël (publique) ou le dégradé abstrait actuel ? Sans réponse, on garde le dégradé.
- Zoom à 200 % sur ordinateur : bascule en mode téléphone (avec « Version classique » en secours). Michaël doit confirmer.

## Méthode
- Partir de `bureau-interactif`, tester à 320, 375 et 430 px de large.
- Montrer des captures (verrouillage, accueil, une application), puis attendre le « go » avant de fusionner dans `main`.

## Notes d'implémentation
- Un seul balisage `#os` : l'écran d'accueil copie les icônes du dock (un seul endroit à maintenir) ; dans le dock, seuls 4 raccourcis restent visibles en mode téléphone.
- Une seule application ouverte à la fois, plein écran. « Retour », Échap et le bouton Précédent du navigateur appellent la même fermeture.
- Glisser vers le haut (événements `touch`) déverrouille ; « Entrer » reste toujours disponible.
- Correction au passage : « LUN » et le numéro du jour étaient écrits en dur ; ils suivent maintenant la date réelle.
- Le bouton « Mode bureau » / « Mode téléphone » du mode classique est maintenant visible sur tous les écrans.
- Tests faits (Chromium émulé, 320 / 375 / 430 px) : verrouillage, accueil, application, Précédent, Échap, bascule classique, redimensionnement. Lighthouse (mobile et bureau : 100 / 100 / 96 / 100, le 96 vient de l'absence de `favicon.ico`) et axe (0 violation, clair et sombre, tous les écrans) : OK. Pas encore fait : essai sur un vrai téléphone.

## Contenu mis à jour après la première livraison
- Statut : « En mission, indisponible pour le moment » partout (accroche, contact, notification, widget, application Disponibilité). L'ancienne grille de calendrier est supprimée.
- Hobbies : cartes photo avec illustrations provisoires `img/hobby-*.svg` à remplacer par les photos de Michaël.
- Travail : liste des domaines et nouvelle carte « Site portfolio, Mirielle Rohr ».

## Refonte « Human Interface Guidelines » (web)
- Couleurs sémantiques, texte relatif et Dynamic Type, mode sombre, contraste renforcé, transparence réduite, animations réduites.
- Pile de navigation : Travail passe en liste puis détail, avec le titre de l'écran précédent dans le bouton de retour.
- Dates des expériences ajoutées sur les cartes Travail (reprises de la frise Parcours : 2020–2026, 2022–aujourd'hui, 2017–2019, 2019–2020). La carte portfolio n'a pas de date : à compléter si Michaël la donne.
- Correctif trouvé par les tests : sur le bureau, après Échap, le focus revient bien sur l'icône du dock.

## Parcours et Réalisations (décision de Michaël : option C)
- Parcours = le CV : une ligne par poste (dates, titre, entreprise), puis formation, certifications, langues. Omnilog garde sa phrase, il n'a pas de réalisation.
- « Travail » devient **Réalisations** : contexte, rôle, résultat, avec la période. Les détails qui n'étaient que dans la frise (équipe de 9, mentorat, 12 développeurs et 4 QA, SAP Hybris, louisvuitton.com et DSI) y sont repris.
- Les identifiants internes (`#travail`, `data-app="travail"`) ne changent pas : les liens existants restent valables.

## Reste à faire hors code
- Vérifier que `k@fmichael.cloud` reçoit bien un mail envoyé depuis une autre adresse (Cloudflare → Email Routing → Activity log).
- Supprimer l'enregistrement DNS `AAAA` vers IONOS s'il est encore là, puis cocher « Enforce HTTPS » dans GitHub Pages.
