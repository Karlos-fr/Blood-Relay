import { GAME_HEIGHT, GAME_WIDTH } from '../../../config/game';
import { calculateContainedViewport } from '../../mobileViewport';

export interface PreviewCamera {
  setBounds(x: number, y: number, width: number, height: number): void;
  setViewport(x: number, y: number, width: number, height: number): void;
  setZoom(zoom: number): void;
  centerOn(x: number, y: number): void;
}

export interface PreviewScale {
  readonly width: number;
  readonly height: number;
  on(event: 'resize', listener: () => void): void;
  off(event: 'resize', listener: () => void): void;
}

export interface PreviewSceneEvents {
  once(event: 'shutdown', listener: () => void): void;
}

export function installCharacterPreviewViewport(
  camera: PreviewCamera,
  scale: PreviewScale,
  events: PreviewSceneEvents,
): void {
  camera.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

  const applyViewport = (): void => {
    const viewport = calculateContainedViewport(scale.width, scale.height, GAME_WIDTH, GAME_HEIGHT);
    camera.setViewport(viewport.x, viewport.y, viewport.width, viewport.height);
    camera.setZoom(viewport.zoom);
    camera.centerOn(GAME_WIDTH / 2, GAME_HEIGHT / 2);
  };

  applyViewport();
  scale.on('resize', applyViewport);
  events.once('shutdown', () => {
    scale.off('resize', applyViewport);
  });
}
