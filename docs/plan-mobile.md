# Plan : mode téléphone (à valider par Michaël avant publication)

Référence : le mobile de frvky.online (écran verrouillé plein écran, photo de fond, notifications empilées, « Swipe up to unlock »). Même esprit, identité propre.

## État au 26/10/2026
- Mode bureau (écrans ≥ 900×560 px) : fait, sur la branche `bureau-interactif`. Pas encore fusionné dans `main`.
- `main` (site en ligne sur https://fmichael.cloud) : version classique avec parcours, travail, hobbies, contact.
- Mode téléphone (écrans < 900 px) : à construire. Aujourd'hui, le mobile affiche la page classique.

## À construire
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

## Reste à faire hors code
- Vérifier que `k@fmichael.cloud` reçoit bien un mail envoyé depuis une autre adresse (Cloudflare → Email Routing → Activity log).
- Supprimer l'enregistrement DNS `AAAA` vers IONOS s'il est encore là, puis cocher « Enforce HTTPS » dans GitHub Pages.
