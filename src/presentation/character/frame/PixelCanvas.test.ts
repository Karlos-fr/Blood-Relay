import { describe, expect, it } from 'vitest';
import { PixelCanvas, isMaskConnected, mirrorCharacterFrame } from './PixelCanvas';

describe('semantic pixel canvas', () => {
  it('clips integer primitives to the canvas', () => {
    const canvas = new PixelCanvas(5, 4);
    canvas.fillRect(-1, 1, 3, 2, 'cloth');
    expect(canvas.countRole('cloth')).toBe(4);
  });

  it('draws a connected thick segment between integer landmarks', () => {
    const canvas = new PixelCanvas(8, 8);
    canvas.drawThickSegment({ x: 1, y: 1 }, { x: 6, y: 6 }, 1, 'skin');
    expect(isMaskConnected(canvas.toMask(), 8, 8)).toBe(true);
  });

  it('mirrors complete frames without changing semantic roles', () => {
    const canvas = new PixelCanvas(4, 2);
    canvas.setPixel(0, 0, 'accent');
    const mirrored = mirrorCharacterFrame(canvas.snapshot());
    expect(mirrored.pixels[3]).toBe('accent');
    expect(mirrored.pixels[0]).toBeNull();
  });

  it('rejects non-integer primitive coordinates', () => {
    const canvas = new PixelCanvas(5, 5);
    expect(() => canvas.setPixel(1.5, 1, 'cloth')).toThrow('Pixel coordinates must be integers.');
    expect(() => canvas.fillRect(0, 0, 1.5, 1, 'cloth')).toThrow(
      'Pixel coordinates must be integers.',
    );
    expect(() => canvas.drawLine({ x: 0, y: 0 }, { x: 1.5, y: 1 }, 'cloth')).toThrow(
      'Pixel coordinates must be integers.',
    );
    expect(() => canvas.drawThickSegment({ x: 0, y: 0 }, { x: 1, y: 1 }, 0.5, 'cloth')).toThrow(
      'Pixel coordinates must be integers.',
    );
    expect(() =>
      canvas.fillPolygon(
        [
          { x: 0, y: 0 },
          { x: 1, y: 1.5 },
        ],
        'cloth',
      ),
    ).toThrow('Pixel coordinates must be integers.');
  });

  it('uses Bresenham stepping for line pixels', () => {
    const canvas = new PixelCanvas(5, 4);
    canvas.drawLine({ x: 0, y: 0 }, { x: 4, y: 2 }, 'outline');
    expect(canvas.snapshot().pixels).toEqual([
      'outline',
      null,
      null,
      null,
      null,
      null,
      'outline',
      'outline',
      null,
      null,
      null,
      null,
      null,
      'outline',
      'outline',
      null,
      null,
      null,
      null,
      null,
    ]);
  });

  it('fills polygon scanlines within its edges', () => {
    const canvas = new PixelCanvas(5, 5);
    canvas.fillPolygon(
      [
        { x: 1, y: 1 },
        { x: 3, y: 1 },
        { x: 2, y: 3 },
      ],
      'cloth',
    );
    expect(canvas.snapshot().pixels).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
      'cloth',
      'cloth',
      'cloth',
      null,
      null,
      null,
      'cloth',
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
  });

  it('keeps body masks separate and returns fresh snapshots', () => {
    const canvas = new PixelCanvas(2, 1);
    canvas.setPixel(0, 0, 'skin', true);
    const frame = canvas.snapshot();
    const mask = canvas.toMask();
    canvas.setPixel(1, 0, 'accent');
    mask[0] = false;
    expect(frame).not.toBe(canvas.snapshot());
    expect(canvas.snapshot()).toEqual({
      width: 2,
      height: 1,
      pixels: ['skin', 'accent'],
      bodyMask: [true, false],
    });
    expect(frame.pixels).toEqual(['skin', null]);
    expect(canvas.toMask()).toEqual([true, false]);
  });

  it('detects disconnected mask islands', () => {
    expect(isMaskConnected([true, false, false, true], 2, 2)).toBe(false);
  });
});
