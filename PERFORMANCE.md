# Blood Relay — profilage local

Le mode performance de l’arène permet de surveiller les points suivants pendant les sessions locales:

- FPS moyen (sous fenêtre de 1 s)
- Entités actives: joueurs, projectiles, zones de mêlée, flaques, traces
- Taux de création par seconde: projectiles, zones de mêlée, particules
- Log console périodique (`[Perf]`) toutes les ~2 s

## Activation

- `F1` : toggle debug HUD existant.
- `F9` : toggle affichage performance dans la scène d’arène.

## Ce qui est mesuré

- projectiles : `this.bullets` (groupes actifs)
- zones de mêlée : `this.meleeZones` (groupes actifs)
- flaques : `this.bloodPools.length`
- traces : `this.groundTraces.length`
- particules : estimateur basé sur les émissions `explode(...)` des emitters de particules

## Limites

Le compteur de particules est une approximation d’émission (pas un snapshot exact du renderer), suffisante pour détecter les pics de charge visuelle.

