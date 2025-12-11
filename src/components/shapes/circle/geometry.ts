import type { Shape } from '../../../store/useStore';
import type { Point } from '../../../utils/geometry';
import { isPointInRect } from '../../../utils/geometry';

export function getVertices(shape: Shape): Point[] {
  return [
    { x: shape.x, y: shape.y }, // Center
    { x: shape.x + (shape.radius || 0), y: shape.y } // Right point
  ];
}

export function getEdges(_shape: Shape): [Point, Point][] {
  // Circle has no linear edges
  return [];
}

export function getMidpoints(_shape: Shape): Point[] {
  // Circle has no midpoints
  return [];
}

export function isInRect(shape: Shape, rect: { x: number; y: number; width: number; height: number }): boolean {
  const minX = Math.min(rect.x, rect.x + rect.width);
  const maxX = Math.max(rect.x, rect.x + rect.width);
  const minY = Math.min(rect.y, rect.y + rect.height);
  const maxY = Math.max(rect.y, rect.y + rect.height);
  const contains = (x: number, y: number) => x >= minX && x <= maxX && y >= minY && y <= maxY;
  
  const r = shape.radius || 0;
  return contains(shape.x - r, shape.y - r) && contains(shape.x + r, shape.y + r);
}

export function intersectsRect(shape: Shape, rect: { x: number; y: number; width: number; height: number }): boolean {
  if (isInRect(shape, rect)) return true;
  if (isPointInRect({ x: shape.x, y: shape.y }, rect)) return true;
  
  // Check if circle intersects rect boundary
  const cx = Math.max(Math.min(shape.x, rect.x + rect.width), rect.x);
  const cy = Math.max(Math.min(shape.y, rect.y + rect.height), rect.y);
  const dx = shape.x - cx;
  const dy = shape.y - cy;
  return (dx * dx + dy * dy) <= ((shape.radius || 0) * (shape.radius || 0));
}

