# Blood Relay — Plan de réalisation

## 1. Vision du projet

**Blood Relay** est un jeu d’action 2D multijoueur en arènes fermées tenant entièrement sur un seul écran.

Le cœur du gameplay repose sur une règle simple :

> Le sang perdu par les joueurs reste dans l’arène et devient une ressource que n’importe quel joueur peut récupérer pour se soigner.

Chaque tir, coup ou explosion modifie donc à la fois l’état des joueurs et l’économie de l’arène.

Le jeu doit être :

- immédiatement compréhensible ;
- nerveux et spectaculaire ;
- jouable en sessions très courtes ;
- lisible malgré le chaos ;
- rétro dans sa direction artistique ;
- moderne dans ses effets visuels, son animation et son rendu ;
- amusant en multijoueur local dès le premier prototype ;
- extensible vers du multijoueur en ligne après validation du concept.

---

# 2. Principes de conception

## 2.1 Piliers du jeu

### Action immédiate

Une partie doit commencer en quelques secondes.

Le joueur doit comprendre rapidement :

- comment se déplacer ;
- comment tirer ;
- comment récupérer du sang ;
- comment se soigner ;
- comment éliminer un adversaire.

### Sang comme ressource

Le sang ne doit pas être seulement décoratif.

Il doit servir à :

- visualiser les dégâts ;
- créer des zones d’intérêt ;
- provoquer des prises de risque ;
- permettre des retournements de situation ;
- modifier la circulation dans l’arène ;
- créer des choix entre attaque, défense et récupération.

### Arènes sur un écran

Chaque niveau tient dans l’écran sans défilement.

Cela garantit :

- une lecture immédiate ;
- une vision constante des autres joueurs ;
- des parties courtes ;
- une forte densité d’action ;
- une production de niveaux raisonnable.

### Rétro modernisé

Le jeu doit combiner :

- sprites et animations rétro ;
- silhouettes simples ;
- palettes limitées ;
- éclairage moderne ;
- particules ;
- déformations ;
- traces de sang ;
- ralentis très courts ;
- son et vibrations percutants.

### Multijoueur d’abord

Le jeu doit être conçu autour des interactions entre joueurs.

Le mode solo et les bots sont secondaires.

---

# 3. Périmètre du MVP

Le MVP doit permettre de vérifier une seule hypothèse :

> Est-ce que les joueurs se battent réellement pour récupérer le sang présent dans l’arène ?

Le MVP comprend :

- une arène ;
- deux à quatre joueurs locaux ;
- deux personnages visuellement distincts ;
- deux armes ;
- déplacement ;
- saut ;
- attaque de mêlée ;
- tir ;
- esquive ;
- système de vie ;
- perte de sang ;
- flaques récupérables ;
- réserve de sang ;
- transfusion ;
- mort ;
- réapparition ;
- score ;
- clavier ;
- manettes ;
- un mode chacun pour soi ;
- effets visuels et sonores minimaux ;
- écran de lancement ;
- écran de fin de manche.

Le MVP ne comprend pas :

- multijoueur en ligne ;
- campagne ;
- progression ;
- comptes ;
- cosmétiques ;
- classement global ;
- éditeur de niveaux ;
- destruction avancée ;
- vraie simulation de fluide ;
- démembrement complet ;
- bots sophistiqués ;
- narration ;
- plusieurs dizaines d’armes.

---

# 4. Stack technique recommandée

## 4.1 Technologies

- TypeScript ;
- Vite ;
- Phaser 3 ;
- WebGL ;
- Web Audio API ;
- Gamepad API ;
- Vitest pour les tests unitaires ;
- Playwright pour les tests de lancement et d’interface ;
- ESLint ;
- Prettier.

## 4.2 Architecture générale

```text
src/
├── app/
│   ├── bootstrap/
│   ├── config/
│   └── game/
├── core/
│   ├── events/
│   ├── math/
│   ├── time/
│   └── utils/
├── gameplay/
│   ├── actors/
│   ├── blood/
│   ├── combat/
│   ├── health/
│   ├── movement/
│   ├── pickups/
│   ├── scoring/
│   └── weapons/
├── input/
│   ├── gamepad/
│   ├── keyboard/
│   └── profiles/
├── presentation/
│   ├── audio/
│   ├── camera/
│   ├── effects/
│   ├── hud/
│   ├── particles/
│   └── screens/
├── scenes/
│   ├── BootScene.ts
│   ├── MenuScene.ts
│   ├── ArenaScene.ts
│   └── ResultsScene.ts
├── content/
│   ├── arenas/
│   ├── characters/
│   └── weapons/
└── tests/
```

## 4.3 Contraintes techniques

- conserver une logique de gameplay indépendante du rendu autant que possible ;
- utiliser des données déclaratives pour les armes et les arènes ;
- éviter les dépendances inutiles ;
- prévoir les entrées locales dès le début ;
- maintenir 60 images par seconde sur une machine modeste ;
- limiter les allocations pendant une manche ;
- utiliser des pools pour les particules et projectiles ;
- éviter toute vraie simulation de liquide au MVP.

---

# 5. Phases de réalisation du MVP

# Phase 0 — Préparation du projet

## Objectif

Obtenir un dépôt propre, exécutable et prêt à accueillir le gameplay.

## Tâches

- [ ] Créer le dépôt Git.
- [ ] Initialiser Vite avec TypeScript.
- [ ] Ajouter Phaser 3.
- [ ] Configurer ESLint.
- [ ] Configurer Prettier.
- [ ] Configurer Vitest.
- [ ] Configurer Playwright.
- [ ] Ajouter les scripts `dev`, `build`, `test`, `lint` et `format`.
- [ ] Créer l’arborescence initiale.
- [ ] Ajouter un fichier de configuration globale.
- [ ] Ajouter une scène de démarrage.
- [ ] Ajouter une scène d’arène vide.
- [ ] Ajouter un écran temporaire affichant la version du jeu.
- [ ] Ajouter un README minimal.
- [ ] Ajouter une licence.
- [ ] Configurer GitHub Actions pour vérifier le build et les tests.
- [ ] Configurer le déploiement statique.
- [ ] Vérifier le lancement sur desktop.
- [ ] Vérifier le lancement dans Chrome, Edge et Firefox.

## Critères de validation

- Le jeu démarre avec `npm run dev`.
- Le build de production fonctionne.
- Les tests s’exécutent.
- La scène d’arène vide s’affiche.
- Le dépôt est déployable sur GitHub Pages ou Vercel.

---

# Phase 1 — Boucle de jeu minimale

