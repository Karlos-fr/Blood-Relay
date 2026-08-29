# Blood Relay — Development Rules

Ces règles s'appliquent à tout le dépôt. Elles servent de garde-fous pour les développements réalisés avec ChatGPT ou un autre agent.

## 1. Validation humaine obligatoire

- Le rendu, le gameplay, le game feel, les contrôles et l'ergonomie sont validés manuellement par le testeur humain.
- Une CI verte ne vaut jamais validation gameplay.
- Une tâche nécessitant une validation humaine reste décochée dans `PLAN.md` jusqu'à confirmation explicite.
- Ne pas passer automatiquement à la phase jouable suivante tant que la phase précédente n'a pas été validée manuellement.

## 2. Fichiers petits et spécialisés

- Privilégier des fichiers courts, idéalement sous 200–250 lignes.
- Découper un fichier avant qu'il devienne difficile à relire ou à remplacer proprement.
- Une responsabilité principale par fichier.
- Éviter les gros fichiers monolithiques, particulièrement pour les scènes Phaser.

## 3. Modifications petites et atomiques

- Implémenter un lot cohérent à la fois.
- Modifier le moins de fichiers possible pour atteindre l'objectif.
- Éviter les refontes larges sans besoin démontré.
- Faire des commits fréquents avec un message décrivant précisément le changement.

## 4. Le dépôt est la mémoire du projet

- Ne pas dépendre de la mémoire d'une conversation ChatGPT.
- Toute décision durable doit être écrite dans le dépôt : `PLAN.md`, `AGENTS.md`, documentation ou code.
- `PLAN.md` est la source de vérité pour l'ordre des phases et l'avancement.
- Lire les fichiers concernés dans leur version actuelle avant de les modifier ; ne jamais supposer leur contenu.

## 5. Tests utiles, pas dogmatiques

Automatiser les comportements déterministes :

- santé et dégâts ;
- sang et quantités ;
- transfusion ;
- score et règles de manche ;
- calculs et états de gameplay ;
- régressions reproductibles.

Ne pas figer arbitrairement par test un paramètre de game feel :

- hauteur ou vitesse du saut ;
- vitesse de déplacement ;
- recul ressenti ;
- intensité du screen shake ;
- cadence ressentie ;
- intensité des effets visuels ou sonores.

Ces valeurs restent configurables et sont validées en jouant.

## 6. Paramètres de gameplay centralisés

- Ne pas disperser de nombres magiques dans le code.
- Centraliser les paramètres subjectifs dans de petites configurations ou constantes nommées.
- Un retour de test comme « saut trop bas » doit idéalement nécessiter la modification d'une seule valeur.
- Toute modification importante d'un paramètre de mouvement impose de retester le parcours de l'arène.

## 7. GitHub Actions avant toute affirmation de réussite

Avant d'annoncer qu'un lot est terminé :

- lint doit réussir ;
- tests doivent réussir ;
- build doit réussir ;
- pour un lot jouable, le déploiement GitHub Pages doit réussir.

En cas d'échec, lire l'erreur et identifier la cause avant de modifier le code.

## 8. GitHub Pages est le banc de test jouable

- Chaque lot jouable significatif est poussé sur `main` et déployé sur GitHub Pages.
- Le testeur humain valide ensuite la version réellement déployée.
- Ne pas considérer une fonctionnalité visuelle ou interactive comme validée uniquement parce qu'elle compile.

## 9. Architecture progressive

- Ne pas construire de framework générique avant d'en avoir besoin.
- Ne pas ajouter de dépendance pour un besoin qui peut être résolu simplement avec la stack existante.
- Atteindre le gameplay jouable avant d'investir dans une architecture sophistiquée.
- Séparer logique et présentation lorsque cela apporte un bénéfice concret aux tests et à la maintenance.

Exemples de logique indépendante du rendu : `Health`, `BloodPool`, transfusion, score et règles de manche.

## 10. Préserver l'existant et limiter les risques d'édition

- Relire la version actuelle d'un fichier juste avant une modification importante.
- Si plusieurs commits ont eu lieu entre-temps, récupérer à nouveau le fichier avant de l'écraser.
- Préférer créer un petit module plutôt que réécrire un gros fichier pour ajouter une fonctionnalité locale.
- En cas d'ambiguïté de design importante, préserver l'existant et demander une validation plutôt que d'inventer.

## 11. Pas de contournement qui pollue le dépôt

- Ne pas ajouter de workflow, script ou infrastructure temporaire uniquement pour contourner une limitation de l'outil d'édition.
- Si un mécanisme temporaire est réellement indispensable, il doit être supprimé dans le même lot après usage.
- Les contraintes de ChatGPT ne doivent pas devenir des contraintes permanentes du projet.

## 12. Assets et références

- Les références visuelles vont dans `docs/visual/`.
- Les assets réellement utilisés par le jeu vont dans `public/assets/` ou une structure dédiée équivalente.
- Éviter les gros fichiers générés ou les doublons inutiles.
- Une maquette de référence n'est pas automatiquement un asset de production.
