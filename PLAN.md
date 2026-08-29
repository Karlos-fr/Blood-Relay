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

### Règle de saut et de level design

- Toutes les plateformes nécessaires au parcours normal doivent être atteignables avec le **saut standard** depuis au moins un support adjacent logique.
- La hauteur et la vitesse du saut sont des paramètres de **game feel** : elles sont validées manuellement en jouant sur GitHub Pages et ne doivent pas être figées par un seuil numérique arbitraire dans les tests unitaires.
- Le level design doit être construit autour du réglage de saut validé ; toute modification ultérieure du saut impose de retester manuellement les liaisons entre plateformes.
- Réglage provisoire du prototype : `PLAYER_JUMP_SPEED = 600` avec `GRAVITY_Y = 1200`, soit environ 150 px de hauteur théorique. Ce réglage reste ajustable après test joueur.

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
- [x] Afficher une arène vide avec un sol temporaire.
- [x] Afficher la version du jeu en mode debug.
- [x] Ajouter un README minimal décrivant le lancement.
- [x] Configurer Vite pour le chemin GitHub Pages `/Blood-Relay/`.
- [x] Ajouter un workflow GitHub Pages déclenché sur `main`.
- [x] Vérifier le build de production via GitHub Actions.
- [x] Vérifier les tests et le lint via GitHub Actions.
- [x] Vérifier le déploiement GitHub Pages.
- [x] Valider visuellement la version déployée sur GitHub Pages.

## Ne pas faire dans cette phase

- Playwright ;
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
- Le workflow GitHub Pages publie `dist/` depuis `main`.
- L'arène 960 × 540 s'affiche correctement sur GitHub Pages.
- La validation visuelle manuelle est effectuée avant de passer à la phase suivante.

## Boucle de validation

À partir de cette phase, GitHub Pages est la méthode de validation visuelle officielle :

1. chaque lot jouable est poussé sur `main` ;
2. GitHub Actions exécute le lint, les tests et le build ;
3. le build `dist/` est publié sur GitHub Pages ;
4. la version déployée est testée manuellement ;
5. les tâches nécessitant une validation visuelle ne sont cochées qu'après ce test.

URL cible : `https://karlos-fr.github.io/Blood-Relay/`.

---

# Phase 1 — Arène et déplacement à deux

## Objectif

Pouvoir jouer à deux sur le même clavier dans une arène de côté tenant intégralement sur l'écran.

## Tâches

### Arène

- [x] Créer l'arène de référence du prototype.
- [x] Ajouter le sol.
- [x] Ajouter deux plateformes traversables.
- [x] Ajouter deux points d'apparition.
- [x] Définir les limites de l'arène.
- [x] Empêcher toute sortie de l'écran.
- [x] Garder la caméra fixe sur toute l'arène.
- [x] Ajouter un affichage debug facultatif des collisions.

### Joueurs

- [x] Créer une entité `Player` minimale.
- [x] Créer deux joueurs avec couleurs distinctes.
- [x] Ajouter la position et la vélocité.
- [x] Ajouter l'orientation gauche/droite.
- [x] Ajouter l'état sol / air.
- [x] Ajouter les collisions joueur-décor.
- [x] Ajouter les collisions joueur-joueur si elles améliorent le gameplay.

### Contrôles temporaires

- [x] Ajouter un mapping clavier joueur 1.
- [x] Ajouter un mapping clavier joueur 2.
- [x] Ajouter déplacement gauche/droite.
- [x] Ajouter accélération et décélération simples.
- [x] Ajouter saut.
- [x] Ajouter chute.
- [x] Ajouter descente à travers les plateformes.

### Placeholders

- [x] Utiliser des formes ou sprites temporaires simples.
- [x] Ajouter une lecture visuelle claire de la direction regardée.
- [ ] Valider manuellement la hauteur du saut et l’accessibilité de toutes les plateformes de référence.
- [ ] Valider manuellement la Phase 1 sur GitHub Pages avec deux joueurs au clavier.

## Critères de validation

- Deux joueurs peuvent se déplacer simultanément.
- Le saut est réactif.
- Toutes les plateformes de référence sont atteignables avec le saut standard validé.
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
- [ ] Définir une capacité maximale de réserve par joueur.
- [ ] Ajouter des tests unitaires du modèle de quantité.

### Projection

- [ ] À l'impact, créer une projection visuelle simple.
- [ ] Faire apparaître une flaque au sol.
- [ ] Orienter approximativement la projection selon l'impact.
- [ ] Conserver l'identité du joueur ayant perdu le sang.
- [ ] Limiter le nombre d'effets visuels actifs.