## Objectif

Créer une arène jouable avec deux personnages capables de se déplacer.

## Tâches

### Arène

- [ ] Créer une arène fixe de référence.
- [ ] Définir ses limites.
- [ ] Ajouter un sol.
- [ ] Ajouter deux plateformes.
- [ ] Ajouter deux points d’apparition.
- [ ] Ajouter les collisions avec le décor.
- [ ] Empêcher la sortie de l’écran.
- [ ] Ajouter un fond temporaire.
- [ ] Ajouter une grille de debug facultative.

### Joueurs

- [ ] Créer une classe ou entité `Player`.
- [ ] Ajouter une configuration par joueur.
- [ ] Ajouter la position.
- [ ] Ajouter la vélocité.
- [ ] Ajouter la direction regardée.
- [ ] Ajouter l’état au sol.
- [ ] Ajouter l’état en l’air.
- [ ] Ajouter l’état mort.
- [ ] Ajouter les collisions joueur-décor.
- [ ] Ajouter les collisions joueur-joueur.
- [ ] Ajouter une animation temporaire d’attente.
- [ ] Ajouter une animation temporaire de course.
- [ ] Ajouter une animation temporaire de saut.

### Déplacement

- [ ] Ajouter le déplacement horizontal.
- [ ] Ajouter l’accélération.
- [ ] Ajouter la décélération.
- [ ] Ajouter le saut.
- [ ] Ajouter la chute.
- [ ] Ajouter la descente à travers les plateformes.
- [ ] Ajouter une esquive courte.
- [ ] Ajouter un temps de recharge à l’esquive.
- [ ] Ajouter une courte invulnérabilité pendant l’esquive si nécessaire.
- [ ] Ajouter un indicateur visuel temporaire de recharge.

### Caméra

- [ ] Fixer la caméra sur l’arène entière.
- [ ] Empêcher tout défilement.
- [ ] Ajouter un léger recul de caméra lors d’un impact de test.
- [ ] Ajouter un système de secousse paramétrable.

## Critères de validation

- Deux joueurs peuvent se déplacer simultanément.
- Les joueurs restent toujours visibles.
- Les collisions sont stables.
- Le saut et l’esquive sont réactifs.
- Aucun joueur ne peut quitter l’arène.

---

# Phase 2 — Gestion des entrées multijoueur locales

## Objectif

Permettre à deux à quatre joueurs de rejoindre et jouer avec clavier ou manettes.

## Tâches

- [ ] Créer une abstraction `InputProfile`.
- [ ] Définir les actions standards.
- [ ] Ajouter déplacement gauche et droite.
- [ ] Ajouter saut.
- [ ] Ajouter descente.
- [ ] Ajouter tir.
- [ ] Ajouter mêlée.
- [ ] Ajouter esquive.
- [ ] Ajouter transfusion.
- [ ] Ajouter interaction.
- [ ] Ajouter un profil clavier joueur 1.
- [ ] Ajouter un profil clavier joueur 2.
- [ ] Ajouter le support Gamepad API.
- [ ] Détecter les manettes connectées.
- [ ] Associer automatiquement une manette à un joueur.
- [ ] Ajouter un écran de connexion des joueurs.
- [ ] Ajouter l’action « rejoindre ».
- [ ] Ajouter l’action « quitter ».
- [ ] Ajouter un indicateur de périphérique.
- [ ] Ajouter une gestion simple du remappage.
- [ ] Ajouter une zone morte configurable pour les sticks.
- [ ] Ajouter la vibration sur manette.
- [ ] Tester avec deux manettes simultanées.
- [ ] Tester avec clavier et manette.
- [ ] Tester avec quatre périphériques.

## Critères de validation

- Quatre joueurs peuvent rejoindre une partie.
- Chaque périphérique contrôle un seul joueur.
- Une déconnexion de manette ne bloque pas le jeu.
- Les entrées sont suffisamment réactives pour un jeu d’action.

---

# Phase 3 — Combat de base

## Objectif

Permettre aux joueurs de se blesser, se repousser et s’éliminer.

## Tâches

### Santé

- [ ] Créer un composant `Health`.
- [ ] Définir la vie maximale.
- [ ] Ajouter les dégâts.
- [ ] Ajouter la mort.
- [ ] Ajouter une courte invulnérabilité après apparition.
- [ ] Ajouter une courte invulnérabilité après un impact si nécessaire.
- [ ] Ajouter un événement `playerDamaged`.
- [ ] Ajouter un événement `playerKilled`.
- [ ] Ajouter un événement `playerRespawned`.

### Arme principale

- [ ] Créer une interface `Weapon`.
- [ ] Ajouter une configuration JSON ou TypeScript par arme.
- [ ] Créer le revolver lourd.
- [ ] Ajouter le projectile.
- [ ] Ajouter la vitesse du projectile.
- [ ] Ajouter les dégâts.
- [ ] Ajouter le recul.
- [ ] Ajouter le temps entre deux tirs.
- [ ] Ajouter un flash de bouche.
- [ ] Ajouter un son temporaire.
- [ ] Ajouter une collision projectile-décor.
- [ ] Ajouter une collision projectile-joueur.
- [ ] Ajouter une destruction automatique du projectile.
- [ ] Ajouter un pool de projectiles.

### Seconde arme

- [ ] Créer le fusil à pompe.
- [ ] Ajouter plusieurs plombs.
- [ ] Ajouter une dispersion.
- [ ] Ajouter une courte portée efficace.
- [ ] Ajouter un recul élevé.
- [ ] Ajouter une forte projection de la cible.
- [ ] Ajouter un temps de récupération plus long.

### Mêlée

- [ ] Ajouter une attaque de mêlée commune.
- [ ] Ajouter une zone d’impact courte.
- [ ] Ajouter un temps de préparation minimal.
- [ ] Ajouter un recul de la cible.
- [ ] Ajouter une interruption de transfusion.
- [ ] Empêcher le spam.
- [ ] Ajouter un effet temporaire d’impact.

### Mort et réapparition

- [ ] Ajouter une animation de mort temporaire.
- [ ] Désactiver les contrôles à la mort.
- [ ] Ajouter un délai de réapparition.
- [ ] Choisir un point de réapparition sûr.
- [ ] Ajouter une courte invulnérabilité.
- [ ] Ajouter un feedback visuel de retour en jeu.

## Critères de validation

- Les joueurs peuvent se blesser avec les deux armes.
- Le revolver et le fusil à pompe ont des sensations différentes.
- La mêlée est utile sans dominer.
- La mort et la réapparition ne bloquent jamais la manche.
- Les impacts sont lisibles.

