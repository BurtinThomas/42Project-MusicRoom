# Ce qu'il reste à faire

## Priorité 1 — bloquant pour un mandatory "PARFAIT"

- [ ] **Compiler et lancer l'app sur un vrai simulateur/device Android.**
      Jusqu'ici, seul le build web a été testé (cette machine n'a pas le SDK
      Android). Le sujet demande Android **ou** iOS — on a choisi Android, le
      web n'est que le bonus VI.1. Il faut installer Android Studio et
      vérifier que `flutter run` marche réellement sur la plateforme choisie.

- [ ] **Ajouter la config native manquante** pour les plugins qui en ont besoin :
  - Android : permissions Bluetooth/localisation dans `AndroidManifest.xml`
    (pour l'iBeacon), config Google Sign-In
  - Sans ça, ces fonctionnalités vont planter sur un vrai device même si le
    reste de l'app tourne.

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

## Priorité 3 — finitions

- [ ] Messages d'erreur affichés à l'utilisateur : actuellement souvent les
      messages bruts du serveur, pas toujours clairs/traduits.
