# Blood Relay

Blood Relay est un prototype local **Phaser 3 + TypeScript** orienté mêlée/action à 2-4 joueurs.

## Concept

- Arène fixe 1280×720.
- Deux armes principales (revolver et fusil à pompe), mêlée, esquive, transfusion.
- Mécanique centrale de sang : dégâts → sang au sol → récupération → soins.
- Manches en best-of, interface HUD et statistiques de fin de match.

## Expérience cible

- Démarrage rapide en local.
- Parties courtes, lisibilité forte, collisions lisibles.
- Feedback visuel et audio de combat (flashs, particules, sons générés).

## Périmètre MVP

- 2 à 4 joueurs locale.
- Clavier et manettes supportées.
- Options de réglage (audio, contrôle, visuel).
- Debug et métriques de playtest automatisables.

## Technologies

- Phaser 3
- TypeScript
- Vite
- Vitest
- Playwright

## Où en est la réalisation

- Base du jeu jouable (menu, arène, combat, sang, transfusion).
- Stabilisation : pause/reprise, perte/retour de focus, debug FPS.
- Périmètre publicisation débuté (aide/crédits/confidentialité/changelog).
