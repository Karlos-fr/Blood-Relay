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

---

# 4. Stack technique et décisions structurantes

## 4.1 Stack de départ

Le prototype et le MVP utilisent volontairement une stack minimale :

- **TypeScript** en mode strict ;
- **Vite** pour le développement et le build ;
- **Phaser 3** comme moteur 2D ;
- **Arcade Physics** pour les collisions et la physique simple ;
- **WebGL** via Phaser pour le rendu ;
- **Vitest** pour tester la logique de gameplay importante ;
- **ESLint** et **Prettier** pour maintenir une base propre.

Les briques suivantes sont ajoutées seulement lorsqu'elles deviennent nécessaires :

- **Gamepad API** : phase multijoueur local ;
- **Web Audio API / audio Phaser** : phase game feel ;
- **Playwright** : stabilisation du MVP, lorsqu'une vraie boucle de jeu existe ;
- shaders et post-processing : après validation du gameplay.

## 4.2 Décisions de gameplay et de rendu

- Vue **2D de côté**.
- Gravité verticale.
- Arène entièrement visible, sans scrolling.
- Ratio cible **16:9**.
- Résolution logique de référence **960 × 540**.
- Scaling entier privilégié lorsque possible, avec adaptation propre aux autres résolutions.
- 60 FPS visés sur une machine modeste.
- Deux joueurs clavier suffisent jusqu'à validation de la mécanique centrale.
- Les assets définitifs sont interdits de bloquer le prototype : formes et placeholders sont acceptés.

## 4.3 Physique

Utiliser **Phaser Arcade Physics** pour :

- joueurs ;
- plateformes ;
- projectiles ;
- collisions ;
- recul ;
- zones de récupération.

Ne pas introduire Matter.js sauf besoin concret démontré par une mécanique validée.

## 4.4 Modèle du sang

Le sang possède deux représentations séparées.

### Gameplay

Une flaque contient principalement :

- une position ;
- une quantité ;
- un propriétaire d'origine ;
- une couleur ;
- un âge ;
- un état d'assèchement.

### Présentation

Le rendu peut utiliser :

- particules ;
- éclaboussures ;
- decals ;
- sprite ou mesh de flaque ;
- shader léger ;
- traces sur le décor.

Le rendu ne doit jamais être la source de vérité de la quantité de sang.

### Règle de fusion

- deux flaques provenant du **même joueur** peuvent fusionner ;
- deux flaques de propriétaires différents **ne fusionnent pas côté gameplay** ;
- un éventuel chevauchement visuel ne doit pas faire perdre l'identité de leur contenu.

Aucune simulation réaliste de fluide n'est nécessaire.

## 4.5 Architecture cible progressive

Ne pas créer toute l'arborescence avant qu'elle soit utile.

Architecture cible :

```text
src/
├── scenes/
│   ├── BootScene.ts
│   ├── MenuScene.ts
│   ├── ArenaScene.ts
│   └── ResultsScene.ts
├── gameplay/
│   ├── player/
│   ├── combat/
│   ├── blood/
│   ├── weapons/
│   └── match/
├── input/
├── presentation/
│   ├── effects/
│   ├── audio/
│   └── hud/
├── content/
└── tests/
```

La logique de gameplay doit être séparée du rendu lorsque cela apporte un bénéfice concret, en particulier pour :

- santé ;
- dégâts ;
- réserve de sang ;
- absorption ;
- transfusion ;
- score ;
- règles de manche.

Ne pas construire de framework générique prématurément.

---

# 5. Réalisation du MVP

Le MVP est construit comme une **vertical slice progressive**. L'objectif est d'atteindre la mécanique centrale le plus tôt possible.

# Phase 0 — Socle minimal

## Objectif

Obtenir un projet Phaser extrêmement simple, testable et compilable.

## Tâches

