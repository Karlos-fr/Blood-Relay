import { describe, expect, it } from 'vitest';
import {
  installCharacterPreviewViewport,
  type PreviewCamera,
  type PreviewSceneEvents,
  type PreviewScale,
} from './characterPreviewViewport';

class CameraState implements PreviewCamera {
  public bounds = { x: 0, y: 0, width: 0, height: 0 };
  public viewport = { x: 0, y: 0, width: 0, height: 0 };
  public zoom = 0;
  public center = { x: 0, y: 0 };

  public setBounds(x: number, y: number, width: number, height: number): void {
    this.bounds = { x, y, width, height };
  }

  public setViewport(x: number, y: number, width: number, height: number): void {
    this.viewport = { x, y, width, height };
  }

  public setZoom(zoom: number): void {
    this.zoom = zoom;
  }

  public centerOn(x: number, y: number): void {
    this.center = { x, y };
  }
}

class ResizableScale implements PreviewScale {
  private readonly resizeListeners = new Set<() => void>();

  public constructor(
    public width: number,
    public height: number,
  ) {}

  public on(event: 'resize', listener: () => void): void {
    if (event === 'resize') this.resizeListeners.add(listener);
  }

  public off(event: 'resize', listener: () => void): void {
    if (event === 'resize') this.resizeListeners.delete(listener);
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    for (const listener of this.resizeListeners) listener();
  }

  public get listenerCount(): number {
    return this.resizeListeners.size;
  }
}

class SceneLifecycle implements PreviewSceneEvents {
  private shutdownListener?: () => void;

  public once(event: 'shutdown', listener: () => void): void {
    if (event === 'shutdown') this.shutdownListener = listener;
  }

  public shutdown(): void {
    this.shutdownListener?.();
    this.shutdownListener = undefined;
  }
}

describe('character preview viewport', () => {
  it('contains the complete logical preview on initial portrait and later landscape sizes', () => {
    const camera = new CameraState();
    const scale = new ResizableScale(390, 844);
    const events = new SceneLifecycle();

    installCharacterPreviewViewport(camera, scale, events);

    expect(camera.bounds).toEqual({ x: 0, y: 0, width: 1120, height: 540 });
    expect(camera.viewport.x).toBeCloseTo(0);
    expect(camera.viewport.y).toBeCloseTo(327.9821, 3);
    expect(camera.viewport.width).toBeCloseTo(390);
    expect(camera.viewport.height).toBeCloseTo(188.0357, 3);
    expect(camera.zoom).toBeCloseTo(390 / 1120);
    expect(camera.center).toEqual({ x: 560, y: 270 });

    scale.resize(932, 430);

    expect(camera.viewport.x).toBeCloseTo(20.0741, 3);
    expect(camera.viewport.y).toBeCloseTo(0);
    expect(camera.viewport.width).toBeCloseTo(891.8519, 3);
    expect(camera.viewport.height).toBeCloseTo(430);
    expect(camera.zoom).toBeCloseTo(430 / 540);
    expect(camera.center).toEqual({ x: 560, y: 270 });
  });

  it('stops updating the preview camera after scene shutdown', () => {
    const camera = new CameraState();
    const scale = new ResizableScale(390, 844);
    const events = new SceneLifecycle();
    installCharacterPreviewViewport(camera, scale, events);

    events.shutdown();
    scale.resize(932, 430);

    expect(scale.listenerCount).toBe(0);
    expect(camera.viewport.width).toBeCloseTo(390);
    expect(camera.viewport.height).toBeCloseTo(188.0357, 3);
  });
});
