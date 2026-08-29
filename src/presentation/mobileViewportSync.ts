import type Phaser from 'phaser';
import { selectViewportSize } from './mobileViewport';

const RETRY_DELAYS_MS = [80, 260] as const;

export function installMobileViewportSync(game: Phaser.Game): () => void {
  const root = document.getElementById('game');
  if (!root) {
    return () => undefined;
  }

  const visualViewport = window.visualViewport;
  let retryTimers: number[] = [];

  const syncViewport = (): void => {
    const size = selectViewportSize(
      visualViewport?.width,
      visualViewport?.height,
      window.innerWidth,
      window.innerHeight,
    );

    const width = Math.round(size.width);
    const height = Math.round(size.height);
    const left = Math.round(visualViewport?.offsetLeft ?? 0);
    const top = Math.round(visualViewport?.offsetTop ?? 0);

    root.style.left = `${left}px`;
    root.style.top = `${top}px`;
    root.style.width = `${width}px`;
    root.style.height = `${height}px`;

    if (game.scale.width !== width || game.scale.height !== height) {
      game.scale.resize(width, height);
    }
  };

  const scheduleSync = (): void => {
    syncViewport();
    requestAnimationFrame(syncViewport);

    retryTimers.forEach((timer) => window.clearTimeout(timer));
    retryTimers = RETRY_DELAYS_MS.map((delay) => window.setTimeout(syncViewport, delay));
  };

  document.documentElement.classList.add('mobile-runtime');
  window.addEventListener('resize', scheduleSync, { passive: true });
  window.addEventListener('orientationchange', scheduleSync, { passive: true });
  visualViewport?.addEventListener('resize', scheduleSync, { passive: true });
  visualViewport?.addEventListener('scroll', scheduleSync, { passive: true });

  scheduleSync();

  return (): void => {
    retryTimers.forEach((timer) => window.clearTimeout(timer));
    window.removeEventListener('resize', scheduleSync);
    window.removeEventListener('orientationchange', scheduleSync);
    visualViewport?.removeEventListener('resize', scheduleSync);
    visualViewport?.removeEventListener('scroll', scheduleSync);
    document.documentElement.classList.remove('mobile-runtime');
  };
}