- [x] Initialiser Vite + TypeScript.
- [x] Activer TypeScript strict.
- [x] Ajouter Phaser 3.
- [x] Configurer Arcade Physics.
- [x] Configurer une résolution logique de 960 × 540.
- [x] Configurer le scaling 16:9 et le centrage.
- [x] Configurer ESLint.
- [x] Configurer Prettier.
- [x] Configurer Vitest.
- [x] Ajouter les scripts `dev`, `build`, `test`, `lint` et `format`.
- [x] Créer `BootScene`.
- [x] Créer `ArenaScene`.
- [ ] Afficher une arène vide avec un sol temporaire.
- [ ] Afficher la version du jeu en mode debug.
- [x] Ajouter un README minimal décrivant le lancement.
- [ ] Vérifier le build de production.
- [ ] Vérifier les tests et le lint.

## Ne pas faire dans cette phase

- Playwright ;
- GitHub Actions ;
- déploiement ;
- manettes ;
- audio ;
- armes ;
- sang ;
- menu complet ;
- assets définitifs.

## Critères de validation

- `npm run dev` lance le jeu.
- `npm run build` réussit.
- `npm run test` réussit.
- `npm run lint` réussit.
- L'arène 960 × 540 s'affiche correctement.

---

# Phase 1 — Arène et déplacement à deux

## Objectif

Pouvoir jouer à deux sur le même clavier dans une arène de côté tenant intégralement sur l'écran.

## Tâches

### Arène

- [ ] Créer l'arène de référence du prototype.
- [ ] Ajouter le sol.
- [ ] Ajouter deux plateformes traversables.
- [ ] Ajouter deux points d'apparition.
- [ ] Définir les limites de l'arène.
- [ ] Empêcher toute sortie de l'écran.
- [ ] Garder la caméra fixe sur toute l'arène.
- [ ] Ajouter un affichage debug facultatif des collisions.

### Joueurs

- [ ] Créer une entité `Player` minimale.
- [ ] Créer deux joueurs avec couleurs distinctes.
- [ ] Ajouter la position et la vélocité.
- [ ] Ajouter l'orientation gauche/droite.
- [ ] Ajouter l'état sol / air.
- [ ] Ajouter les collisions joueur-décor.
- [ ] Ajouter les collisions joueur-joueur si elles améliorent le gameplay.

### Contrôles temporaires

- [ ] Ajouter un mapping clavier joueur 1.
- [ ] Ajouter un mapping clavier joueur 2.
- [ ] Ajouter déplacement gauche/droite.
- [ ] Ajouter accélération et décélération simples.
- [ ] Ajouter saut.
- [ ] Ajouter chute.
- [ ] Ajouter descente à travers les plateformes.

### Placeholders

- [ ] Utiliser des formes ou sprites temporaires simples.
- [ ] Ajouter une lecture visuelle claire de la direction regardée.

## Critères de validation

- Deux joueurs peuvent se déplacer simultanément.
- Le saut est réactif.
- Les plateformes fonctionnent.
- Aucun joueur ne quitte l'écran.
- Aucun scrolling n'est nécessaire.
- Les contrôles restent agréables à 60 FPS.

---

# Phase 2 — Premier combat

## Objectif

Transformer l'arène en shooter jouable avec une seule arme avant d'introduire le sang.

## Tâches

### Santé

- [ ] Créer un système `Health` simple et testable.
- [ ] Définir la vie maximale.
- [ ] Ajouter l'application des dégâts.
- [ ] Ajouter l'état mort.
- [ ] Ajouter des tests unitaires sur les dégâts et la mort.

### Revolver lourd

- [ ] Créer une abstraction minimale d'arme.
- [ ] Créer le revolver lourd.
- [ ] Ajouter le tir.
- [ ] Ajouter un projectile.
- [ ] Définir vitesse et durée de vie du projectile.
- [ ] Ajouter collision projectile-joueur.
- [ ] Ajouter collision projectile-décor.
- [ ] Ajouter les dégâts.
- [ ] Ajouter le recul du tireur.
- [ ] Ajouter le recul de la cible.
- [ ] Ajouter une cadence de tir.
- [ ] Empêcher le joueur de se toucher lui-même.