### Flaques

- [ ] Donner une quantité à chaque flaque.
- [ ] Donner une couleur correspondant au propriétaire d'origine.
- [ ] Fusionner les flaques proches provenant du même propriétaire.
- [ ] Ne pas fusionner les quantités de propriétaires différents.
- [ ] Faire diminuer visuellement une flaque quand elle est consommée.
- [ ] Supprimer une flaque vide.
- [ ] Ajouter un assèchement simple si nécessaire pour éviter l'accumulation infinie.

### Absorption

- [ ] Détecter le contact joueur-flaque.
- [ ] Absorber progressivement le sang disponible.
- [ ] Remplir la réserve du joueur.
- [ ] Diminuer la quantité de la flaque.
- [ ] Arrêter lorsque la réserve est pleine.
- [ ] Ajouter un feedback visuel placeholder.
- [ ] Ajouter des tests unitaires pour capacité, consommation et réserve pleine.

### Transfusion

- [ ] Ajouter une touche de transfusion pour chaque joueur.
- [ ] Ralentir fortement ou immobiliser le joueur pendant la transfusion.
- [ ] Interdire le tir pendant la transfusion.
- [ ] Consommer progressivement la réserve.
- [ ] Restaurer progressivement la vie.
- [ ] Ne jamais dépasser la vie maximale.
- [ ] Interrompre la transfusion si le joueur reçoit des dégâts.
- [ ] Limiter le rendement pour éviter les combats infinis.
- [ ] Ajouter un feedback visuel placeholder.
- [ ] Ajouter des tests unitaires du soin.

### Première instrumentation

- [ ] Compter le sang produit.
- [ ] Compter le sang récupéré.
- [ ] Compter les transfusions.
- [ ] Pouvoir afficher ces valeurs en debug.

## Critères de validation

- Blesser un joueur crée une ressource récupérable.
- Le sang visible correspond à une vraie quantité de gameplay.
- Marcher sur une flaque permet de remplir une réserve.
- La transfusion convertit cette réserve en vie.
- La transfusion expose réellement le joueur.
- Deux joueurs peuvent naturellement se retrouver en compétition pour une flaque.
- Les règles principales du sang sont couvertes par des tests unitaires.

## Test décisif

Jouer plusieurs manches à deux avec uniquement le revolver.

La phase est validée si cette situation apparaît naturellement :

> Un joueur blesse fortement son adversaire, ne parvient pas à l'achever, puis les deux joueurs modifient leur trajectoire pour tenter de contrôler le sang tombé au sol.

Si les joueurs ignorent les flaques, ne pas continuer vers le contenu. Revoir immédiatement les valeurs et règles du sang.

---

# Phase 4 — Première vraie partie

## Objectif

Transformer la vertical slice en partie complète rejouable.

## Tâches

### Manche

- [ ] Créer un gestionnaire de manche simple.
- [ ] Ajouter un compte à rebours court.
- [ ] Ajouter une durée de manche configurable.
- [ ] Ajouter score par élimination.
- [ ] Ajouter condition de victoire.
- [ ] Ajouter fin de manche.
- [ ] Ajouter bouton ou touche pour rejouer immédiatement.

### HUD minimal

- [ ] Afficher la vie joueur 1.
- [ ] Afficher la vie joueur 2.
- [ ] Afficher la réserve de sang joueur 1.
- [ ] Afficher la réserve de sang joueur 2.
- [ ] Afficher le score.
- [ ] Afficher le temps restant.
- [ ] Garder le centre de l'écran dégagé.

### Résultats

- [ ] Afficher le vainqueur.
- [ ] Afficher éliminations et morts.
- [ ] Afficher sang produit.
- [ ] Afficher sang récupéré.
- [ ] Afficher nombre de transfusions.

## Critères de validation

- Une partie complète peut commencer et finir sans intervention externe.
- Le vainqueur est toujours correctement déterminé.
- Une revanche peut démarrer en quelques secondes.
- Les statistiques permettent déjà d'observer l'utilisation du sang.

## Premier playtest humain obligatoire

À la fin de cette phase, réaliser plusieurs parties à deux avant toute extension de contenu.

Décider explicitement :

- la mécanique du sang est-elle amusante ?
- crée-t-elle réellement des retournements ?
- la transfusion est-elle trop forte ou trop faible ?
- faut-il continuer le projet tel quel ou modifier le cœur du jeu ?

---

# Phase 5 — Gameplay MVP complet

## Objectif

Ajouter les mécaniques secondaires uniquement après validation du cœur du jeu.