---

# Phase 4 — Système de sang

## Objectif

Implémenter la mécanique centrale du jeu.

## Tâches

### Quantité de sang

- [ ] Définir une unité interne de sang.
- [ ] Lier la perte de sang aux dégâts.
- [ ] Limiter la quantité de sang produite par impact.
- [ ] Définir la capacité maximale de réserve.
- [ ] Ajouter une couleur de sang par joueur.
- [ ] Conserver l’identité du propriétaire original.
- [ ] Ajouter une durée de vie du sang au sol.
- [ ] Ajouter un assèchement progressif.

### Projection

- [ ] Créer des particules de projection.
- [ ] Orienter la projection selon l’impact.
- [ ] Adapter la projection à l’arme.
- [ ] Ajouter une projection plus large au fusil à pompe.
- [ ] Ajouter une projection concentrée au revolver.
- [ ] Ajouter des éclaboussures sur les murs.
- [ ] Ajouter des traces temporaires au sol.
- [ ] Utiliser un pool de particules.

### Flaques

- [ ] Créer une entité `BloodPool`.
- [ ] Définir une position.
- [ ] Définir une quantité.
- [ ] Définir une couleur.
- [ ] Définir un propriétaire.
- [ ] Fusionner les flaques proches visuellement.
- [ ] Limiter le nombre maximal de flaques.
- [ ] Ajouter une croissance animée.
- [ ] Ajouter une diminution lors de l’absorption.
- [ ] Ajouter une disparition progressive.
- [ ] Ajouter un shader ou effet de reflet léger.
- [ ] Vérifier que les flaques restent lisibles sur tous les décors.

### Absorption

- [ ] Détecter le contact entre joueur et flaque.
- [ ] Absorber progressivement la quantité disponible.
- [ ] Remplir la réserve du joueur.
- [ ] Réduire la flaque.
- [ ] Arrêter l’absorption quand la réserve est pleine.
- [ ] Ajouter un feedback sonore.
- [ ] Ajouter un feedback visuel.
- [ ] Ajouter un indicateur de réserve.
- [ ] Éviter l’absorption involontaire excessive.
- [ ] Tester l’absorption pendant un saut.
- [ ] Tester l’absorption pendant une esquive.

### Transfusion

- [ ] Ajouter une action de transfusion.
- [ ] Immobiliser ou ralentir fortement le joueur.
- [ ] Bloquer le tir pendant la transfusion.
- [ ] Consommer la réserve progressivement.
- [ ] Restaurer la vie progressivement.
- [ ] Interrompre la transfusion en cas de dégât.
- [ ] Ajouter un temps minimal d’activation.
- [ ] Ajouter un effet visuel distinct.
- [ ] Ajouter un son distinct.
- [ ] Limiter le rendement de la transfusion.
- [ ] Empêcher la guérison au-delà de la vie maximale.

### Hémorragie

- [ ] Définir un seuil critique de vie.
- [ ] Faire perdre de petites quantités de sang.
- [ ] Créer une trace intermittente.
- [ ] Ajouter un feedback visuel au joueur.
- [ ] Ajouter un feedback sonore discret.
- [ ] Arrêter l’hémorragie après transfusion suffisante.
- [ ] Éviter que l’hémorragie rende la partie trop punitive.

## Critères de validation

- Les joueurs comprennent visuellement qu’une flaque peut être récupérée.
- Le sang produit par les attaques modifie les décisions.
- La transfusion expose clairement le joueur.
- Les flaques ne saturent pas l’écran.
- Les performances restent stables.
- La quantité de sang reste cohérente avec les dégâts.

---

# Phase 5 — Règles de manche et score

## Objectif

Transformer le prototype en partie complète avec début, fin et résultat.

## Tâches

- [ ] Créer un gestionnaire de manche.
- [ ] Ajouter un compte à rebours initial.
- [ ] Ajouter une durée de manche configurable.
- [ ] Ajouter le score par élimination.
- [ ] Ajouter une pénalité éventuelle pour suicide.
- [ ] Ajouter une attribution correcte des éliminations.
- [ ] Ajouter un départage en cas d’égalité.
- [ ] Ajouter un écran de résultat.
- [ ] Ajouter un bouton rejouer.
- [ ] Ajouter un bouton retour au menu.
- [ ] Ajouter une série de manches.
- [ ] Ajouter une condition de victoire.
- [ ] Ajouter un affichage du vainqueur.
- [ ] Ajouter un résumé des statistiques.
- [ ] Afficher dégâts infligés.
- [ ] Afficher sang récupéré.
- [ ] Afficher transfusions réussies.
- [ ] Afficher éliminations.
- [ ] Afficher morts.
- [ ] Ajouter un ralenti très court sur la dernière élimination.

## Critères de validation

- Une partie peut être lancée, jouée et terminée sans intervention externe.
- Le vainqueur est toujours déterminé correctement.
- Les joueurs comprennent immédiatement leur score.
- Une nouvelle partie peut être relancée rapidement.

---

# Phase 6 — Interface du MVP

## Objectif

Créer une interface minimale, claire et jouable à distance d’un écran.

## Tâches

### Menu principal

- [ ] Ajouter le logo temporaire.
- [ ] Ajouter le bouton jouer.
- [ ] Ajouter le bouton options.
- [ ] Ajouter le bouton crédits.
- [ ] Ajouter une indication des contrôles.
- [ ] Ajouter un écran de sélection du nombre de joueurs.
- [ ] Ajouter un écran de connexion des joueurs.
- [ ] Ajouter une sélection d’arme.
- [ ] Ajouter une sélection simplifiée d’arène.

### HUD

- [ ] Afficher la vie de chaque joueur.
- [ ] Afficher la réserve de sang.
- [ ] Afficher l’arme.
- [ ] Afficher le score.
- [ ] Afficher le temps restant.
- [ ] Afficher un indicateur d’hémorragie.
- [ ] Afficher un indicateur de transfusion.
- [ ] Afficher les couleurs des joueurs.
- [ ] Garder le centre de l’écran dégagé.
- [ ] Vérifier la lisibilité à 1080p.
- [ ] Vérifier la lisibilité sur un écran portable.

### Options

- [ ] Ajouter le volume général.
- [ ] Ajouter le volume musique.
- [ ] Ajouter le volume effets.
- [ ] Ajouter l’intensité des secousses.
- [ ] Ajouter l’intensité des flashes.
- [ ] Ajouter l’activation ou non de la vibration.
- [ ] Ajouter un mode daltonien initial.
- [ ] Ajouter une option de réduction du sang visuel.
- [ ] Sauvegarder les options en local.

