# Démo vidéo / GIF du MVP

Ce dépôt vise à produire un court support de présentation.

## Capture vidéo rapide

- Si FFmpeg est installé :
  ```bash
  npm run build
  npm run preview
  ```
  et dans un second terminal, lancez l’enregistrement de votre écran (Réc. ~20 secondes).

## Capture GIF automatique (si ffmpeg disponible)

- Depuis l’écran de jeu, lancez un enregistrement de 10 secondes.
- Convertissez en GIF (exemple) :
  ```bash
  ffmpeg -i demo.mp4 -vf "fps=12,scale=1280:-1:flags=lanczos" -t 10 demo.gif
  ```

## Fichier de sortie attendu

- `release/blood-relay-demo.gif` (ou `.mp4`), utilisé pour la page de présentation.
