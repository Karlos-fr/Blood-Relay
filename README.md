# Blood Relay

Blood Relay est un jeu d'action 2D multijoueur en arènes fixes, développé en TypeScript avec Phaser 3.

La mécanique centrale à venir : le sang perdu pendant les combats reste dans l'arène et devient une ressource que les joueurs peuvent récupérer puis transfuser pour se soigner.

## Direction visuelle

La maquette de référence validée pour la direction générale du jeu est conservée dans le dépôt :

<img src="https://raw.githubusercontent.com/Karlos-fr/Blood-Relay/main/docs/visual/blood-relay-visual-direction.webp" alt="Blood Relay — direction visuelle" width="100%">

Elle fixe notamment la vue de côté, les sprites volontairement lisibles, l'ambiance industrielle sombre, le sang comme ressource et le contraste entre pixel art rétro et effets modernes.

## Phase actuelle

**Phase 1 — Arène et déplacement à deux / consolidation du design**

La version actuelle contient :

- Vite + TypeScript strict ;
- Phaser 3 + Arcade Physics ;
- résolution logique 960 × 540 en 16:9 ;
- une arène 960 × 540 entièrement visible, caméra à 100 % sur desktop ;
- contenu du prototype compacté à 90 % pour augmenter l'espace de combat sans modifier le cadrage logique ;
- sur mobile, un canvas adapté au viewport réel tout en conservant l'intégralité de la scène 16:9 sans crop ni déformation ;
- quatre niveaux verticaux de plateformes traversables selon une structure 2-1-2-1 ;
- le niveau supérieur conserve une marge suffisante pour qu'un saut complet reste dans l'écran ;
- deux joueurs locaux avec collisions, accélération, décélération et saut ;
- commandes tactiles mobiles pour le joueur 1, affichées uniquement sur appareil tactile mobile, avec boutons Crystal Glass adaptés aux safe areas iPhone ;
- un debug des hitboxes activable avec `F1` ;
- déploiement automatique sur GitHub Pages après lint, tests et build.

## Contrôles

### Joueur 1

Clavier :

- `Q` / `D` : gauche / droite ;
- `Z` : sauter ;
- `S` + `Z` : descendre à travers une plateforme.

Sur mobile tactile, de grands boutons en verre apparaissent automatiquement :

- `←` / `→` : déplacement ;
- `↑` : saut ;
- `↓` + `↑` : descendre à travers une plateforme.

### Joueur 2

- `←` / `→` : gauche / droite ;
- `↑` : sauter ;
- `↓` + `↑` : descendre à travers une plateforme.

### Debug

- `F1` : afficher ou masquer les hitboxes et l'état de mouvement.

## Version jouable

https://karlos-fr.github.io/Blood-Relay/

## Prérequis locaux

- Node.js 20.19+ ;
- npm.

## Lancement

```bash
npm install
npm run dev
```

## Vérifications

```bash
npm run test
npm run lint
npm run build
```

## Règles de développement

Les règles de travail pour ChatGPT et les autres agents sont définies dans [`AGENTS.md`](./AGENTS.md). Elles couvrent notamment la validation humaine, les petits fichiers, les modifications atomiques, la CI, GitHub Pages, les paramètres de game feel et la manière de conserver les décisions dans le dépôt.

## Plan

La feuille de route complète et son avancement sont dans [`PLAN.md`](./PLAN.md).