## Critères de validation

- Le jeu est utilisable sans explication orale.
- Le HUD reste lisible pendant les combats.
- Les paramètres d’accessibilité fonctionnent.
- Le menu est utilisable avec une manette.

---

# Phase 7 — Effets visuels et audio du MVP

## Objectif

Donner au prototype une identité suffisamment forte pour être montré.

## Tâches

### Effets visuels

- [ ] Ajouter une palette temporaire cohérente.
- [ ] Ajouter un éclairage simple.
- [ ] Ajouter des flashes d’impact.
- [ ] Ajouter des particules de poussière.
- [ ] Ajouter des étincelles.
- [ ] Ajouter les traces de pas sanglantes.
- [ ] Ajouter une légère distorsion lors des gros impacts.
- [ ] Ajouter un effet de recul de caméra.
- [ ] Ajouter un hit stop très court.
- [ ] Ajouter un ralenti sur les éliminations importantes.
- [ ] Ajouter une vibration visuelle locale.
- [ ] Ajouter un effet d’apparition.
- [ ] Ajouter un effet de mort.
- [ ] Ajouter un effet de transfusion.

### Audio

- [ ] Ajouter un son de revolver.
- [ ] Ajouter un son de fusil à pompe.
- [ ] Ajouter un son de mêlée.
- [ ] Ajouter un son d’impact.
- [ ] Ajouter un son de projection.
- [ ] Ajouter un son d’absorption.
- [ ] Ajouter un son de transfusion.
- [ ] Ajouter un son de mort.
- [ ] Ajouter un son de réapparition.
- [ ] Ajouter une boucle musicale temporaire.
- [ ] Ajouter une variation audio selon la vie faible.
- [ ] Ajouter un mixage empêchant la saturation.
- [ ] Ajouter une limite de sons simultanés.

## Critères de validation

- Chaque action importante possède un retour visuel et sonore.
- Les tirs sont immédiatement identifiables.
- L’écran reste lisible malgré les effets.
- Le son ne devient pas agressif pendant une partie complète.

---

# Phase 8 — Équilibrage du MVP

## Objectif

Vérifier que la mécanique de sang est réellement utile et amusante.

## Tâches

- [ ] Définir les métriques de test.
- [ ] Mesurer la durée moyenne d’une manche.
- [ ] Mesurer la quantité moyenne de sang produite.
- [ ] Mesurer la quantité moyenne de sang récupérée.
- [ ] Mesurer le nombre moyen de transfusions.
- [ ] Mesurer le temps passé à faible vie.
- [ ] Mesurer la part des éliminations par arme.
- [ ] Vérifier que les joueurs utilisent les flaques.
- [ ] Vérifier que les joueurs comprennent la transfusion.
- [ ] Ajuster les dégâts du revolver.
- [ ] Ajuster les dégâts du fusil à pompe.
- [ ] Ajuster la mêlée.
- [ ] Ajuster le recul.
- [ ] Ajuster la quantité de sang.
- [ ] Ajuster la vitesse d’absorption.
- [ ] Ajuster la vitesse de transfusion.
- [ ] Ajuster le rendement du soin.
- [ ] Ajuster la durée de vie des flaques.
- [ ] Ajuster l’hémorragie.
- [ ] Ajuster la durée des manches.
- [ ] Tester avec deux joueurs.
- [ ] Tester avec trois joueurs.
- [ ] Tester avec quatre joueurs.
- [ ] Noter les comportements émergents.
- [ ] Supprimer les règles qui ne servent pas le cœur du jeu.

## Critères de validation

Le MVP est considéré comme validé si :

- les joueurs se battent volontairement pour les flaques ;
- les joueurs utilisent régulièrement la transfusion ;
- les combats produisent des retournements ;
- le sang ne constitue pas seulement un effet visuel ;
- les parties donnent envie d’être relancées ;
- les deux armes sont viables ;
- les joueurs comprennent le jeu en moins de deux minutes.

---

# Phase 9 — Stabilisation et publication du MVP

## Objectif

Produire une version jouable publiquement.

## Tâches

- [ ] Corriger les bugs bloquants.
- [ ] Corriger les problèmes de collision.
- [ ] Corriger les problèmes de manette.
- [ ] Corriger les pertes de focus.
- [ ] Ajouter une pause.
- [ ] Ajouter un écran de reprise.
- [ ] Vérifier les performances.
- [ ] Ajouter un compteur FPS de debug.
- [ ] Profiler les particules.
- [ ] Profiler les projectiles.
- [ ] Profiler les flaques.
- [ ] Réduire les allocations.
- [ ] Ajouter une page d’aide.
- [ ] Ajouter une politique de confidentialité minimale.
- [ ] Ajouter les crédits.
- [ ] Ajouter un numéro de version.
- [ ] Ajouter un changelog.
- [ ] Créer une page de présentation.
- [ ] Créer un GIF ou une vidéo courte.
- [ ] Publier une version web.
- [ ] Créer une archive jouable localement.
- [ ] Collecter les premiers retours.

## Livrable

**Blood Relay MVP 0.1**

---

# 6. Développement après validation du MVP

# Phase 10 — Direction artistique définitive

## Objectif

Remplacer les éléments temporaires par une identité visuelle cohérente.

## Tâches

- [ ] Définir la résolution logique.
- [ ] Définir la taille des sprites.
- [ ] Définir la palette principale.
- [ ] Définir les palettes des joueurs.
- [ ] Définir le contraste décor-personnages.
- [ ] Créer les personnages définitifs.
- [ ] Créer les animations d’attente.
- [ ] Créer les animations de course.
- [ ] Créer les animations de saut.
- [ ] Créer les animations d’esquive.
- [ ] Créer les animations de tir.
- [ ] Créer les animations de mêlée.
- [ ] Créer les animations de blessure.
- [ ] Créer les animations de transfusion.
- [ ] Créer les animations de mort.
- [ ] Créer les animations de réapparition.
- [ ] Créer les effets de sang définitifs.
- [ ] Créer les effets d’armes définitifs.
- [ ] Créer les éléments d’interface définitifs.
- [ ] Créer le logo.
- [ ] Créer une charte graphique.
- [ ] Créer une animation d’introduction courte.

## Critères de validation

- Les personnages restent identifiables dans le chaos.
- Le sang de chaque joueur est lisible.
- Les effets modernes ne dénaturent pas le pixel art.
- Le jeu possède une identité reconnaissable sur une capture.