## 5.1 Fusil à pompe

- [ ] Ajouter le fusil à pompe.
- [ ] Ajouter plusieurs plombs.
- [ ] Ajouter dispersion.
- [ ] Ajouter courte portée efficace.
- [ ] Ajouter fort recul du tireur.
- [ ] Ajouter forte projection de la cible.
- [ ] Produire une projection de sang plus large que le revolver.
- [ ] Ajouter cadence lente.
- [ ] Équilibrer revolver et shotgun.

## 5.2 Mêlée

- [ ] Ajouter une attaque de mêlée commune.
- [ ] Ajouter zone d'impact courte.
- [ ] Ajouter temps de récupération.
- [ ] Ajouter recul de la cible.
- [ ] Interrompre une transfusion.
- [ ] Empêcher le spam.
- [ ] Ajouter feedback visuel placeholder.

## 5.3 Esquive

- [ ] Ajouter une esquive courte.
- [ ] Ajouter temps de recharge.
- [ ] Définir si une courte invulnérabilité améliore le jeu.
- [ ] Ajouter feedback visuel de recharge.
- [ ] Empêcher l'esquive de devenir le déplacement principal.

## 5.4 Hémorragie

- [ ] Définir un seuil critique de vie.
- [ ] Produire périodiquement de petites quantités de sang sous ce seuil.
- [ ] Laisser une piste exploitable par les adversaires.
- [ ] Arrêter l'hémorragie après soin suffisant.
- [ ] Équilibrer pour éviter un effet boule de neige excessif.

## Critères de validation

- Revolver et shotgun ont des rôles différents.
- La mêlée sert principalement à la proximité et à interrompre.
- L'esquive apporte de la mobilité sans casser la lecture.
- L'hémorragie renforce la mécanique de sang.
- Aucune mécanique secondaire ne rend la récupération du sang moins importante.

---

# Phase 6 — Multijoueur local propre

## Objectif

Passer du prototype clavier à une vraie expérience canapé 2 à 4 joueurs.

## Tâches

### Abstraction des entrées

- [ ] Créer `PlayerInput` ou équivalent indépendant du périphérique.
- [ ] Définir gauche / droite.
- [ ] Définir saut / descente.
- [ ] Définir tir.
- [ ] Définir mêlée.
- [ ] Définir esquive.
- [ ] Définir transfusion.
- [ ] Adapter les deux joueurs clavier existants à cette abstraction.

### Manettes

- [ ] Ajouter Gamepad API.
- [ ] Détecter les manettes connectées.
- [ ] Ajouter sticks et D-pad.
- [ ] Ajouter zone morte.
- [ ] Mapper les actions principales.
- [ ] Ajouter vibration sur impacts importants.
- [ ] Gérer déconnexion/reconnexion.

### 2 à 4 joueurs

- [ ] Ajouter écran simple « rejoindre ».
- [ ] Associer un périphérique à un joueur.
- [ ] Permettre 2 joueurs.
- [ ] Permettre 3 joueurs.
- [ ] Permettre 4 joueurs.
- [ ] Ajouter couleurs clairement distinctes.
- [ ] Adapter HUD au nombre de joueurs.
- [ ] Ajouter points de spawn suffisants.

## Critères de validation

- Deux joueurs manette fonctionnent.
- Clavier + manette fonctionne.
- Quatre joueurs peuvent rejoindre.
- Chaque périphérique contrôle exactement un joueur.
- Une déconnexion ne bloque pas la partie.
- L'arène reste lisible à quatre joueurs.

---

# Phase 7 — Game feel du MVP

## Objectif

Passer d'un prototype fonctionnel à un jeu qui donne envie d'être montré.

## Principe

Le pixel art doit rester simple. Les effets modernes donnent l'impact.

## Tâches

### Impacts

- [ ] Ajouter muzzle flash.
- [ ] Ajouter flash d'impact.
- [ ] Ajouter étincelles adaptées aux surfaces.
- [ ] Améliorer les projections de sang.
- [ ] Ajouter hit stop très court.
- [ ] Ajouter recul de caméra paramétrable.
- [ ] Ajouter screen shake contrôlé.

### Sang

- [ ] Améliorer les gouttes.
- [ ] Améliorer les flaques.
- [ ] Ajouter éclaboussures sur le décor.
- [ ] Ajouter traces de pas sanglantes.
- [ ] Ajouter léger reflet ou brillance des flaques.
- [ ] Ajouter assèchement visuel.
- [ ] Limiter automatiquement les decals anciens.

### Effets modernes

