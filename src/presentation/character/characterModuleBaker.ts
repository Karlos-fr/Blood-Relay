import type Phaser from 'phaser';
import type { PaletteId } from './CharacterAppearance';
import { getCharacterPalette } from './characterPalettes';
import {
  calculateGeometryBounds,
  resolveModuleGeometry,
  type CharacterModulePieceDefinition,
} from './moduleGeometry';

export interface BakedModulePiece {
  textureKey: string;
  originX: number;
  originY: number;
}

export function buildModuleTextureKey(
  pieceId: string,
  paletteId: PaletteId,
  facing: 'left' | 'right',
): string {
  return `char:${pieceId}:${paletteId}:${facing}`;
}

export function bakeModulePiece(
  scene: Phaser.Scene,
  piece: CharacterModulePieceDefinition,
  paletteId: PaletteId,
  facing: 'left' | 'right',
): BakedModulePiece {
  const textureKey = buildModuleTextureKey(piece.id, paletteId, facing);
  const geometry = resolveModuleGeometry(piece, facing);
  if (!geometry) throw new Error(`Missing ${facing} geometry for ${piece.id}`);

  const bounds = calculateGeometryBounds(geometry);
  const padding = 1;
  const width = bounds.maxX - bounds.minX + 1 + padding * 2;
  const height = bounds.maxY - bounds.minY + 1 + padding * 2;
  const originPixelX = -bounds.minX + padding;
  const originPixelY = -bounds.minY + padding;

  if (!scene.textures.exists(textureKey)) {
    const texture = scene.textures.createCanvas(textureKey, width, height);
    if (!texture) throw new Error(`Could not create texture ${textureKey}`);

    const context = texture.context;
    context.imageSmoothingEnabled = false;
    const palette = getCharacterPalette(paletteId);

    for (const primitive of geometry) {
      context.fillStyle = `#${palette[primitive.role].toString(16).padStart(6, '0')}`;
      if (primitive.kind === 'rect') {
        context.fillRect(
          primitive.x - bounds.minX + padding,
          primitive.y - bounds.minY + padding,
          primitive.width,
          primitive.height,
        );
      } else {
        for (const [x, y] of primitive.points) {
          context.fillRect(x - bounds.minX + padding, y - bounds.minY + padding, 1, 1);
        }
      }
    }

    texture.refresh();
  }

  return {
    textureKey,
    originX: originPixelX / width,
    originY: originPixelY / height,
  };
}