### Mort et réapparition

- [ ] Désactiver le joueur à sa mort.
- [ ] Ajouter un délai court de réapparition.
- [ ] Réapparaître sur un point sûr.
- [ ] Ajouter une courte invulnérabilité de spawn.
- [ ] Ajouter un feedback visuel placeholder lors d'un impact.
- [ ] Ajouter un feedback visuel placeholder lors de la mort.

## Critères de validation

- Les deux joueurs peuvent se tirer dessus.
- Un tir inflige toujours les dégâts attendus.
- Le recul est lisible mais contrôlable.
- La mort puis la réapparition fonctionnent en boucle.
- Les tests de santé réussissent.

---

# Phase 3 — Cœur de Blood Relay

## Objectif

Implémenter le cycle qui différencie Blood Relay d'un arena shooter classique :

> tir → dégâts → sang au sol → récupération → réserve → transfusion → soin

Cette phase est prioritaire sur tout le reste.

## Tâches

### Modèle de sang

- [ ] Définir l'unité interne de sang.
- [ ] Lier la quantité de sang produite aux dégâts reçus.
- [ ] Créer une entité ou structure `BloodPool`.
- [ ] Stocker position, quantité, propriétaire, couleur et âge.
- [ ] Définir une capacité maximale de réserve de sang par joueur.
- [ ] Ajouter une couleur de sang distincte par joueur.
- [ ] Conserver le propriétaire d'origine du sang.
- [ ] Implémenter la fusion des flaques du même propriétaire.
- [ ] Interdire la fusion gameplay de flaques de propriétaires différents.
- [ ] Ajouter des tests unitaires du modèle de sang.

### Production

- [ ] Produire du sang lors d'un impact du revolver.
- [ ] Faire tomber le sang vers le sol de manière simple.
- [ ] Créer une flaque là où les gouttes atteignent une surface.
- [ ] Faire varier légèrement la position des projections.
- [ ] Limiter le nombre maximal d'éléments visuels.
- [ ] Séparer quantité réelle et particules décoratives.

### Flaques

- [ ] Représenter chaque flaque visuellement.
- [ ] Faire varier sa taille en fonction de sa quantité.
- [ ] Faire diminuer visuellement une flaque consommée.
- [ ] Ajouter une durée de vie configurable.
- [ ] Ajouter un assèchement progressif simple.
- [ ] Garantir la lisibilité de la couleur du propriétaire.

### Absorption

- [ ] Détecter qu'un joueur entre en contact avec une flaque.
- [ ] Absorber le sang progressivement.
- [ ] Remplir la réserve du joueur.
- [ ] Réduire la quantité de la flaque.
- [ ] Arrêter l'absorption lorsque la réserve est pleine.
- [ ] Ajouter un feedback visuel placeholder.
- [ ] Ajouter un indicateur debug de réserve.
- [ ] Tester l'absorption d'un sang appartenant à l'adversaire.
- [ ] Ajouter des tests unitaires d'absorption.

### Transfusion

- [ ] Ajouter une commande de transfusion aux deux joueurs.
- [ ] Empêcher le tir pendant la transfusion.
- [ ] Ralentir fortement ou immobiliser le joueur.
- [ ] Consommer la réserve progressivement.
- [ ] Restaurer la vie progressivement.
- [ ] Interrompre la transfusion si le joueur reçoit des dégâts.
- [ ] Empêcher le dépassement de la vie maximale.
- [ ] Définir un rendement inférieur à 100 % si nécessaire.
- [ ] Ajouter un feedback visuel placeholder clair.
- [ ] Ajouter des tests unitaires de transfusion.

### Première instrumentation

- [ ] Compter la quantité de sang produite.
- [ ] Compter la quantité récupérée par chaque joueur.
- [ ] Compter le nombre de transfusions.
- [ ] Afficher ces valeurs en debug.