- [ ] Ajouter éclairage simple.
- [ ] Ajouter glow très contrôlé.
- [ ] Ajouter distorsion sur gros impacts.
- [ ] Ajouter ralenti très court sur élimination décisive.
- [ ] Ajouter effet de spawn.
- [ ] Ajouter effet de transfusion.
- [ ] Tester que chaque effet peut être réduit ou désactivé.

### Audio

- [ ] Ajouter ou générer son de revolver.
- [ ] Ajouter ou générer son de shotgun.
- [ ] Ajouter son de mêlée.
- [ ] Ajouter son d'impact.
- [ ] Ajouter son d'absorption.
- [ ] Ajouter son de transfusion.
- [ ] Ajouter son de mort.
- [ ] Ajouter son de respawn.
- [ ] Limiter les sons simultanés.
- [ ] Éviter toute saturation audio.

## Critères de validation

- Une capture vidéo sans explication donne envie de comprendre le jeu.
- Les impacts ont du poids.
- Le sang reste parfaitement lisible comme ressource.
- Les effets ne cachent jamais durablement un joueur.
- Les options permettent de réduire les effets agressifs.

---

# Phase 8 — UI et menus du MVP

## Objectif

Rendre le jeu autonome et compréhensible sans intervention du développeur.

## Tâches

### Menu

- [ ] Ajouter écran titre.
- [ ] Ajouter Jouer.
- [ ] Ajouter Options.
- [ ] Ajouter Crédits.
- [ ] Ajouter connexion des joueurs.
- [ ] Ajouter sélection d'arme.
- [ ] Ajouter sélection d'arène simplifiée.
- [ ] Rendre les menus utilisables à la manette.

### HUD final MVP

- [ ] Afficher clairement la vie.
- [ ] Afficher clairement la réserve de sang.
- [ ] Afficher score et chrono.
- [ ] Afficher arme équipée.
- [ ] Afficher hémorragie.
- [ ] Afficher transfusion.
- [ ] Garder une couleur cohérente par joueur.
- [ ] Vérifier lisibilité à 1080p.
- [ ] Vérifier lisibilité sur écran portable.

### Options essentielles

- [ ] Volume général.
- [ ] Volume effets.
- [ ] Volume musique si présente.
- [ ] Intensité screen shake.
- [ ] Intensité flashs.
- [ ] Vibration.
- [ ] Réduction du sang visuel.
- [ ] Mode daltonien initial.
- [ ] Sauvegarde locale des options.

## Critères de validation

- Un nouveau joueur peut lancer une partie sans explication orale.
- Tous les menus sont contrôlables à la manette.
- Le HUD reste lisible à quatre joueurs.

---

# Phase 9 — Validation, équilibrage et publication du MVP

## Objectif

Stabiliser Blood Relay 0.1 et décider s'il mérite une production complète.

## Instrumentation

- [ ] Mesurer durée moyenne des manches.
- [ ] Mesurer sang produit.
- [ ] Mesurer sang récupéré.
- [ ] Mesurer nombre de transfusions.
- [ ] Mesurer temps passé à faible vie.
- [ ] Mesurer éliminations par arme.
- [ ] Mesurer utilisation mêlée.
- [ ] Mesurer utilisation esquive.

## Tests de jeu

- [ ] Test à 2 joueurs.
- [ ] Test à 3 joueurs.
- [ ] Test à 4 joueurs.
- [ ] Vérifier compréhension spontanée des flaques.
- [ ] Vérifier compréhension de la transfusion.
- [ ] Vérifier compétition autour du sang.
- [ ] Noter comportements émergents.
- [ ] Identifier les règles inutiles.
- [ ] Supprimer les mécaniques qui diluent le concept.

## Équilibrage

- [ ] Ajuster vie maximale.
- [ ] Ajuster dégâts revolver.
- [ ] Ajuster dégâts shotgun.
- [ ] Ajuster cadence.
- [ ] Ajuster recul.
- [ ] Ajuster quantité de sang par dégât.
- [ ] Ajuster capacité de réserve.
- [ ] Ajuster vitesse d'absorption.
- [ ] Ajuster vitesse de transfusion.
- [ ] Ajuster rendement du soin.
- [ ] Ajuster durée des flaques.
- [ ] Ajuster hémorragie.
- [ ] Ajuster durée de manche.

## Stabilisation

- [ ] Ajouter pause.
- [ ] Gérer perte de focus.
- [ ] Corriger les collisions bloquantes.
- [ ] Corriger les problèmes de périphériques.
- [ ] Ajouter Playwright pour lancement/menu/boucle essentielle.
- [ ] Ajouter compteur FPS debug.
- [ ] Profiler particules.
- [ ] Profiler projectiles.
- [ ] Profiler flaques.
- [ ] Vérifier absence de fuites évidentes.
- [ ] Vérifier sessions longues.

