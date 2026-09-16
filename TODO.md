# Ce qu'il reste à faire

Bilan honnête au 16/09. Le code est écrit pour 100% des fonctionnalités du sujet
(mandatory + 4 bonus), mais "écrit" ne veut pas dire "vérifié qui marche
vraiment" ni "conforme à 100% à ce qu'un correcteur attend". Voir le détail
plus bas pour le pourquoi de chaque case.

## Priorité 1 — bloquant pour un mandatory "PARFAIT"

Le sujet est explicite : **le bonus n'est même évalué que si le mandatory est
parfait**. Ces points sont ceux qui peuvent faire échouer le mandatory.

- [ ] **Compiler et lancer l'app sur un vrai simulateur/device Android ou iOS.**
      Jusqu'ici, seul le build web a été testé (cette machine n'a ni SDK
      Android ni Xcode complet). Le sujet demande Android **ou** iOS — le web
      n'est que le bonus VI.1. Il faut installer Android Studio (ou Xcode) et
      vérifier que `flutter run` marche réellement sur la plateforme choisie.

- [ ] **Ajouter la config native manquante** pour les plugins qui en ont besoin :
  - Android : permissions Bluetooth/localisation dans `AndroidManifest.xml`
    (pour l'iBeacon), config Google Sign-In
  - iOS : URL scheme dans `Info.plist` (Google Sign-In), `FacebookAppID` /
    `FacebookClientToken` (Facebook Login)
  - Sans ça, ces fonctionnalités vont planter sur un vrai device même si le
    reste de l'app tourne.

- [ ] **Créer de vrais comptes développeur Google + Facebook** et remplir
      `backend/.env` (`GOOGLE_CLIENT_ID`, `FACEBOOK_APP_ID`, etc.), puis
      tester une vraie connexion sociale de bout en bout. Jamais testé —
      seul le flow email/password a été vérifié en réel.

- [ ] **Remettre des tests unitaires**, même minimes. Le sujet V.8 le demande
      explicitement ("set specific one-off tests for each layer"). Ils ont
      été supprimés sur demande pendant le nettoyage — au moins la logique
      de concurrence (vote, réordonnancement de playlist) mériterait d'être
      re-testée.

- [ ] **Cliquer manuellement dans l'app, au moins une fois, chaque parcours** —
      la logique backend a été testée via l'API, mais jamais l'écran
      correspondant :
  - Playlist Editor avec 2 comptes en même temps (vérifier le temps réel)
  - Control Delegation (déléguer un device à un ami, vérifier que ça marche)
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

- [ ] **Repasser le PDF du sujet ligne par ligne ensemble** pour vérifier
      qu'aucun détail de license/visibilité n'a été loupé dans les 3
      services.

## Priorité 3 — finitions

- [ ] Messages d'erreur affichés à l'utilisateur : actuellement souvent les
      messages bruts du serveur, pas toujours clairs/traduits.
- [ ] Icône et nom de l'app : actuellement l'icône par défaut de Flutter.
- [ ] Préparer un support court pour la soutenance (quoi montrer, dans quel
      ordre, comment expliquer les choix techniques).