## Critères de validation

- Blesser un joueur produit une ressource récupérable.
- Les deux joueurs peuvent récupérer le sang de l'autre.
- Une flaque diminue réellement quand elle est absorbée.
- La réserve ne dépasse jamais sa capacité maximale.
- Une transfusion consomme du sang et restaure de la vie.
- Recevoir un tir interrompt la transfusion.
- Les tests de sang et de transfusion réussissent.
- Le système reste stable pendant plusieurs minutes de combat.

## Point de validation gameplay n°1

À la fin de cette phase, faire une vraie session de jeu à deux.

Question unique :

> Est-ce que la présence du sang commence déjà à modifier les décisions des joueurs ?

Si non, ajuster la mécanique avant d'ajouter du contenu.

---

# Phase 4 — Première vraie partie

## Objectif

Passer d'un prototype sans fin à une partie complète avec début, score et victoire.

## Tâches

### Manche

- [ ] Créer un `MatchManager`.
- [ ] Ajouter un compte à rebours initial court.
- [ ] Ajouter une durée de manche configurable.
- [ ] Ajouter un score par élimination.
- [ ] Attribuer correctement le kill au dernier attaquant pertinent.
- [ ] Gérer les suicides.
- [ ] Ajouter une condition de victoire.
- [ ] Ajouter un départage simple.
- [ ] Bloquer le gameplay après la fin de manche.

### HUD minimal

- [ ] Afficher la vie des deux joueurs.
- [ ] Afficher leur réserve de sang.
- [ ] Afficher le score.
- [ ] Afficher le temps restant.
- [ ] Garder le centre de l'arène dégagé.

### Résultat

- [ ] Afficher le vainqueur.
- [ ] Afficher éliminations et morts.
- [ ] Afficher sang produit et récupéré.
- [ ] Afficher transfusions.
- [ ] Permettre de rejouer immédiatement.

## Critères de validation

- Une partie démarre, se joue et se termine sans manipulation technique.
- Le score est correct.
- Le vainqueur est toujours déterminé.
- Rejouer prend quelques secondes au maximum.
- Les informations de sang sont compréhensibles.

## Point de validation gameplay n°2

Faire plusieurs manches à deux avant de continuer.

Ne poursuivre que si :

- récupérer le sang paraît utile ;
- se transfuser constitue un vrai choix de risque ;
- les joueurs commencent à se disputer certaines flaques ;
- le soin ne rend pas les combats interminables.

---

# Phase 5 — Gameplay MVP complet

## Objectif

Ajouter seulement les mécaniques nécessaires pour obtenir la première vraie version de Blood Relay.

## 5.1 Fusil à pompe

- [ ] Ajouter une seconde configuration d'arme.
- [ ] Créer le fusil à pompe.
- [ ] Ajouter plusieurs plombs.
- [ ] Ajouter la dispersion.
- [ ] Ajouter une courte portée efficace.
- [ ] Ajouter un recul élevé.
- [ ] Ajouter une forte projection de la cible.
- [ ] Produire une gerbe de sang plus large.
- [ ] Ajuster le temps entre les tirs.
- [ ] Tester l'équilibrage face au revolver.

## 5.2 Mêlée

- [ ] Ajouter une attaque courte commune.
- [ ] Ajouter une hitbox de mêlée.
- [ ] Ajouter un recul de la cible.
- [ ] Ajouter un cooldown anti-spam.
- [ ] Interrompre une transfusion touchée en mêlée.
- [ ] Produire une quantité de sang cohérente.

## 5.3 Esquive

- [ ] Ajouter une esquive courte.
- [ ] Ajouter un temps de recharge.
- [ ] Déterminer par test si elle donne une courte invulnérabilité.
- [ ] Ajouter un indicateur debug de disponibilité.

## 5.4 Hémorragie

