export interface PipePoint {
  x: number;
  y: number;
}

export interface PipeLineSegment {
  kind: 'line';
  from: PipePoint;
  to: PipePoint;
  length: number;
}

export interface PipeArcSegment {
  kind: 'arc';
  center: PipePoint;
  radius: number;
  startAngle: number;
  endAngle: number;
  anticlockwise: boolean;
  from: PipePoint;
  to: PipePoint;
  length: number;
}

export type PipePathSegment = PipeLineSegment | PipeArcSegment;

export function buildRoundedOrthogonalPath(points: PipePoint[], requestedRadius: number): PipePathSegment[] {
  if (points.length < 2) return [];

  const segments: PipePathSegment[] = [];
  let cursor = { ...points[0] };

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const corner = points[index];
    const next = points[index + 1];
    const incoming = axisDirection(previous, corner);
    const outgoing = axisDirection(corner, next);

    if (!incoming || !outgoing || incoming.x === outgoing.x && incoming.y === outgoing.y) {
      pushLine(segments, cursor, corner);
      cursor = { ...corner };
      continue;
    }

    const incomingLength = distance(previous, corner);
    const outgoingLength = distance(corner, next);
    const radius = Math.max(0, Math.min(requestedRadius, incomingLength / 2, outgoingLength / 2));

    if (radius <= 0) {
      pushLine(segments, cursor, corner);
      cursor = { ...corner };
      continue;
    }

    const tangentIn = {
      x: corner.x - incoming.x * radius,
      y: corner.y - incoming.y * radius,
    };
    const tangentOut = {
      x: corner.x + outgoing.x * radius,
      y: corner.y + outgoing.y * radius,
    };
    const center = {
      x: tangentIn.x + outgoing.x * radius,
      y: tangentIn.y + outgoing.y * radius,
    };

    pushLine(segments, cursor, tangentIn);

    const startAngle = Math.atan2(tangentIn.y - center.y, tangentIn.x - center.x);
    const endAngle = Math.atan2(tangentOut.y - center.y, tangentOut.x - center.x);
    const cross = incoming.x * outgoing.y - incoming.y * outgoing.x;
    segments.push({
      kind: 'arc',
      center,
      radius,
      startAngle,
      endAngle,
      anticlockwise: cross < 0,
      from: tangentIn,
      to: tangentOut,
      length: radius * Math.PI / 2,
    });
    cursor = tangentOut;
  }

  pushLine(segments, cursor, points[points.length - 1]);
  return segments;
}

export function sampleRoundedPath(path: PipePathSegment[], progress: number): PipePoint {
  if (path.length === 0) return { x: 0, y: 0 };
  const totalLength = path.reduce((total, segment) => total + segment.length, 0);
  if (totalLength <= 0) return { ...path[0].from };

  let remaining = clamp(progress, 0, 1) * totalLength;
  for (const segment of path) {
    if (remaining <= segment.length || segment === path[path.length - 1]) {
      const t = segment.length > 0 ? clamp(remaining / segment.length, 0, 1) : 0;
      if (segment.kind === 'line') {
        return {
          x: segment.from.x + (segment.to.x - segment.from.x) * t,
          y: segment.from.y + (segment.to.y - segment.from.y) * t,
        };
      }
      const angle = interpolateArcAngle(segment.startAngle, segment.endAngle, segment.anticlockwise, t);
      return {
        x: segment.center.x + Math.cos(angle) * segment.radius,
        y: segment.center.y + Math.sin(angle) * segment.radius,
      };
    }
    remaining -= segment.length;
  }
  return { ...path[path.length - 1].to };
}

function axisDirection(from: PipePoint, to: PipePoint): PipePoint | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx !== 0 && dy !== 0) return null;
  if (dx === 0 && dy === 0) return null;
  return { x: Math.sign(dx), y: Math.sign(dy) };
}

function pushLine(segments: PipePathSegment[], from: PipePoint, to: PipePoint): void {
  const length = distance(from, to);
  if (length <= 0) return;
  segments.push({ kind: 'line', from: { ...from }, to: { ...to }, length });
}

function distance(a: PipePoint, b: PipePoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function interpolateArcAngle(start: number, end: number, anticlockwise: boolean, t: number): number {
  let delta = end - start;
  if (!anticlockwise && delta < 0) delta += Math.PI * 2;
  if (anticlockwise && delta > 0) delta -= Math.PI * 2;
  return start + delta * t;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
