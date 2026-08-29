# Blood Relay

Blood Relay est un jeu d'action 2D multijoueur en arènes fixes, développé en TypeScript avec Phaser 3.

La mécanique centrale à venir : le sang perdu pendant les combats reste dans l'arène et devient une ressource que les joueurs peuvent récupérer puis transfuser pour se soigner.

## Phase actuelle

**Phase 0 — Socle minimal**

Le dépôt contient pour l'instant uniquement le bootstrap technique :

- Vite + TypeScript strict ;
- Phaser 3 + Arcade Physics ;
- résolution logique 960 × 540 en 16:9 ;
- `BootScene` et `ArenaScene` ;
- arène vide avec sol temporaire ;
- Vitest, ESLint et Prettier.

## Prérequis

- Node.js 20.19+ ;
- npm.

## Lancement

```bash
npm install
npm run dev
```

Puis ouvrir l'URL indiquée par Vite.

## Vérifications

```bash
npm run test
npm run lint
npm run build
```

## Plan

La feuille de route complète et son avancement sont dans [`PLAN.md`](./PLAN.md).