- [ ] Définir un seuil de vie critique.
- [ ] Produire périodiquement de petites gouttes sous ce seuil.
- [ ] Arrêter l'hémorragie après récupération suffisante.
- [ ] Limiter son impact afin qu'elle n'entraîne pas une mort automatique frustrante.
- [ ] Ajouter un feedback clair.

## 5.5 Sélection d'arme minimale

- [ ] Permettre à chaque joueur de choisir revolver ou fusil à pompe avant la manche.
- [ ] Afficher le choix dans le HUD.

## Critères de validation

- Les deux armes ont des sensations différentes.
- La mêlée est utile sans remplacer les armes.
- L'esquive augmente les possibilités sans rendre les joueurs intouchables.
- L'hémorragie renforce la chasse au joueur blessé.
- Toutes ces mécaniques alimentent le système de sang au lieu de le masquer.

---

# Phase 6 — Multijoueur local 2 à 4 joueurs

## Objectif

Passer du prototype clavier à un vrai jeu canapé.

## Tâches

### Abstraction des entrées

- [ ] Créer `InputProfile`.
- [ ] Définir les actions standard : gauche, droite, saut, descente, tir, mêlée, esquive, transfusion.
- [ ] Migrer les deux mappings clavier existants vers cette abstraction.
- [ ] Découpler le gameplay de la source réelle des entrées.

### Gamepad

- [ ] Ajouter la Gamepad API.
- [ ] Détecter les manettes connectées.
- [ ] Ajouter une zone morte pour les sticks.
- [ ] Associer un périphérique à un joueur.
- [ ] Gérer la déconnexion d'une manette sans planter la partie.
- [ ] Ajouter vibration sur impacts importants si supportée.

### Join flow

- [ ] Ajouter une étape locale « Appuyer pour rejoindre ».
- [ ] Permettre 2 à 4 joueurs.
- [ ] Empêcher un périphérique de contrôler plusieurs joueurs.
- [ ] Permettre de quitter avant le lancement.
- [ ] Adapter les points d'apparition à quatre joueurs.
- [ ] Adapter le HUD à quatre joueurs.

### Validation matérielle

- [ ] Tester clavier + manette.
- [ ] Tester deux manettes.
- [ ] Tester quatre joueurs avec les périphériques disponibles.
- [ ] Vérifier les déconnexions/reconnexions.

## Critères de validation

- Deux à quatre joueurs peuvent rejoindre et jouer.
- Chaque périphérique n'agit que sur son joueur.
- Le jeu reste lisible à quatre.
- Une déconnexion ne bloque pas la partie.

---

# Phase 7 — Game feel rétro + moderne

## Objectif

Donner à Blood Relay son identité visuelle et sonore sans toucher au cœur des règles.

## 7.1 Effets d'impact

- [ ] Ajouter muzzle flash.
- [ ] Ajouter flash d'impact.
- [ ] Ajouter étincelles et poussière selon la surface.
- [ ] Ajouter screen shake paramétrable.
- [ ] Ajouter hit stop très court.
- [ ] Ajouter recul visuel de caméra.
- [ ] Ajouter un très léger ralenti sur les éliminations fortes.

## 7.2 Sang

- [ ] Remplacer les projections placeholder par des particules convaincantes.
- [ ] Ajouter éclaboussures sur les murs.
- [ ] Ajouter traces temporaires sur le décor.
- [ ] Ajouter traces de pas sanglantes.
- [ ] Améliorer le rendu des flaques.
- [ ] Ajouter reflet ou brillance légère.
- [ ] Ajouter séchage visuel progressif.
- [ ] Garder la quantité gameplay indépendante de tous ces effets.

## 7.3 Éclairage et rendu

- [ ] Définir une palette temporaire cohérente.
- [ ] Ajouter éclairage simple WebGL.
- [ ] Ajouter glow très léger aux éléments importants.
- [ ] Ajouter une distorsion uniquement sur les impacts majeurs.
- [ ] Vérifier qu'aucun effet ne masque les joueurs.
- [ ] Ajouter des options d'intensité pour shake et flash.

