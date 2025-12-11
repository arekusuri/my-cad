import type { Shape } from '../../../store/useStore';
import type { Point } from '../../../utils/geometry';
import { getRectLines, isPointInRect, getLineIntersection } from '../../../utils/geometry';

export function getVertices(shape: Shape): Point[] {
  const points = shape.points || [];
  const rad = (shape.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  
  const vertices: Point[] = [];
  for (let i = 0; i < points.length; i += 2) {
    const px = points[i];
    const py = points[i + 1];
    const rx = px * cos - py * sin;
    const ry = px * sin + py * cos;
    vertices.push({ x: shape.x + rx, y: shape.y + ry });
  }
  return vertices;
}

export function getEdges(shape: Shape): [Point, Point][] {
  const vertices = getVertices(shape);
  if (vertices.length >= 2) {
    return [[vertices[0], vertices[1]]];
  }
  return [];
}

export function getMidpoints(shape: Shape): Point[] {
  const vertices = getVertices(shape);
  if (vertices.length < 2) return [];
  
  const midpoints: Point[] = [];
  for (let i = 0; i < vertices.length - 1; i++) {
    midpoints.push({
      x: (vertices[i].x + vertices[i + 1].x) / 2,
      y: (vertices[i].y + vertices[i + 1].y) / 2
    });
  }
  return midpoints;
}

export function isInRect(shape: Shape, rect: { x: number; y: number; width: number; height: number }): boolean {
  const minX = Math.min(rect.x, rect.x + rect.width);
  const maxX = Math.max(rect.x, rect.x + rect.width);
  const minY = Math.min(rect.y, rect.y + rect.height);
  const maxY = Math.max(rect.y, rect.y + rect.height);
  const contains = (x: number, y: number) => x >= minX && x <= maxX && y >= minY && y <= maxY;
  
  const vertices = getVertices(shape);
  return vertices.every(v => contains(v.x, v.y));
}

export function intersectsRect(shape: Shape, rect: { x: number; y: number; width: number; height: number }): boolean {
  if (isInRect(shape, rect)) return true;
  
  const rectLines = getRectLines(rect.x, rect.y, rect.width, rect.height, 0);
  const vertices = getVertices(shape);
  const edges = getEdges(shape);
  
  if (vertices.some(v => isPointInRect(v, rect))) return true;
  
  for (const [p1, p2] of edges) {
    for (const l of rectLines) {
      if (getLineIntersection(p1, p2, l[0], l[1])) return true;
    }
  }
  
  return false;
}