## Publication MVP

- [ ] Ajouter GitHub Actions.
- [ ] Ajouter déploiement web.
- [ ] Ajouter version du build.
- [ ] Ajouter changelog.
- [ ] Ajouter README complet.
- [ ] Ajouter contrôles dans le README.
- [ ] Ajouter captures d'écran.
- [ ] Ajouter GIF ou courte vidéo.
- [ ] Publier Blood Relay 0.1.
- [ ] Collecter les premiers retours externes.

## Gate de production

Ne commencer la production complète que si :

- les joueurs se battent réellement pour le sang ;
- la transfusion crée des prises de risque ;
- les manches produisent des retournements ;
- le jeu donne envie d'enchaîner les parties ;
- la lisibilité reste bonne à quatre joueurs.

Sinon, retravailler ou abandonner le concept plutôt que d'ajouter du contenu.

---

# 6. Développement du jeu final après validation du MVP

# Phase 10 — Direction artistique définitive

## Objectif

Créer l'identité visuelle finale sans perdre la lisibilité du prototype.

## Tâches

- [ ] Définir la résolution native des sprites.
- [ ] Définir la palette principale.
- [ ] Définir les couleurs des joueurs.
- [ ] Définir le contraste personnages/décors.
- [ ] Créer les personnages définitifs.
- [ ] Créer animation idle.
- [ ] Créer animation course.
- [ ] Créer animation saut.
- [ ] Créer animation chute.
- [ ] Créer animation esquive.
- [ ] Créer animation tir.
- [ ] Créer animation mêlée.
- [ ] Créer animation blessure.
- [ ] Créer animation hémorragie.
- [ ] Créer animation transfusion.
- [ ] Créer animation mort.
- [ ] Créer animation respawn.
- [ ] Créer effets de sang définitifs.
- [ ] Créer effets d'armes définitifs.
- [ ] Créer UI définitive.
- [ ] Créer logo Blood Relay.
- [ ] Créer courte animation d'introduction.
- [ ] Vérifier rendu dark/light des supports web externes si nécessaire.

## Critères de validation

- Chaque joueur reste identifiable instantanément.
- La provenance des flaques reste lisible.
- Les effets modernes complètent le pixel art au lieu de le masquer.
- Une capture du jeu possède une identité reconnaissable.

---

# Phase 11 — Personnages

## Objectif

Introduire de la variété sans créer un hero shooter.

## Principes

Tous les personnages possèdent les mêmes actions.

Les différences autorisées sont légères :

- vitesse ;
- masse ;
- capacité de réserve ;
- vitesse de transfusion ;
- résistance à l'hémorragie.

Pas de compétence active exclusive au lancement.

## Tâches

- [ ] Créer format déclaratif de personnage.
- [ ] Ajouter personnage équilibré.
- [ ] Ajouter personnage rapide.
- [ ] Ajouter personnage lourd.
- [ ] Ajouter personnage spécialisé réserve.
- [ ] Ajouter personnage spécialisé transfusion.
- [ ] Ajouter sixième archétype après tests.
- [ ] Limiter les écarts statistiques.
- [ ] Ajouter sélection personnage.
- [ ] Ajouter preview.
- [ ] Ajouter descriptions courtes.
- [ ] Ajouter quatre palettes par personnage.
- [ ] Tester chaque matchup.
- [ ] Vérifier qu'aucun personnage ne devient obligatoire.

## Contenu final visé

- 6 personnages ;
- 4 palettes par personnage.

---

# Phase 12 — Arsenal complet

## Objectif

Ajouter des styles de combat distincts sans perdre la lisibilité.

## Arsenal cible

- revolver lourd ;
- fusil à pompe ;
- pistolet-mitrailleur ;
- arbalète ;
- machette ;
- lance-grenades ;
- fusil perforant ;
- canon scié.

## Architecture

- [ ] Créer format déclaratif unifié pour les armes.
- [ ] Définir dégâts.
- [ ] Définir cadence.
- [ ] Définir recul.
- [ ] Définir quantité et style de sang produit.
- [ ] Définir portée.
- [ ] Définir comportement projectile.
- [ ] Définir comportement contre décor.
- [ ] Définir sons.
- [ ] Définir effets.
- [ ] Ajouter tests de configuration.

## Pistolet-mitrailleur