---

# Phase 11 — Système de personnages

## Objectif

Ajouter de la variété sans transformer le jeu en hero shooter.

## Principe

Les personnages partagent les mêmes actions fondamentales.

Les différences doivent rester légères :

- vitesse ;
- masse ;
- capacité de réserve ;
- vitesse de transfusion ;
- résistance à l’hémorragie.

## Tâches

- [ ] Créer un format de données pour les personnages.
- [ ] Ajouter un personnage équilibré.
- [ ] Ajouter un personnage rapide.
- [ ] Ajouter un personnage lourd.
- [ ] Ajouter un personnage orienté transfusion.
- [ ] Ajouter un personnage orienté récupération.
- [ ] Limiter les écarts statistiques.
- [ ] Ajouter une sélection de personnage.
- [ ] Ajouter une prévisualisation.
- [ ] Ajouter des descriptions courtes.
- [ ] Ajouter des palettes alternatives.
- [ ] Ajouter des tests d’équilibrage.
- [ ] Vérifier qu’aucun personnage ne devient obligatoire.

## Contenu final visé

- 6 personnages ;
- 4 palettes par personnage ;
- aucune compétence active exclusive au lancement.

---

# Phase 12 — Arsenal complet

## Objectif

Proposer plusieurs styles de combat sans casser la lisibilité.

## Armes prévues

- revolver lourd ;
- fusil à pompe ;
- pistolet-mitrailleur ;
- arbalète ;
- machette ;
- lance-grenades ;
- fusil perforant ;
- canon scié.

## Tâches communes

- [ ] Créer un format de configuration unifié.
- [ ] Définir dégâts.
- [ ] Définir cadence.
- [ ] Définir recul.
- [ ] Définir projection de sang.
- [ ] Définir portée.
- [ ] Définir comportement du projectile.
- [ ] Définir son.
- [ ] Définir effet visuel.
- [ ] Définir comportement contre le décor.
- [ ] Définir comportement contre les joueurs.
- [ ] Ajouter les animations.
- [ ] Ajouter les icônes.
- [ ] Ajouter les tests unitaires.
- [ ] Ajouter les tests d’équilibrage.

## Tâches spécifiques

### Pistolet-mitrailleur

- [ ] Ajouter tir automatique.
- [ ] Ajouter faible dégât par balle.
- [ ] Ajouter dispersion progressive.
- [ ] Ajouter piste de sang continue.

### Arbalète

- [ ] Ajouter projectile lent.
- [ ] Ajouter traversée éventuelle.
- [ ] Ajouter fixation temporaire au décor.
- [ ] Ajouter récupération visuelle du carreau.

### Machette

- [ ] Ajouter combos simples.
- [ ] Ajouter forte projection de sang.
- [ ] Ajouter parade limitée si retenue.
- [ ] Ajouter déplacement court pendant l’attaque.

### Lance-grenades

- [ ] Ajouter trajectoire en arc.
- [ ] Ajouter explosion retardée.
- [ ] Ajouter dégâts de zone.
- [ ] Ajouter projection des joueurs.
- [ ] Ajouter projection des flaques.

### Fusil perforant

- [ ] Ajouter pénétration.
- [ ] Ajouter traçante.
- [ ] Ajouter dégâts élevés.
- [ ] Ajouter préparation télégraphiée.

### Canon scié

- [ ] Ajouter double tir.
- [ ] Ajouter recul extrême.
- [ ] Ajouter courte portée.
- [ ] Ajouter dispersion très large.

## Critères de validation

- Chaque arme change réellement le style de jeu.
- Aucune arme ne domine toutes les situations.
- Chaque arme reste compréhensible visuellement.
- La production de sang varie selon l’arme.

---

# Phase 13 — Arènes supplémentaires

## Objectif

Créer des niveaux variés tout en conservant un écran fixe.

## Règles de conception

Chaque arène doit contenir :

- une zone centrale contestée ;
- deux chemins secondaires ;
- plusieurs hauteurs ;
- au moins un espace risqué ;
- un seul gimmick principal ;
- aucun endroit garantissant une défense permanente.

## Arènes prévues

### Abattoir

- tapis roulant ;
- crochets ;
- broyeur central.

### Bloc opératoire

- portes automatiques ;
- tables mobiles ;
- zones de lumière intense.

### Métro abandonné

- passage périodique d’un train ;
- tunnels latéraux ;
- dispersion des flaques.

### Chapelle rouge

- pentes convergeant vers un autel ;
- accumulation centrale du sang ;
- plateformes hautes.

### Usine de transfusion

- pompes ;
- conduites ;
- aspiration et rejet du sang.

### Incinérateur

- zones chauffées ;
- feu temporaire ;
- sang séchant plus vite.

### Prison télévisée

- portes contrôlées ;
- écrans géants ;
- pièges activés périodiquement.

### Cuve zéro

- faible gravité partielle ;
- plateformes mobiles ;
- gouttes de sang suspendues.

## Tâches

- [ ] Définir un format de niveau.
- [ ] Ajouter des points d’apparition.
- [ ] Ajouter des zones de collision.
- [ ] Ajouter des plateformes traversables.
- [ ] Ajouter des éléments interactifs.
- [ ] Ajouter une prévisualisation.
- [ ] Ajouter une rotation aléatoire.
- [ ] Ajouter une sélection manuelle.
- [ ] Ajouter une validation automatique des niveaux.
- [ ] Vérifier les points de blocage.
- [ ] Vérifier les performances.
- [ ] Tester chaque niveau avec deux joueurs.
- [ ] Tester chaque niveau avec quatre joueurs.
- [ ] Vérifier la circulation du sang.
- [ ] Vérifier la sécurité des apparitions.

## Contenu final visé

- 8 arènes ;
- 1 variante visuelle ou événementielle par arène.

---

# Phase 14 — Modes de jeu

## Objectif

Exploiter le système de sang dans plusieurs variantes simples.

## 14.1 Carnage

- [ ] Conserver le mode chacun pour soi.
- [ ] Ajouter score cible.
- [ ] Ajouter limite de temps.
- [ ] Ajouter variantes de règles.

## 14.2 Dernier vivant

- [ ] Désactiver la réapparition.
- [ ] Ajouter manches courtes.
- [ ] Ajouter victoire du dernier survivant.
- [ ] Ajouter format au meilleur de plusieurs manches.

## 14.3 Relais

- [ ] Ajouter équipes.
- [ ] Ajouter réserve de sang commune.
- [ ] Ajouter transfert entre alliés.
- [ ] Ajouter réanimation.
- [ ] Ajouter score d’équipe.
- [ ] Ajouter HUD partagé.
- [ ] Tester les comportements anti-jeu.

