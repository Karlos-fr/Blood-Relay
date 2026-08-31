import type { CharacterAppearance } from '../CharacterAppearance';
import type { AnatomicalPose } from '../anatomy/AnatomicalPose';
import type { PixelCanvas } from '../frame/PixelCanvas';

export const CHARACTER_RENDER_LAYERS = [
  'rearAccessory',
  'rearBody',
  'anatomy',
  'body',
  'armor',
  'frontBody',
  'weapon',
  'frontAccessory',
  'mutationAccent',
] as const;

export type CharacterRenderLayer = (typeof CHARACTER_RENDER_LAYERS)[number];

export interface CharacterRenderContext {
  canvas: PixelCanvas;
  pose: AnatomicalPose;
  appearance: CharacterAppearance;
  seed: number;
  accessoryPhase: 0 | 1 | 2 | 3;
}

export interface CharacterRenderModule {
  id: string;
  layer: CharacterRenderLayer;
  renderRight(context: CharacterRenderContext): void;
  renderLeft?(context: CharacterRenderContext): void;
}

export type CharacterRenderModuleRecord<Id extends string> = Readonly<
  Record<Id, CharacterRenderModule>
>;