- [ ] Tir automatique.
- [ ] Faibles dégâts unitaires.
- [ ] Dispersion croissante.
- [ ] Piste de sang progressive.
- [ ] Contrôle du spam visuel et audio.

## Arbalète

- [ ] Projectile lent.
- [ ] Forte lisibilité.
- [ ] Traversée éventuelle.
- [ ] Possibilité de fixer temporairement une cible au décor si le test est amusant.
- [ ] Concentration du sang autour de l'impact.

## Machette

- [ ] Attaque courte.
- [ ] Gros dégâts à proximité.
- [ ] Forte projection de sang.
- [ ] Petit déplacement d'attaque si nécessaire.
- [ ] Aucun combo complexe par défaut.

## Lance-grenades

- [ ] Trajectoire en arc.
- [ ] Explosion retardée.
- [ ] Dégâts de zone.
- [ ] Projection des joueurs.
- [ ] Projection ou déplacement visuel des flaques.
- [ ] Friendly fire selon le mode.

## Fusil perforant

- [ ] Télégraphie avant tir.
- [ ] Forte vitesse.
- [ ] Pénétration joueurs.
- [ ] Traçante claire.
- [ ] Gros dégâts.

## Canon scié

- [ ] Double tir.
- [ ] Très courte portée.
- [ ] Très forte dispersion.
- [ ] Recul extrême.
- [ ] Forte production de sang.

## Critères de validation

- Les huit armes produisent des décisions différentes.
- Aucun choix n'est supérieur dans toutes les situations.
- La provenance des dégâts reste identifiable.
- La production de sang participe à l'identité de chaque arme.

---

# Phase 13 — Arènes

## Objectif

Créer plusieurs arènes sur un écran exploitant la circulation du sang.

## Règles communes

Chaque arène contient :

- une zone centrale contestée ;
- deux chemins secondaires ;
- plusieurs hauteurs ;
- au moins une zone risquée ;
- un gimmick principal maximum ;
- aucun bunker permanent.

## Format de niveau

- [ ] Créer format déclaratif d'arène.
- [ ] Ajouter géométrie.
- [ ] Ajouter spawns.
- [ ] Ajouter plateformes traversables.
- [ ] Ajouter éléments interactifs.
- [ ] Ajouter preview.
- [ ] Ajouter validation des spawns.
- [ ] Ajouter rotation aléatoire.
- [ ] Ajouter sélection manuelle.

## Arène 1 — Abattoir

- [ ] Tapis roulant.
- [ ] Crochets suspendus visuels.
- [ ] Broyeur central.
- [ ] Tester circulation du sang autour du broyeur.

## Arène 2 — Bloc opératoire

- [ ] Tables mobiles.
- [ ] Portes automatiques.
- [ ] Fort contraste lumineux.
- [ ] Tester lignes de tir.

## Arène 3 — Métro abandonné

- [ ] Train périodique.
- [ ] Avertissement avant passage.
- [ ] Tunnels latéraux.
- [ ] Interaction du train avec joueurs.
- [ ] Dispersion visuelle du sang au passage.

## Arène 4 — Chapelle rouge

- [ ] Sols légèrement inclinés ou architecture convergente.
- [ ] Autel central.
- [ ] Zones hautes.
- [ ] Concentrer naturellement les combats au centre sans automatiser le déplacement des flaques.

## Arène 5 — Usine de transfusion

- [ ] Conduites.
- [ ] Pompes.
- [ ] Aspiration ponctuelle du sang.
- [ ] Rejet ailleurs dans l'arène.
- [ ] Signalisation claire du cycle.

## Arène 6 — Incinérateur

- [ ] Zones chauffées.
- [ ] Feu périodique.
- [ ] Sang séchant plus vite dans certaines zones.
- [ ] Risque/récompense clair.

## Arène 7 — Prison télévisée

- [ ] Portes contrôlées.
- [ ] Écrans géants.
- [ ] Piège événementiel simple.
- [ ] Lisibilité maintenue malgré le décor.

## Arène 8 — Cuve Zéro

- [ ] Gravité modifiée localement si techniquement simple.
- [ ] Plateformes mobiles.
- [ ] Comportement visuel particulier des gouttes.
- [ ] Ne pas casser les règles fondamentales de récupération.

## Tests communs

- [ ] Tester chaque arène à deux.
- [ ] Tester chaque arène à quatre.
- [ ] Vérifier sécurité des spawns.
- [ ] Vérifier absence de zones dominantes.
- [ ] Vérifier circulation autour des flaques.
- [ ] Vérifier 60 FPS.

## Contenu final visé

8 arènes.

---

# Phase 14 — Modes de jeu

## Objectif