## 14.4 Banque de sang

- [ ] Ajouter une cuve centrale.
- [ ] Ajouter dépôt de sang.
- [ ] Immobiliser le joueur pendant le dépôt.
- [ ] Ajouter score par quantité déposée.
- [ ] Ajouter perte partielle en cas de mort.
- [ ] Ajouter indicateurs d’équipe.

## 14.5 Hémorragie

- [ ] Ajouter perte de vie progressive.
- [ ] Ajouter taux configurable.
- [ ] Ajouter bonus de récupération.
- [ ] Ajouter durée courte.
- [ ] Vérifier que le mode ne devient pas purement aléatoire.

## 14.6 Coopération survie

- [ ] Ajouter vagues d’ennemis.
- [ ] Ajouter réserve d’équipe.
- [ ] Ajouter réanimation.
- [ ] Ajouter montée en difficulté.
- [ ] Ajouter score de survie.
- [ ] Limiter le nombre de types d’ennemis.

## Critères de validation

- Chaque mode utilise réellement la mécanique de sang.
- Aucun mode n’est une simple variation cosmétique.
- Les règles sont expliquées en quelques phrases.
- Les parties restent courtes.

---

# Phase 15 — État exsangue et réanimation

## Objectif

Ajouter des retournements de situation en équipe.

## Tâches

- [ ] Ajouter l’état exsangue.
- [ ] Ajouter déplacement en rampant.
- [ ] Ajouter vitesse réduite.
- [ ] Ajouter durée maximale.
- [ ] Ajouter une attaque faible.
- [ ] Ajouter une dernière utilisation d’arme si disponible.
- [ ] Ajouter achèvement.
- [ ] Ajouter réanimation par allié.
- [ ] Ajouter coût en sang pour réanimer.
- [ ] Ajouter interruption de réanimation.
- [ ] Ajouter animation.
- [ ] Ajouter effets audio.
- [ ] Ajouter feedback HUD.
- [ ] Désactiver ce système dans les modes non compatibles.
- [ ] Tester les situations de blocage.
- [ ] Éviter les réanimations infinies.

## Critères de validation

- L’état exsangue crée de la tension sans ralentir excessivement la partie.
- La réanimation comporte un risque réel.
- Les joueurs exsangues restent impliqués.

---

# Phase 16 — Bots et entraînement

## Objectif

Permettre de tester et jouer sans groupe complet.

## Tâches

- [x] Créer une abstraction de contrôleur.
- [x] Ajouter un bot simple.
- [x] Ajouter navigation dans l’arène.
- [x] Ajouter détection des plateformes.
- [x] Ajouter choix de cible.
- [x] Ajouter décision de tir.
- [x] Ajouter décision de mêlée.
- [x] Ajouter esquive.
- [x] Ajouter recherche de sang.
- [x] Ajouter décision de transfusion.
- [x] Ajouter plusieurs niveaux de difficulté.
- [x] Ajouter comportement d’équipe.
- [x] Ajouter mode entraînement.
- [x] Ajouter mannequins de test.
- [x] Ajouter affichage des hitboxes.
- [x] Ajouter rechargement instantané de l’arène de test.

## Critères de validation

- Les bots utilisent le sang.
- Les bots restent prévisibles mais pas stupides.
- Les bots ne nécessitent pas de navigation complexe hors écran.
- Le mode entraînement permet d’apprendre les mécaniques.

---

# Phase 17 — Multijoueur en ligne

## Objectif

Ajouter des parties distantes après validation complète du gameplay local.

## Principe recommandé

Utiliser une architecture autoritaire avec :

- serveur de partie ;
- simulation déterministe autant que possible ;
- prédiction locale ;
- correction d’état ;
- interpolation ;
- rollback limité si nécessaire.

## Tâches préparatoires

- [ ] Séparer simulation et rendu.
- [ ] Rendre les entrées sérialisables.
- [ ] Rendre les états de manche sérialisables.
- [ ] Ajouter un pas de simulation fixe.
- [ ] Ajouter un identifiant unique par entité.
- [ ] Ajouter des snapshots.
- [ ] Ajouter enregistrement et relecture d’entrées.
- [ ] Ajouter tests de déterminisme.
- [ ] Réduire les sources d’aléatoire.
- [ ] Ajouter une graine partagée.

## Serveur

- [ ] Choisir la technologie serveur.
- [ ] Créer un serveur de lobby.
- [ ] Créer un serveur de partie.
- [ ] Ajouter création de salon.
- [ ] Ajouter code d’invitation.
- [ ] Ajouter matchmaking privé.
- [ ] Ajouter gestion des connexions.
- [ ] Ajouter reprise après déconnexion courte.
- [ ] Ajouter validation des entrées.
- [ ] Ajouter protection contre les messages invalides.
- [ ] Ajouter journalisation.
- [ ] Ajouter métriques.

## Client réseau

- [ ] Ajouter connexion au serveur.
- [ ] Ajouter écran de lobby.
- [ ] Ajouter invitation.
- [ ] Ajouter synchronisation des joueurs.
- [ ] Ajouter synchronisation des projectiles.
- [ ] Ajouter synchronisation du sang.
- [ ] Ajouter synchronisation des flaques.
- [ ] Ajouter interpolation.
- [ ] Ajouter prédiction.
- [ ] Ajouter correction.
- [ ] Ajouter indicateur de latence.
- [ ] Ajouter gestion des pertes de paquets.
- [ ] Ajouter gestion des abandons.

## Validation

- [ ] Tester à faible latence.
- [ ] Tester à 50 ms.
- [ ] Tester à 100 ms.
- [ ] Tester à 150 ms.
- [ ] Tester avec perte de paquets.
- [ ] Tester avec quatre joueurs.
- [ ] Tester les déconnexions.
- [ ] Tester les abus basiques.
- [ ] Vérifier la cohérence des scores.
- [ ] Vérifier la cohérence du sang.

## Remarque

Cette phase ne doit commencer qu’après validation du jeu local.

---

# Phase 18 — Progression légère et personnalisation

## Objectif

Donner des objectifs sans déséquilibrer le jeu.

## Tâches