## 7.4 Audio

- [ ] Ajouter sons de revolver et shotgun.
- [ ] Ajouter son de mêlée.
- [ ] Ajouter sons d'impact.
- [ ] Ajouter son de récupération du sang.
- [ ] Ajouter son de transfusion.
- [ ] Ajouter sons de mort et respawn.
- [ ] Ajouter une ambiance ou boucle musicale temporaire.
- [ ] Éviter la saturation lorsque plusieurs événements se déclenchent.

## Critères de validation

- Le jeu est reconnaissable sur une courte vidéo.
- Chaque arme est identifiable au son et à l'impact.
- Le sang est spectaculaire mais lisible.
- Le rendu pixel-art reste net.
- Les effets modernes renforcent les actions au lieu de distraire.

---

# Phase 8 — Menus, options et accessibilité MVP

## Objectif

Rendre le jeu utilisable sans outils de debug.

## Tâches

### Menu principal

- [ ] Créer `MenuScene`.
- [ ] Ajouter logo temporaire.
- [ ] Ajouter « Jouer ».
- [ ] Ajouter « Options ».
- [ ] Ajouter « Crédits ».
- [ ] Ajouter connexion des joueurs.
- [ ] Ajouter choix d'arme.
- [ ] Ajouter indication concise des contrôles.

### Navigation

- [ ] Rendre le menu contrôlable au clavier.
- [ ] Rendre le menu contrôlable à la manette.
- [ ] Gérer correctement focus et retour.

### Options essentielles

- [ ] Volume général.
- [ ] Volume musique.
- [ ] Volume effets.
- [ ] Intensité des secousses.
- [ ] Intensité des flashes.
- [ ] Vibration on/off.
- [ ] Mode daltonien initial ou symboles complémentaires.
- [ ] Réduction de la quantité de sang visuel sans modifier le gameplay.
- [ ] Sauvegarde locale des options.

## Critères de validation

- Le jeu peut être lancé et configuré sans explication externe.
- Les menus fonctionnent à la manette.
- Le HUD reste lisible à quatre joueurs.
- Réduire les effets visuels ne change jamais les règles.

---

# Phase 9 — Validation, stabilisation et publication du MVP

## Objectif

Produire une première version publique stable et mesurer si Blood Relay mérite la production complète.

## 9.1 Instrumentation et équilibrage

- [ ] Mesurer la durée moyenne d'une manche.
- [ ] Mesurer sang produit par joueur.
- [ ] Mesurer sang récupéré.
- [ ] Mesurer nombre de transfusions.
- [ ] Mesurer temps passé à faible vie.
- [ ] Mesurer éliminations par arme.
- [ ] Ajuster dégâts du revolver.
- [ ] Ajuster dégâts du shotgun.
- [ ] Ajuster recul.
- [ ] Ajuster mêlée.
- [ ] Ajuster esquive.
- [ ] Ajuster hémorragie.
- [ ] Ajuster capacité de réserve.
- [ ] Ajuster vitesse d'absorption.
- [ ] Ajuster vitesse et rendement de transfusion.
- [ ] Ajuster durée de vie des flaques.

## 9.2 Tests techniques

- [ ] Ajouter Playwright pour le smoke test du lancement si utile.
- [ ] Vérifier TypeScript.
- [ ] Vérifier lint.
- [ ] Vérifier Vitest.
- [ ] Vérifier build production.
- [ ] Vérifier absence d'erreurs console majeures.
- [ ] Profiler projectiles, particules et flaques.
- [ ] Vérifier stabilité sur plusieurs manches consécutives.
- [ ] Vérifier les pertes de focus.
- [ ] Vérifier pause/reprise.
- [ ] Vérifier les manettes disponibles.

## 9.3 CI et publication

