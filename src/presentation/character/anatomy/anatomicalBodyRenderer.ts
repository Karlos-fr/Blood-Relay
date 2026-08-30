import type { BodyId } from '../CharacterAppearance';
import {
  CHARACTER_BODY_HEIGHT,
  CHARACTER_BODY_LEFT,
  CHARACTER_BODY_TOP,
  CHARACTER_BODY_WIDTH,
} from '../characterDimensions';
import { PixelCanvas, type PixelPoint } from '../frame/PixelCanvas';
import type { AnatomicalPose } from './AnatomicalPose';

const BODY_THICKNESS = {
  standard: { limb: 2, torso: 4, head: 4 },
  heavy: { limb: 3, torso: 5, head: 4 },
  gaunt: { limb: 2, torso: 3, head: 4 },
} as const;

const BODY_RIGHT = CHARACTER_BODY_LEFT + CHARACTER_BODY_WIDTH - 1;
const BODY_BOTTOM = CHARACTER_BODY_TOP + CHARACTER_BODY_HEIGHT - 1;

function isInsideBodyRegion(x: number, y: number): boolean {
  return (
    x >= CHARACTER_BODY_LEFT && x <= BODY_RIGHT && y >= CHARACTER_BODY_TOP && y <= BODY_BOTTOM
  );
}

function paintBodyPixel(canvas: PixelCanvas, x: number, y: number): void {
  if (isInsideBodyRegion(x, y)) canvas.setPixel(x, y, 'skin', true);
}

function fillBodySquare(canvas: PixelCanvas, center: PixelPoint, radius: number): void {
  for (let y = center.y - radius; y <= center.y + radius; y += 1) {
    for (let x = center.x - radius; x <= center.x + radius; x += 1) {
      paintBodyPixel(canvas, x, y);
    }
  }
}

function drawBodySegment(
  canvas: PixelCanvas,
  start: PixelPoint,
  end: PixelPoint,
  radius: number,
): void {
  let x = start.x;
  let y = start.y;
  const deltaX = Math.abs(end.x - start.x);
  const stepX = start.x < end.x ? 1 : -1;
  const deltaY = -Math.abs(end.y - start.y);
  const stepY = start.y < end.y ? 1 : -1;
  let error = deltaX + deltaY;

  while (true) {
    fillBodySquare(canvas, { x, y }, radius);
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

function drawLimb(
  canvas: PixelCanvas,
  start: PixelPoint,
  joint: PixelPoint,
  end: PixelPoint,
  radius: number,
): void {
  drawBodySegment(canvas, start, joint, radius);
  fillBodySquare(canvas, joint, radius);
  drawBodySegment(canvas, joint, end, radius);
}

function midpoint(first: PixelPoint, second: PixelPoint): PixelPoint {
  return {
    x: Math.round((first.x + second.x) / 2),
    y: Math.round((first.y + second.y) / 2),
  };
}

function fillBodyPolygon(canvas: PixelCanvas, points: readonly PixelPoint[]): void {
  canvas.fillPolygon(points, 'skin', true);
}

function drawHead(canvas: PixelCanvas, center: PixelPoint, radius: number): void {
  for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
    const halfWidth = Math.floor(Math.sqrt(radius * radius - offsetY * offsetY));
    for (let offsetX = -halfWidth; offsetX <= halfWidth; offsetX += 1) {
      paintBodyPixel(canvas, center.x + offsetX, center.y + offsetY);
    }
  }
}

function drawFoot(canvas: PixelCanvas, point: PixelPoint, radius: number): void {
  const top = Math.max(CHARACTER_BODY_TOP, point.y - 2);
  const bottom = Math.min(point.y, BODY_BOTTOM);
  for (let y = top; y <= bottom; y += 1) {
    for (let x = point.x - radius; x <= point.x + radius; x += 1) {
      paintBodyPixel(canvas, x, y);
    }
  }
}

function paintOutline(canvas: PixelCanvas, bodyMask: readonly boolean[]): void {
  for (let y = CHARACTER_BODY_TOP; y <= BODY_BOTTOM; y += 1) {
    for (let x = CHARACTER_BODY_LEFT; x <= BODY_RIGHT; x += 1) {
      const index = y * canvas.width + x;
      if (bodyMask[index]) continue;

      let touchesBody = false;
      for (let offsetY = -1; offsetY <= 1 && !touchesBody; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          if (offsetX === 0 && offsetY === 0) continue;
          const neighborX = x + offsetX;
          const neighborY = y + offsetY;
          if (!isInsideBodyRegion(neighborX, neighborY)) continue;
          if (bodyMask[neighborY * canvas.width + neighborX]) {
            touchesBody = true;
            break;
          }
        }
      }
      if (touchesBody) canvas.setPixel(x, y, 'outline');
    }
  }
}

function shadeBody(canvas: PixelCanvas, bodyMask: readonly boolean[]): void {
  for (let y = CHARACTER_BODY_TOP; y <= BODY_BOTTOM; y += 1) {
    const occupied: number[] = [];
    for (let x = CHARACTER_BODY_LEFT; x <= BODY_RIGHT; x += 1) {
      if (bodyMask[y * canvas.width + x]) occupied.push(x);
    }
    if (occupied.length === 0) continue;

    const left = occupied[0];
    const right = occupied[occupied.length - 1];
    for (const x of occupied) {
      const role = x === left ? 'skinLight' : x === right ? 'skinDark' : 'skin';
      canvas.setPixel(x, y, role, true);
    }
  }
}

export function renderAnatomicalBody(
  canvas: PixelCanvas,
  pose: AnatomicalPose,
  bodyId: BodyId,
): void {
  const thickness = BODY_THICKNESS[bodyId];

  drawLimb(canvas, pose.shoulderRear, pose.elbowRear, pose.handRear, thickness.limb);
  drawLimb(canvas, pose.hipRear, pose.kneeRear, pose.footRear, thickness.limb);

  fillBodyPolygon(canvas, [
    { x: pose.hipRear.x - thickness.limb, y: pose.hipRear.y - 1 },
    { x: pose.hipFront.x + thickness.limb, y: pose.hipFront.y - 1 },
    { x: pose.hipFront.x + thickness.limb, y: pose.hipFront.y + 2 },
    { x: pose.hipRear.x - thickness.limb, y: pose.hipRear.y + 2 },
  ]);

  const shoulderCenter = midpoint(pose.shoulderRear, pose.shoulderFront);
  const hipCenter = midpoint(pose.hipRear, pose.hipFront);
  drawBodySegment(canvas, shoulderCenter, hipCenter, thickness.torso);
  fillBodyPolygon(canvas, [
    pose.shoulderRear,
    pose.shoulderFront,
    pose.hipFront,
    pose.hipRear,
  ]);

  const neckRadius = Math.max(1, thickness.limb - 1);
  drawBodySegment(canvas, shoulderCenter, pose.neck, neckRadius);
  drawBodySegment(canvas, pose.neck, pose.headCenter, neckRadius);
  drawHead(canvas, pose.headCenter, thickness.head);

  drawLimb(canvas, pose.shoulderFront, pose.elbowFront, pose.handFront, thickness.limb);
  drawLimb(canvas, pose.hipFront, pose.kneeFront, pose.footFront, thickness.limb);
  fillBodySquare(canvas, pose.handRear, thickness.limb);
  fillBodySquare(canvas, pose.handFront, thickness.limb);
  drawFoot(canvas, pose.footRear, thickness.limb);
  drawFoot(canvas, pose.footFront, thickness.limb);

  const bodyMask = canvas.toMask();
  paintOutline(canvas, bodyMask);
  shadeBody(canvas, bodyMask);
}
