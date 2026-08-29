import { describe, expect, it, vi } from 'vitest';
import { ArenaBackdropAnimationController } from './ArenaBackdropAnimation';

describe('ArenaBackdropAnimationController', () => {
  it('advances animations only when update is called explicitly', () => {
    const renderFrame = vi.fn();
    const controller = new ArenaBackdropAnimationController(renderFrame);

    expect(renderFrame).not.toHaveBeenCalled();

    controller.update(1234);

    expect(renderFrame).toHaveBeenCalledTimes(1);
    expect(renderFrame).toHaveBeenCalledWith(1234);
  });
});
