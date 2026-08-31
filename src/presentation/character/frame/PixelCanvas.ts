import type { PaletteRole } from '../characterPalettes';

export interface PixelPoint {
  x: number;
  y: number;
}

export type CharacterPixel = PaletteRole | null;

export interface CharacterPixelFrame {
  width: number;
  height: number;
  pixels: readonly CharacterPixel[];
  bodyMask: readonly boolean[];
}

const INTEGER_ERROR = 'Pixel coordinates must be integers.';

function assertInteger(...values: number[]): void {
  if (!values.every(Number.isInteger)) {
    throw new Error(INTEGER_ERROR);
  }
}

function assertPoint(point: PixelPoint): void {
  assertInteger(point.x, point.y);
}

export class PixelCanvas {
  private readonly pixels: CharacterPixel[];
  private readonly bodyMask: boolean[];

  public constructor(
    public readonly width: number,
    public readonly height: number,
  ) {
    this.pixels = Array(width * height).fill(null);
    this.bodyMask = Array(width * height).fill(false);
  }

  public setPixel(x: number, y: number, role: PaletteRole, body = false): void {
    assertInteger(x, y);
    if (!this.contains(x, y)) return;

    const index = this.indexOf(x, y);
    this.pixels[index] = role;
    this.bodyMask[index] = body;
  }

  public getPixel(x: number, y: number): CharacterPixel {
    assertInteger(x, y);
    return this.contains(x, y) ? this.pixels[this.indexOf(x, y)] : null;
  }

  public fillRect(
    x: number,
    y: number,
    width: number,
    height: number,
    role: PaletteRole,
    body = false,
  ): void {
    assertInteger(x, y, width, height);
    for (let row = y; row < y + height; row += 1) {
      for (let column = x; column < x + width; column += 1) {
        this.setPixel(column, row, role, body);
      }
    }
  }

  public drawLine(start: PixelPoint, end: PixelPoint, role: PaletteRole, body = false): void {
    this.walkLine(start, end, (x, y) => this.setPixel(x, y, role, body));
  }

  public drawThickSegment(
    start: PixelPoint,
    end: PixelPoint,
    radius: number,
    role: PaletteRole,
    body = false,
  ): void {
    assertInteger(radius);
    this.walkLine(start, end, (x, y) => {
      this.fillRect(x - radius, y - radius, radius * 2 + 1, radius * 2 + 1, role, body);
    });
  }

  public fillPolygon(points: readonly PixelPoint[], role: PaletteRole, body = false): void {
    points.forEach(assertPoint);
    if (points.length < 3) return;

    const minY = Math.min(...points.map(({ y }) => y));
    const maxY = Math.max(...points.map(({ y }) => y));
    for (let y = minY; y < maxY; y += 1) {
      const intersections: number[] = [];
      for (let index = 0; index < points.length; index += 1) {
        const start = points[index];
        const end = points[(index + 1) % points.length];
        if ((start.y <= y && end.y > y) || (end.y <= y && start.y > y)) {
          intersections.push(start.x + ((y - start.y) * (end.x - start.x)) / (end.y - start.y));
        }
      }

      intersections.sort((left, right) => left - right);
      for (let index = 0; index + 1 < intersections.length; index += 2) {
        const startX = Math.ceil(intersections[index]);
        const endX = Math.floor(intersections[index + 1]);
        this.fillRect(startX, y, endX - startX + 1, 1, role, body);
      }
    }
  }

  public countRole(role: PaletteRole): number {
    return this.pixels.filter((pixel) => pixel === role).length;
  }

  public toMask(): boolean[] {
    return [...this.bodyMask];
  }

  public snapshot(): CharacterPixelFrame {
    return {
      width: this.width,
      height: this.height,
      pixels: [...this.pixels],
      bodyMask: [...this.bodyMask],
    };
  }

  private contains(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  private indexOf(x: number, y: number): number {
    return y * this.width + x;
  }

  private walkLine(
    start: PixelPoint,
    end: PixelPoint,
    visit: (x: number, y: number) => void,
  ): void {
    assertPoint(start);
    assertPoint(end);

    let x = start.x;
    let y = start.y;
    const deltaX = Math.abs(end.x - start.x);
    const stepX = start.x < end.x ? 1 : -1;
    const deltaY = -Math.abs(end.y - start.y);
    const stepY = start.y < end.y ? 1 : -1;
    let error = deltaX + deltaY;

    while (true) {
      visit(x, y);
      if (x === end.x && y === end.y) return;
      const doubledError = error * 2;
      if (doubledError >= deltaY) {
        error += deltaY;
        x += stepX;
      }
      if (doubledError <= deltaX) {
        error += deltaX;
        y += stepY;
      }
    }
  }
}

export function isMaskConnected(mask: readonly boolean[], width: number, height: number): boolean {
  const total = mask.filter(Boolean).length;
  if (total === 0) return true;

  const start = mask.findIndex(Boolean);
  const visited = new Set<number>([start]);
  const queue = [start];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const index = queue[cursor];
    const x = index % width;
    const y = Math.floor(index / width);
    for (const [nextX, nextY] of [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ]) {
      if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) continue;
      const next = nextY * width + nextX;
      if (mask[next] && !visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }

  return visited.size === total;
}

export function mirrorCharacterFrame(frame: CharacterPixelFrame): CharacterPixelFrame {
  const pixels: CharacterPixel[] = Array(frame.width * frame.height).fill(null);
  const bodyMask = Array(frame.width * frame.height).fill(false);
  for (let y = 0; y < frame.height; y += 1) {
    for (let x = 0; x < frame.width; x += 1) {
      const source = y * frame.width + x;
      const destination = y * frame.width + (frame.width - 1 - x);
      pixels[destination] = frame.pixels[source];
      bodyMask[destination] = frame.bodyMask[source];
    }
  }
  return { width: frame.width, height: frame.height, pixels, bodyMask };
}
