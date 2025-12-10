import type { Point } from '../../../utils/geometry';

/**
 * Calculate the perpendicular foot from a point to a line segment.
 * 
 * @param point The point from which to drop the perpendicular
 * @param lineStart Start point of the line segment
 * @param lineEnd End point of the line segment
 * @returns The foot point and whether it's on the segment
 */
export function calculatePerpendicularFoot(
  point: Point,
  lineStart: Point,
  lineEnd: Point
): { foot: Point; isOnEdge: boolean } {
  // Vector from lineStart to lineEnd
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  
  // Length squared of the line segment
  const lenSq = dx * dx + dy * dy;
  
  if (lenSq < 0.0001) {
    // Degenerate case: line segment is a point
    return { foot: lineStart, isOnEdge: true };
  }
  
  // Parameter t for the projection of point onto the line
  // t = ((P - A) · (B - A)) / |B - A|²
  const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSq;
  
  // Calculate the foot point
  const foot: Point = {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy
  };
  
  // Check if foot is within the segment (0 <= t <= 1)
  const isOnEdge = t >= 0 && t <= 1;
  
  return { foot, isOnEdge };
}

