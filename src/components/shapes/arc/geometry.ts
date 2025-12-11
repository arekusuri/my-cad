import type { Shape } from '../../../store/useStore';
import type { Point } from '../../../utils/geometry';
import { getRectLines, isPointInRect, getLineArcIntersections } from '../../../utils/geometry';

export function getVertices(shape: Shape): Point[] {
  const radius = shape.radius || 0;
  const startAngle = (shape.startAngle || 0) * Math.PI / 180;
  const sweepAngle = (shape.sweepAngle || 0) * Math.PI / 180;
  const endAngle = startAngle + sweepAngle;
  
  return [
    { x: shape.x, y: shape.y }, // Center
    { x: shape.x + radius * Math.cos(startAngle), y: shape.y + radius * Math.sin(startAngle) }, // Start
    { x: shape.x + radius * Math.cos(endAngle), y: shape.y + radius * Math.sin(endAngle) } // End
  ];
}

export function getEdges(_shape: Shape): [Point, Point][] {
  // Arc has no linear edges (it's curved)
  return [];
}

export function getMidpoints(_shape: Shape): Point[] {
  // Arc has no midpoints
  return [];
}

export function isInRect(shape: Shape, rect: { x: number; y: number; width: number; height: number }): boolean {
  const minX = Math.min(rect.x, rect.x + rect.width);
  const maxX = Math.max(rect.x, rect.x + rect.width);
  const minY = Math.min(rect.y, rect.y + rect.height);
  const maxY = Math.max(rect.y, rect.y + rect.height);
  const contains = (x: number, y: number) => x >= minX && x <= maxX && y >= minY && y <= maxY;
  
  const r = shape.radius || 0;
  const startAngle = (shape.startAngle || 0) * Math.PI / 180;
  const sweepAngle = (shape.sweepAngle || 0) * Math.PI / 180;
  const endAngle = startAngle + sweepAngle;
  
  if (!contains(shape.x, shape.y)) return false;
  if (!contains(shape.x + r * Math.cos(startAngle), shape.y + r * Math.sin(startAngle))) return false;
  if (!contains(shape.x + r * Math.cos(endAngle), shape.y + r * Math.sin(endAngle))) return false;
  return true;
}

export function intersectsRect(shape: Shape, rect: { x: number; y: number; width: number; height: number }): boolean {
  if (isInRect(shape, rect)) return true;
  
  const r = shape.radius || 0;
  const startAngle = (shape.startAngle || 0) * Math.PI / 180;
  const sweepAngle = (shape.sweepAngle || 0) * Math.PI / 180;
  const endAngle = startAngle + sweepAngle;
  
  const center = { x: shape.x, y: shape.y };
  const startPoint = { x: shape.x + r * Math.cos(startAngle), y: shape.y + r * Math.sin(startAngle) };
  const endPoint = { x: shape.x + r * Math.cos(endAngle), y: shape.y + r * Math.sin(endAngle) };
  
  if (isPointInRect(center, rect) || isPointInRect(startPoint, rect) || isPointInRect(endPoint, rect)) {
    return true;
  }
  
  // Check if rect edges intersect with arc
  const rectLines = getRectLines(rect.x, rect.y, rect.width, rect.height, 0);
  for (const l of rectLines) {
    const arcIntersections = getLineArcIntersections(
      l[0], l[1], center, r, shape.startAngle || 0, shape.sweepAngle || 0
    );
    if (arcIntersections.length > 0) return true;
  }
  
  return false;
}