Exploiter le système de sang plutôt que simplement modifier le score.

## Carnage

- [ ] Finaliser chacun pour soi.
- [ ] Score cible.
- [ ] Limite de temps.
- [ ] Variantes de durée.

## Dernier vivant

- [ ] Désactiver respawn.
- [ ] Ajouter manches courtes.
- [ ] Dernier joueur vivant gagne.
- [ ] Ajouter format best-of.

## Relais

- [ ] Ajouter équipes.
- [ ] Ajouter réserve de sang d'équipe ou mécanisme de transmission cohérent.
- [ ] Permettre de donner du sang à un allié.
- [ ] Ajouter score équipe.
- [ ] Ajouter HUD équipe.
- [ ] Tester comportements de conservation excessive.
- [ ] Tester retournements de situation.

## Banque de sang

- [ ] Ajouter cuve centrale.
- [ ] Permettre dépôt du sang stocké.
- [ ] Exposer le joueur pendant le dépôt.
- [ ] Ajouter score par quantité déposée.
- [ ] Ajouter perte partielle lors d'une mort.
- [ ] Ajouter indicateur de progression.

## Hémorragie

- [ ] Ajouter perte de vie progressive globale.
- [ ] Ajouter taux configurable.
- [ ] Augmenter l'importance du sang adverse.
- [ ] Garder durée courte.
- [ ] Éviter effet boule de neige automatique.

## Survie coop

- [ ] Ajouter architecture de vagues.
- [ ] Ajouter quelques ennemis simples.
- [ ] Ajouter réserve d'équipe.
- [ ] Ajouter réanimation.
- [ ] Ajouter score de survie.
- [ ] Garder le nombre de types d'ennemis limité.

## Critères de validation

Chaque mode doit répondre à la question :

> Qu'est-ce que la mécanique de sang apporte spécifiquement à ce mode ?

Si la réponse est « rien », supprimer ou revoir le mode.

---

# Phase 15 — État exsangue et réanimation

## Objectif

Ajouter des retournements en équipe sans ralentir le jeu.

## Tâches

- [ ] Ajouter état exsangue à zéro vie dans les modes compatibles.
- [ ] Ajouter déplacement en rampant.
- [ ] Ajouter durée limite.
- [ ] Ajouter attaque très faible ou dernière action défensive.
- [ ] Permettre achèvement par adversaire.
- [ ] Permettre réanimation par allié.
- [ ] Faire coûter du sang à la réanimation.
- [ ] Interrompre réanimation en cas de dégât.
- [ ] Ajouter feedback HUD.
- [ ] Ajouter animations.
- [ ] Ajouter audio.
- [ ] Empêcher réanimations infinies.
- [ ] Désactiver le système dans les modes où il nuit au rythme.

## Critères de validation

- Le joueur à terre reste impliqué.
- L'allié doit prendre un risque réel pour réanimer.
- Le système ne transforme pas une manche de 90 secondes en combat interminable.

---

# Phase 16 — Bots et entraînement

## Objectif

Permettre le test et l'entraînement sans groupe complet.

## Tâches

- [ ] Créer abstraction de contrôleur réutilisable par humain/bot/réseau.
- [ ] Ajouter bot simple.
- [ ] Ajouter navigation adaptée aux arènes fixes.
- [ ] Ajouter détection plateformes.
- [ ] Ajouter choix de cible.
- [ ] Ajouter décision de tir.
- [ ] Ajouter décision mêlée.
- [ ] Ajouter décision esquive.
- [ ] Ajouter recherche de sang.
- [ ] Ajouter décision transfusion.
- [ ] Ajouter trois niveaux de difficulté maximum.
- [ ] Ajouter comportement équipe.
- [ ] Ajouter mode entraînement.
- [ ] Ajouter mannequin immobile.
- [ ] Ajouter affichage hitboxes.
- [ ] Ajouter reset instantané de l'arène de test.

## Critères de validation

- Les bots utilisent réellement le sang.
- Ils servent à apprendre les mécaniques.
- L'IA reste simple à maintenir.

---

# Phase 17 — Multijoueur en ligne

## Objectif

Ajouter le jeu distant uniquement après stabilisation du jeu local.

## Préconditions obligatoires

- [ ] Gameplay local validé.
- [ ] Quatre joueurs locaux stables.
- [ ] Simulation à pas fixe si nécessaire.
- [ ] Entrées indépendantes du périphérique.
- [ ] États importants sérialisables.
- [ ] Règles des armes suffisamment figées.
- [ ] Règles du sang suffisamment figées.

## Préparation simulation