- [ ] Ajouter un profil local.
- [ ] Ajouter statistiques cumulées.
- [ ] Ajouter défis simples.
- [ ] Ajouter succès.
- [ ] Ajouter palettes de personnages.
- [ ] Ajouter apparences d’armes.
- [ ] Ajouter effets de réapparition.
- [ ] Ajouter bannières de profil.
- [ ] Ajouter titres.
- [ ] Ajouter déblocages purement cosmétiques.
- [ ] Éviter toute amélioration de statistiques.
- [ ] Ajouter import et export du profil local.
- [ ] Ajouter synchronisation facultative si comptes retenus.

## Critères de validation

- Aucun déblocage ne confère d’avantage.
- La progression ne ralentit pas l’accès au jeu.
- Les parties privées restent accessibles immédiatement.

---

# Phase 19 — Accessibilité

## Objectif

Rendre le jeu jouable malgré les flashes, mouvements rapides et couleurs multiples.

## Tâches

- [ ] Ajouter plusieurs palettes daltoniennes.
- [ ] Ajouter motifs ou icônes par joueur.
- [ ] Ajouter réduction du sang visuel.
- [ ] Ajouter remplacement du sang par un fluide non organique.
- [ ] Ajouter réduction des secousses.
- [ ] Ajouter suppression des flashes.
- [ ] Ajouter réduction des ralentis.
- [ ] Ajouter intensité des vibrations.
- [ ] Ajouter taille du HUD.
- [ ] Ajouter contraste renforcé.
- [ ] Ajouter sous-titres des annonces.
- [ ] Ajouter remappage complet.
- [ ] Ajouter maintien ou bascule pour la transfusion.
- [ ] Ajouter assistance à la visée facultative.
- [ ] Ajouter test de lisibilité.
- [ ] Documenter les options sensibles.

---

# Phase 20 — Audio et musique définitifs

## Objectif

Créer une identité sonore forte et lisible.

## Tâches

- [ ] Définir la direction musicale.
- [ ] Composer ou intégrer le thème principal.
- [ ] Créer une musique par famille d’arènes.
- [ ] Ajouter variations d’intensité.
- [ ] Ajouter annonces de manche.
- [ ] Ajouter annonces de victoire.
- [ ] Ajouter sons distincts par arme.
- [ ] Ajouter sons distincts par type d’impact.
- [ ] Ajouter sons de sang.
- [ ] Ajouter sons de transfusion.
- [ ] Ajouter sons d’hémorragie.
- [ ] Ajouter ambiance par arène.
- [ ] Ajouter spatialisation stéréo.
- [ ] Ajouter compression et limitation.
- [ ] Ajouter options détaillées.
- [ ] Tester sur casque.
- [ ] Tester sur haut-parleurs.
- [ ] Tester à faible volume.

---

# Phase 21 — Replays et spectateur

## Objectif

Faciliter le partage, le débogage et la compétition.

## Tâches

- [ ] Enregistrer les entrées d’une manche.
- [ ] Rejouer une manche.
- [ ] Ajouter vitesse de lecture.
- [ ] Ajouter pause.
- [ ] Ajouter avance image par image.
- [ ] Ajouter caméra spectateur.
- [ ] Ajouter masquage du HUD.
- [ ] Ajouter export de données.
- [ ] Ajouter partage d’un fichier de replay.
- [ ] Ajouter versionnage des replays.
- [ ] Ajouter validation de compatibilité.
- [ ] Ajouter sauvegarde automatique des dernières manches.
- [ ] Ajouter mode ralenti.
- [ ] Ajouter marqueurs d’éliminations.
- [ ] Ajouter statistiques de replay.

---

# Phase 22 — Polissage final

## Objectif

Transformer la version complète en jeu publiable.

## Tâches

### Qualité

- [ ] Corriger les bugs critiques.
- [ ] Corriger les bugs majeurs.
- [ ] Corriger les incohérences de collision.
- [ ] Corriger les pertes d’entrée.
- [ ] Corriger les problèmes de focus.
- [ ] Corriger les problèmes de son.
- [ ] Corriger les problèmes de sauvegarde.
- [ ] Ajouter gestion des erreurs.
- [ ] Ajouter rapports de crash.
- [ ] Ajouter journalisation locale.

### Performance

- [ ] Profiler le CPU.
- [ ] Profiler le GPU.
- [ ] Profiler la mémoire.
- [ ] Optimiser les particules.
- [ ] Optimiser les flaques.
- [ ] Optimiser les shaders.
- [ ] Optimiser les animations.
- [ ] Vérifier les fuites mémoire.
- [ ] Vérifier les changements de scène.
- [ ] Vérifier les longues sessions.
- [ ] Définir des profils de qualité.

### Expérience utilisateur

- [ ] Réduire le temps jusqu’à la première partie.
- [ ] Ajouter tutoriel interactif.
- [ ] Ajouter conseils contextuels.
- [ ] Ajouter écrans de chargement utiles.
- [ ] Ajouter retour clair après déconnexion.
- [ ] Ajouter confirmations nécessaires.
- [ ] Supprimer les confirmations inutiles.
- [ ] Vérifier navigation clavier.
- [ ] Vérifier navigation manette.
- [ ] Vérifier navigation tactile si retenue.

### Contenu

- [ ] Vérifier toutes les armes.
- [ ] Vérifier tous les personnages.
- [ ] Vérifier toutes les arènes.
- [ ] Vérifier tous les modes.
- [ ] Vérifier tous les effets.
- [ ] Vérifier tous les sons.
- [ ] Vérifier tous les textes.
- [ ] Vérifier tous les crédits.

---

# Phase 23 — Publication finale

## Objectif

Préparer et publier la version 1.0.

## Tâches

- [ ] Définir le modèle de distribution.
- [ ] Préparer la version web.
- [ ] Préparer une version desktop si retenue.
- [ ] Créer la page du jeu.
- [ ] Créer les captures d’écran.
- [ ] Créer la bande-annonce.
- [ ] Créer un GIF court.
- [ ] Rédiger la description courte.
- [ ] Rédiger la description longue.
- [ ] Préparer le kit presse.
- [ ] Préparer la FAQ.
- [ ] Préparer la politique de confidentialité.
- [ ] Préparer les mentions légales.
- [ ] Préparer la page de support.
- [ ] Préparer le changelog.
- [ ] Préparer le guide de démarrage.
- [ ] Ajouter télémétrie facultative et respectueuse.
- [ ] Tester le build final.
- [ ] Tester une installation propre.
- [ ] Tester une suppression propre.
- [ ] Publier une release candidate.
- [ ] Corriger les derniers bugs.
- [ ] Publier la version 1.0.

---

# 7. Contenu cible de la version finale

## Personnages

- 6 personnages ;
- statistiques légèrement différentes ;
- 4 palettes chacun ;
- aucune compétence exclusive déséquilibrante.

