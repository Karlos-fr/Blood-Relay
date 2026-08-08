# Blood Relay

Prototype local jusqu’à 4 joueurs, conçu autour d’une arène fixe, en Phaser 3 + Vite.

## Démarrage

```bash
npm install
npm run dev
```

## Structure actuelle

- `src/main.ts` : bootstrap du jeu Phaser.
- `src/scenes/BootScene.ts` : écran de démarrage.
- `src/scenes/MenuScene.ts` : menu local.
- `src/scenes/ArenaScene.ts` : arène prototype (jusqu’à 4 joueurs simultanés).
- `src/scenes/ResultsScene.ts` : écran de fin de manche placeholder.
- `src/gameplay/actors/Player.ts` : entité joueur avec mouvement et état de base.
- `src/input/profiles/keyboard.ts` : abstraction de profil clavier.

## Scripts

- `npm run dev` : lancement en développement.
- `npm run build` : build de production.
- `npm run test` : exécute Vitest.
- `npm run lint` : lint TypeScript/ESLint.
- `npm run format` : formatage Prettier.
- `npm run test:e2e` : lance Playwright si des tests E2E existent.
- `npm run test:e2e:launch` : vérifie le lancement du jeu sur le flux navigateur (Chrome/Edge/Firefox selon la config e2e).
- `npm run test:e2e:phase8` : lance les validations 2/3/4 joueurs du playtest.
- `npm run test:e2e:phase8:2` : lance uniquement la validation Playtest à 2 joueurs.
- `npm run test:e2e:phase8:3` : lance uniquement la validation Playtest à 3 joueurs.
- `npm run test:e2e:phase8:4` : lance uniquement la validation Playtest à 4 joueurs.

### Playtest automatique (Phase 8)

- Lance le mode Playtest rapide avec un seul clic (depuis la doc ci-dessus), puis vérifie `npm run test:e2e -- tests/phase8-playtest.spec.ts` pour exécuter les validations 2/3/4 joueurs en local.

## Objectif

Ce dépôt contient actuellement une base de jeu avancée avec équilibrage et métriques de validation du MVP.

## Playtest rapide (Phase 8)

Ouvre une session avec un mode de test automatique (auto-jointure + démarrage) :

- 2 joueurs : `/?playtestPlayers=2&playtest=1&matchDurationMs=10000&roundsToWin=1&maxRounds=1&countdownMs=0`
- 3 joueurs : `/?playtestPlayers=3&playtest=1&matchDurationMs=10000&roundsToWin=1&maxRounds=1&countdownMs=0`
- 4 joueurs : `/?playtestPlayers=4&playtest=1&matchDurationMs=10000&roundsToWin=1&maxRounds=1&countdownMs=0`

Les métriques affichées en debug sont loggées en console à la fin de match.

## Publication et build local

- `npm run build` : compile une version web dans `dist/`.
- `npm run preview` : sert un build local pour validation.
- `npm run publish:archive` : génère une archive jouable locale `release/blood-relay-<version>.tar.gz`.

### Déploiement web

Le dépôt contient un workflow GitHub Pages prêt à déployer la branche `main` (`.github/workflows/static-deploy.yml`) avec le dossier `dist` généré par `npm run build`.

## Retours préliminaires

- Formulaire collectif : voir `FEEDBACK.md` pour consigner les retours de test.

## Médias de présentation

- Procédure de capture démo : voir `DEMO.md`.

## Debug et profilage local

- `F1` active / désactive l’affichage debug général.
- `F9` active / désactive le mode profilage. Il affiche :
  - FPS moyen (échantillonnage glissant),
  - nombre d’entités actives (`projectiles`, `mêlée`, `flaques`, traces au sol),
  - taux d’apparition par seconde (`projectiles`, `mêlée`, `particules`) pour un cycle de 1 s,
  - log console toutes les 2 s en préfixe `[Perf]`.
- Voir `PERFORMANCE.md` pour les détails du mode de collecte.