- [ ] Ajouter GitHub Actions pour build, lint et tests.
- [ ] Configurer le déploiement statique.
- [ ] Ajouter numéro de version.
- [ ] Ajouter changelog.
- [ ] Ajouter crédits et licences.
- [ ] Créer une page de présentation minimale.
- [ ] Créer quelques captures ou un GIF.
- [ ] Publier **Blood Relay MVP 0.1**.

## Critères de validation du MVP

Le MVP est validé uniquement si :

- les joueurs se battent volontairement pour certaines flaques ;
- récupérer du sang constitue un choix tactique ;
- la transfusion crée des fenêtres de vulnérabilité intéressantes ;
- les combats produisent des retournements de situation ;
- le sang est une mécanique et non un simple effet ;
- les deux armes sont viables ;
- les parties donnent envie d'être relancées ;
- le jeu reste stable et fluide à quatre joueurs.

Si ces critères ne sont pas remplis, **ne pas commencer la production du jeu final**. Revenir aux phases 3 à 5 et retravailler la boucle centrale.

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

- [ ] Créer une abstraction de contrôleur.
- [ ] Ajouter un bot simple.
- [ ] Ajouter navigation dans l’arène.
- [ ] Ajouter détection des plateformes.
- [ ] Ajouter choix de cible.
- [ ] Ajouter décision de tir.
- [ ] Ajouter décision de mêlée.
- [ ] Ajouter esquive.
- [ ] Ajouter recherche de sang.
- [ ] Ajouter décision de transfusion.
- [ ] Ajouter plusieurs niveaux de difficulté.
- [ ] Ajouter comportement d’équipe.
- [ ] Ajouter mode entraînement.
- [ ] Ajouter mannequins de test.
- [ ] Ajouter affichage des hitboxes.
- [ ] Ajouter rechargement instantané de l’arène de test.

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

---

# 8. Ordre recommandé de réalisation

## Étape 1 — Atteindre la mécanique centrale

Ordre strict :

1. socle technique ;
2. déplacement à deux ;
3. revolver et dégâts ;
4. sang ;
5. absorption ;
6. transfusion ;
7. première partie avec score.

À ce stade, Blood Relay doit déjà être reconnaissable même avec des rectangles et des placeholders.

## Étape 2 — Valider le fun avant le contenu

Tester à deux plusieurs manches.

Ne pas ajouter de contenu tant que :

- le sang n'influence pas les trajectoires ;
- personne ne prend de risque pour le récupérer ;
- la transfusion n'est pas un choix tactique ;
- le combat serait tout aussi bon sans la mécanique centrale.

## Étape 3 — Fermer le MVP

Ajouter :

- shotgun ;
- mêlée ;
- esquive ;
- hémorragie ;
- 2 à 4 joueurs ;
- manettes ;
- game feel ;
- menus ;
- options essentielles.

## Étape 4 — Publier et observer

Stabiliser, instrumenter et publier le MVP 0.1.

La production complète n'est autorisée qu'après validation du MVP.

## Étape 5 — Production du jeu final

Ajouter progressivement :

- direction artistique définitive ;
- personnages ;
- arsenal ;
- arènes ;
- modes ;
- état exsangue ;
- bots.

## Étape 6 — Réseau

Commencer le multijoueur en ligne uniquement lorsque :

- la boucle locale est excellente ;
- la simulation est stable ;
- les règles sont suffisamment figées ;
- les armes principales sont équilibrées ;
- l'état du jeu est sérialisable ;
- quatre joueurs locaux fonctionnent correctement.

## Étape 7 — Finalisation

Ajouter ensuite :

- progression cosmétique ;
- accessibilité complète ;
- audio définitif ;
- replays ;
- polish ;
- publication 1.0.

---

# 9. Risques principaux

## Risque 1 — Le sang n'influence pas réellement les joueurs

### Symptôme

Les joueurs continuent à tirer sans chercher à récupérer les flaques.

