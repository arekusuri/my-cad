import type { Shape } from '../../../store/useStore';
import type { Point } from '../../../utils/geometry';

export function getVertices(shape: Shape): Point[] {
  const points = shape.points || [];
  const vertices: Point[] = [];
  
  // Return all points as vertices
  for (let i = 0; i < points.length; i += 2) {
    vertices.push({ x: points[i], y: points[i + 1] });
  }
  return vertices;
}

export function getEdges(_shape: Shape): [Point, Point][] {
  // Freehand has no linear edges for snapping
  return [];
}

export function getMidpoints(_shape: Shape): Point[] {
  // Freehand has no meaningful midpoints
  return [];
}

export function isInRect(shape: Shape, rect: { x: number; y: number; width: number; height: number }): boolean {
  const minX = Math.min(rect.x, rect.x + rect.width);
  const maxX = Math.max(rect.x, rect.x + rect.width);
  const minY = Math.min(rect.y, rect.y + rect.height);
  const maxY = Math.max(rect.y, rect.y + rect.height);
  const contains = (x: number, y: number) => x >= minX && x <= maxX && y >= minY && y <= maxY;
  
  const points = shape.points || [];
  for (let i = 0; i < points.length; i += 2) {
    if (!contains(points[i], points[i + 1])) return false;
  }
  return points.length > 0;
}

export function intersectsRect(shape: Shape, rect: { x: number; y: number; width: number; height: number }): boolean {
  if (isInRect(shape, rect)) return true;
  
  const minX = Math.min(rect.x, rect.x + rect.width);
  const maxX = Math.max(rect.x, rect.x + rect.width);
  const minY = Math.min(rect.y, rect.y + rect.height);
  const maxY = Math.max(rect.y, rect.y + rect.height);
  
  const points = shape.points || [];
  
  // Check if any point is inside rect
  for (let i = 0; i < points.length; i += 2) {
    const x = points[i];
    const y = points[i + 1];
    if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
      return true;
    }
  }
  
  return false;
}

