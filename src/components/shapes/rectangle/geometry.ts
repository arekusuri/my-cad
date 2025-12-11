import type { Shape } from '../../../store/useStore';
import type { Point } from '../../../utils/geometry';
import { getRectLines, isPointInRect, getLineIntersection } from '../../../utils/geometry';

export function getVertices(shape: Shape): Point[] {
  const corners = getRectLines(shape.x, shape.y, shape.width || 0, shape.height || 0, shape.rotation).map(line => line[0]);
  return corners;
}

export function getEdges(shape: Shape): [Point, Point][] {
  const lines = getRectLines(shape.x, shape.y, shape.width || 0, shape.height || 0, shape.rotation);
  return lines.map(line => [line[0], line[1]] as [Point, Point]);
}

export function getMidpoints(shape: Shape): Point[] {
  const lines = getRectLines(shape.x, shape.y, shape.width || 0, shape.height || 0, shape.rotation);
  return lines.map(line => ({
    x: (line[0].x + line[1].x) / 2,
    y: (line[0].y + line[1].y) / 2
  }));
}

export function isInRect(shape: Shape, rect: { x: number; y: number; width: number; height: number }): boolean {
  const minX = Math.min(rect.x, rect.x + rect.width);
  const maxX = Math.max(rect.x, rect.x + rect.width);
  const minY = Math.min(rect.y, rect.y + rect.height);
  const maxY = Math.max(rect.y, rect.y + rect.height);
  const contains = (x: number, y: number) => x >= minX && x <= maxX && y >= minY && y <= maxY;
  
  const corners = getVertices(shape);
  return corners.every(p => contains(p.x, p.y));
}

export function intersectsRect(shape: Shape, rect: { x: number; y: number; width: number; height: number }): boolean {
  if (isInRect(shape, rect)) return true;
  
  const rectLines = getRectLines(rect.x, rect.y, rect.width, rect.height, 0);
  const corners = getVertices(shape);
  
  if (corners.some(p => isPointInRect(p, rect))) return true;
  
  const shapeLines = getEdges(shape);
  for (const l1 of rectLines) {
    for (const l2 of shapeLines) {
      if (getLineIntersection(l1[0], l1[1], l2[0], l2[1])) return true;
    }
  }
  
  return false;
}

