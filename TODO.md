# Ce qu'il reste à faire

## Priorité 1 — bloquant pour un mandatory "PARFAIT"


- [ ] **Cliquer manuellement dans l'app, au moins une fois, chaque parcours** —
      la logique backend a été testée via l'API, mais jamais l'écran
      correspondant :
  - Playlist Editor avec 2 comptes en même temps (vérifier le temps réel)
  - Système d'amis (demande, acceptation)
  - Changement d'abonnement free/paid
  - Mode offline réel : couper le wifi, voter/ajouter un morceau, remettre
    le wifi, vérifier que ça se synchronise

## Priorité 2 — fortement recommandé

- [ ] **Vrai son (optionnel — pas une exigence du sujet).** Le sujet ne dit
      *jamais explicitement* "tu dois jouer de l'audio" — aucune ligne avec
      un critère technique là-dessus. Actuellement, "suggérer un morceau" =
      juste un titre/artiste en texte libre ; rien ne joue. C'est une
      suggestion perso (le vocabulaire "is played earlier", "music control",
      "radio stations" évoque une vraie expérience musicale, et ça rend la
      démo plus parlante en soutenance) — pas un point qui coûte des points
      sur la grille du sujet. À faire seulement si tu as le temps. Options :
      lecteur audio simple (`just_audio` + URL mp3), ou intégration Deezer
      (recherche + extraits 30s réels, pas besoin de compte payant).

- [ ] **Tester l'iBeacon avec un vrai beacon** (ou un second téléphone en mode
      simulateur BLE) si possible — jamais testé en pratique, seulement le
      code écrit.