- [ ] Séparer simulation et présentation là où nécessaire.
- [ ] Sérialiser les entrées.
- [ ] Sérialiser l'état de manche.
- [ ] Donner identifiants uniques aux entités réseau.
- [ ] Ajouter snapshots.
- [ ] Ajouter graine aléatoire partagée.
- [ ] Ajouter replay d'entrées.
- [ ] Tester déterminisme des règles critiques.

## Architecture réseau

Privilégier :

- serveur autoritaire ;
- prédiction locale des joueurs ;
- interpolation des autres entités ;
- corrections d'état ;
- rollback limité uniquement si les tests de latence le justifient.

Ne pas implémenter un rollback complexe par principe.

## Serveur

- [ ] Choisir stack serveur au moment de cette phase.
- [ ] Créer lobby.
- [ ] Créer partie.
- [ ] Ajouter salon privé.
- [ ] Ajouter code d'invitation.
- [ ] Ajouter gestion connexions.
- [ ] Ajouter reconnexion courte.
- [ ] Valider entrées.
- [ ] Ajouter logs.
- [ ] Ajouter métriques.

## Client

- [ ] Ajouter connexion serveur.
- [ ] Ajouter lobby.
- [ ] Synchroniser joueurs.
- [ ] Synchroniser projectiles.
- [ ] Synchroniser flaques et quantités.
- [ ] Ajouter interpolation.
- [ ] Ajouter prédiction.
- [ ] Ajouter correction.
- [ ] Ajouter indicateur de latence.
- [ ] Gérer pertes de paquets.
- [ ] Gérer abandon.

## Tests réseau

- [ ] Test LAN.
- [ ] Test 50 ms.
- [ ] Test 100 ms.
- [ ] Test 150 ms.
- [ ] Test perte paquets.
- [ ] Test quatre joueurs.
- [ ] Test déconnexion.
- [ ] Test reconnexion.
- [ ] Vérifier cohérence scores.
- [ ] Vérifier cohérence du sang.

---

# Phase 18 — Progression légère et personnalisation

## Objectif

Créer une raison de rejouer sans avantage compétitif.

## Tâches

- [ ] Ajouter profil local.
- [ ] Ajouter statistiques cumulées.
- [ ] Ajouter défis.
- [ ] Ajouter succès.
- [ ] Ajouter palettes.
- [ ] Ajouter skins d'armes.
- [ ] Ajouter effets de spawn.
- [ ] Ajouter titres.
- [ ] Ajouter bannières.
- [ ] Ajouter déblocages cosmétiques.
- [ ] Ajouter import/export du profil.
- [ ] Ajouter synchronisation facultative seulement si comptes retenus.

## Interdictions

- aucun bonus de dégâts ;
- aucun bonus de vie ;
- aucune arme supérieure réservée à la progression ;
- aucune obligation de grinder avant de jouer normalement.

---

# Phase 19 — Accessibilité

## Objectif

Rendre le jeu utilisable malgré les couleurs, flashs et mouvements rapides.

## Tâches

- [ ] Ajouter palettes daltoniennes.
- [ ] Ajouter symboles ou motifs associés aux joueurs.
- [ ] Ajouter réduction du sang visuel.
- [ ] Ajouter option remplaçant le sang par fluide stylisé si souhaité.
- [ ] Ajouter réduction screen shake.
- [ ] Ajouter désactivation flashs.
- [ ] Ajouter réduction ralentis.
- [ ] Ajouter intensité vibration.
- [ ] Ajouter taille HUD.
- [ ] Ajouter contraste renforcé.
- [ ] Ajouter remappage complet.
- [ ] Ajouter maintien/bascule pour transfusion.
- [ ] Évaluer aide à la visée facultative pour certains périphériques.
- [ ] Documenter les effets sensibles.

---

# Phase 20 — Audio et musique définitifs

## Objectif

Créer une identité sonore lisible et nerveuse.

## Tâches

- [ ] Définir direction musicale.
- [ ] Ajouter thème principal.
- [ ] Ajouter musique ou ambiance par famille d'arènes.
- [ ] Ajouter variations d'intensité.
- [ ] Ajouter annonces de manche.
- [ ] Ajouter annonces victoire.
- [ ] Finaliser sons d'armes.
- [ ] Finaliser sons d'impacts.
- [ ] Finaliser sons de sang.
- [ ] Finaliser sons de transfusion.
- [ ] Finaliser sons d'hémorragie.
- [ ] Ajouter ambiances d'arènes.
- [ ] Ajouter spatialisation stéréo.
- [ ] Ajouter compression/limitation.
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