### Réponses possibles

- augmenter l'importance du soin ;
- réduire les autres sources de récupération ;
- rendre la transfusion plus rapide ;
- concentrer davantage le sang ;
- placer les flaques dans des zones contestées ;
- réduire la vie maximale ;
- augmenter légèrement l'hémorragie.

---

## Risque 2 — Les combats deviennent trop longs

### Symptôme

Les joueurs récupèrent continuellement leur vie.

### Réponses possibles

- limiter le rendement de la transfusion ;
- réduire la capacité de réserve ;
- faire disparaître le sang plus vite ;
- interrompre plus facilement la transfusion ;
- augmenter la létalité.

---

## Risque 3 — L'écran devient illisible

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

Le rendu du sang ou l'architecture ralentissent le gameplay.

### Réponses possibles

- revenir à des flaques simples ;
- fusionner uniquement les flaques compatibles ;
- découpler strictement rendu et quantité ;
- reporter les shaders ;
- supprimer les abstractions sans usage concret ;
- ne jamais introduire de simulation de fluide pour « faire joli ».

---

## Risque 5 — Le multijoueur en ligne bloque le projet

### Symptôme

Le réseau consomme plus de temps que le gameplay.

### Réponse

Ne pas commencer le réseau avant validation complète du jeu local.

---

## Risque 6 — Le jeu ressemble à un arena shooter classique

### Symptôme

Le sang sert surtout à l'esthétique.

### Réponses possibles

- renforcer la récupération ;
- concevoir les arènes autour de la circulation du sang ;
- suivre les métriques de récupération ;
- introduire ensuite Relais et Banque de sang ;
- supprimer les mécaniques qui détournent inutilement de la ressource centrale.

---

# 10. Définition de terminé

## Prototype central terminé

Le prototype central est terminé lorsque :

- deux joueurs clavier peuvent s'affronter ;
- le revolver fonctionne ;
- les dégâts fonctionnent ;
- le sang est produit ;
- les flaques sont récupérables ;
- une réserve est visible ;
- la transfusion fonctionne ;
- mort et respawn fonctionnent ;
- une manche avec score peut être jouée.

## MVP terminé

Le MVP est terminé lorsque :

- deux à quatre joueurs peuvent jouer localement ;
- clavier et manettes sont gérés ;
- revolver et fusil à pompe fonctionnent ;
- mêlée, esquive et hémorragie fonctionnent ;
- le sang est produit, visible et récupérable ;
- la transfusion fonctionne ;
- les joueurs se battent volontairement pour les flaques ;
- les menus et le HUD sont utilisables ;
- le game feel est suffisamment fort pour présenter le jeu ;
- le jeu tient 60 FPS sur une machine modeste ;
- aucun bug bloquant n'est connu ;
- le jeu est publiquement accessible.

## Version 1.0 terminée

La version 1.0 est terminée lorsque :

- le contenu cible est intégré ;
- le jeu local est stable ;
- le jeu en ligne est stable s'il est retenu ;
- les options d'accessibilité sont présentes ;
- les performances sont validées ;
- le tutoriel fonctionne ;
- les replays fonctionnent ;
- les builds de distribution sont testés ;
- les pages de publication sont prêtes ;
- aucun bug critique ou majeur n'est connu.

---

# 11. Règle d'exécution du plan

Lors de la réalisation :

- suivre les phases dans l'ordre ;
- cocher les tâches réellement terminées au fur et à mesure ;
- ne pas cocher une tâche uniquement parce qu'elle compile ;
- tester le comportement lorsqu'une tâche concerne le gameplay ou le rendu ;
- garder le build fonctionnel à la fin de chaque lot ;
- revenir à la mécanique centrale si les tests de jeu montrent qu'elle n'est pas assez intéressante ;
- ne jamais commencer une grosse fonctionnalité future pour contourner un problème du MVP.

Le fichier `PLAN.md` constitue la source de vérité de l'avancement.