## Armes

- 8 armes ;
- 1 attaque de mêlée commune ;
- variantes visuelles éventuelles ;
- statistiques entièrement configurables.

## Arènes

- 8 arènes ;
- un gimmick principal par arène ;
- variantes événementielles facultatives.

## Modes

- Carnage ;
- Dernier vivant ;
- Relais ;
- Banque de sang ;
- Hémorragie ;
- Coopération survie.

## Multijoueur

- 2 à 4 joueurs en local ;
- 2 à 4 joueurs en ligne ;
- salons privés ;
- bots ;
- entraînement.

## Fonctionnalités

- manettes ;
- clavier ;
- remappage ;
- replays ;
- statistiques ;
- cosmétiques ;
- options d’accessibilité ;
- profils locaux ;
- progression légère ;
- tutoriel.

---

# 8. Ordre recommandé de réalisation

## Étape 1 — Prototype brut

Réaliser uniquement :

- une arène ;
- deux joueurs ;
- déplacement ;
- revolver ;
- dégâts ;
- sang ;
- absorption ;
- transfusion ;
- mort ;
- réapparition.

## Étape 2 — MVP jouable

Ajouter :

- quatre joueurs ;
- manettes ;
- fusil à pompe ;
- mêlée ;
- score ;
- menus ;
- HUD ;
- effets ;
- audio ;
- équilibrage.

## Étape 3 — Validation

Organiser plusieurs sessions de test.

Ne pas continuer si :

- les joueurs ignorent les flaques ;
- la transfusion ralentit trop le jeu ;
- le sang est illisible ;
- le combat reste plus intéressant sans la mécanique centrale.

## Étape 4 — Production

Ajouter :

- direction artistique ;
- armes ;
- personnages ;
- arènes ;
- modes ;
- bots.

## Étape 5 — Réseau

Commencer le multijoueur en ligne uniquement lorsque :

- la simulation est stable ;
- les règles sont figées ;
- les armes principales sont équilibrées ;
- les données sont sérialisables ;
- le jeu local est déjà amusant.

## Étape 6 — Finalisation

Ajouter :

- progression ;
- cosmétiques ;
- replays ;
- accessibilité ;
- contenu final ;
- publication.

---

# 9. Risques principaux

## Risque 1 — Le sang n’influence pas réellement les joueurs

### Symptôme

Les joueurs continuent à tirer sans chercher à récupérer les flaques.

### Réponses possibles

- augmenter l’importance du soin ;
- réduire les autres sources de récupération ;
- rendre la transfusion plus rapide ;
- concentrer davantage le sang ;
- placer les flaques dans des zones contestées ;
- réduire la vie maximale ;
- augmenter l’hémorragie.

---

## Risque 2 — Les combats deviennent trop longs

### Symptôme

Les joueurs récupèrent continuellement leur vie.

### Réponses possibles

- limiter le rendement de la transfusion ;
- réduire la capacité de réserve ;
- faire disparaître le sang plus vite ;
- interrompre plus facilement la transfusion ;
- limiter le soin maximal après plusieurs transfusions ;
- augmenter la létalité.

---

## Risque 3 — L’écran devient illisible

### Symptôme

Le sang, les projectiles et les effets cachent les joueurs.

### Réponses possibles

- réduire les particules ;
- faire sécher les flaques ;
- limiter les decals ;
- réserver les gros effets aux éliminations ;
- renforcer les contours des joueurs ;
- diminuer la saturation du décor ;
- réduire les secousses.

---

## Risque 4 — Trop de complexité technique

### Symptôme

La simulation du sang ralentit le développement.

### Réponses possibles

- utiliser des flaques simples ;
- limiter le nombre d’entités ;
- fusionner les flaques visuellement ;
- découpler visuel et quantité réelle ;
- éviter toute simulation physique de liquide ;
- reporter les shaders avancés.

---

## Risque 5 — Le multijoueur en ligne bloque le projet

### Symptôme

Le réseau consomme plus de temps que le gameplay.

### Réponse

Ne pas commencer le réseau avant la validation complète du jeu local.

---

## Risque 6 — Le jeu ressemble à un simple arena shooter

### Symptôme

Le sang ne sert qu’à l’esthétique.

### Réponses possibles

- renforcer la récupération ;
- introduire les modes Relais et Banque de sang ;
- concevoir les arènes autour de la circulation du sang ;
- suivre des métriques sur l’usage des flaques ;
- supprimer les mécaniques qui détournent de la ressource centrale.

---

# 10. Définition de terminé

## MVP terminé

Le MVP est terminé lorsque :

- deux à quatre joueurs peuvent jouer localement ;
- une manche complète peut être lancée et terminée ;
- les deux armes fonctionnent ;
- le sang est produit, visible et récupérable ;
- la transfusion fonctionne ;
- les joueurs se battent volontairement pour les flaques ;
- le jeu tient 60 images par seconde ;
- les contrôles manette fonctionnent ;
- aucun bug bloquant n’est connu ;
- le jeu est publiquement accessible.

## Version 1.0 terminée

La version 1.0 est terminée lorsque :

- le contenu cible est intégré ;
- le jeu local est stable ;
- le jeu en ligne est stable si retenu ;
- les options d’accessibilité sont présentes ;
- les performances sont validées ;
- le tutoriel fonctionne ;
- les replays fonctionnent ;
- les builds de distribution sont testés ;
- les pages de publication sont prêtes ;
- aucun bug critique ou majeur n’est connu.

---

# 11. Première série de tâches à confier à Codex

```text
Objectif : initialiser le prototype de Blood Relay.

1. Créer un projet Vite + TypeScript + Phaser 3.
2. Configurer ESLint, Prettier et Vitest.
3. Créer les scènes BootScene, MenuScene et ArenaScene.
4. Créer une arène fixe tenant sur un écran 16:9.
5. Créer une entité Player avec :
   - déplacement horizontal ;
   - saut ;
   - collisions avec le sol et les plateformes ;
   - orientation gauche/droite.
6. Ajouter deux profils clavier temporaires.
7. Permettre à deux joueurs de se déplacer simultanément.
8. Ajouter un mode debug affichant :
   - hitboxes ;
   - vélocité ;
   - état au sol ;
   - FPS.
9. Ajouter les scripts npm nécessaires.
10. Vérifier que npm run build, npm run lint et npm run test fonctionnent.
11. Documenter l’architecture dans le README.
12. Ne pas ajouter d’armes, de sang, de réseau ou d’assets définitifs à cette étape.
```
