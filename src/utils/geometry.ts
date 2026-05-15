import type { Shape } from '../store/useStore';

// Import shape-specific geometry modules
import * as rectangleGeometry from '../components/shapes/rectangle/geometry';
import * as circleGeometry from '../components/shapes/circle/geometry';
import * as segmentGeometry from '../components/shapes/segment/geometry';
import * as triangleGeometry from '../components/shapes/triangle/geometry';
import * as polygonGeometry from '../components/shapes/polygon/geometry';
import * as angleGeometry from '../components/shapes/angle/geometry';
import * as arcGeometry from '../components/shapes/arc/geometry';
import * as freehandGeometry from '../components/shapes/freehand/geometry';

export interface Point {
  x: number;
  y: number;
}

// Shape geometry registry
const shapeGeometry: Record<string, {
  getVertices: (shape: Shape) => Point[];
  getEdges: (shape: Shape) => [Point, Point][];
  getMidpoints: (shape: Shape) => Point[];
  isInRect: (shape: Shape, rect: { x: number; y: number; width: number; height: number }) => boolean;
  intersectsRect: (shape: Shape, rect: { x: number; y: number; width: number; height: number }) => boolean;
}> = {
  rectangle: rectangleGeometry,
  circle: circleGeometry,
  segment: segmentGeometry,
  line: segmentGeometry, // Line uses same geometry as segment
  triangle: triangleGeometry,
  polygon: polygonGeometry,
  angle: angleGeometry,
  arc: arcGeometry,
  freehand: freehandGeometry,
};

// ============== Core Geometry Functions ==============

export function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

export function onSegment(p: Point, q: Point, r: Point): boolean {
  return (
    q.x <= Math.max(p.x, r.x) &&
    q.x >= Math.min(p.x, r.x) &&
    q.y <= Math.max(p.y, r.y) &&
    q.y >= Math.min(p.y, r.y)
  );
}

function orientation(p: Point, q: Point, r: Point): number {
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (Math.abs(val) < 0.001) return 0;
  return val > 0 ? 1 : 2;
}

export function getLineIntersection(p1: Point, q1: Point, p2: Point, q2: Point): Point | null {
  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  if (o1 !== o2 && o3 !== o4) {
    const den = (q2.y - p2.y) * (q1.x - p1.x) - (q2.x - p2.x) * (q1.y - p1.y);
    if (den === 0) return null;
    const ua = ((q2.x - p2.x) * (p1.y - p2.y) - (q2.y - p2.y) * (p1.x - p2.x)) / den;
    return { x: p1.x + ua * (q1.x - p1.x), y: p1.y + ua * (q1.y - p1.y) };
  }
  return null;
}

export function getRectLines(x: number, y: number, w: number, h: number, rotation: number = 0) {
  if (rotation === 0) {
    const p1 = { x, y };
    const p2 = { x: x + w, y };
    const p3 = { x: x + w, y: y + h };
    const p4 = { x, y: y + h };
    return [[p1, p2], [p2, p3], [p3, p4], [p4, p1]];
  }
  
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const rotate = (px: number, py: number) => ({
    x: x + (px - x) * cos - (py - y) * sin,
    y: y + (px - x) * sin + (py - y) * cos
  });

  const p1 = { x, y };
  const p2 = rotate(x + w, y);
  const p3 = rotate(x + w, y + h);
  const p4 = rotate(x, y + h);
  return [[p1, p2], [p2, p3], [p3, p4], [p4, p1]];
}

export function isPointInRect(p: Point, rect: { x: number; y: number; width: number; height: number }) {
  const minX = Math.min(rect.x, rect.x + rect.width);
  const maxX = Math.max(rect.x, rect.x + rect.width);
  const minY = Math.min(rect.y, rect.y + rect.height);
  const maxY = Math.max(rect.y, rect.y + rect.height);
  return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
}

// ============== Arc Intersection (used by arc geometry) ==============

/**
 * Check if an angle is within an arc's angular range
 */
function isAngleOnArc(
  angle: number, 
  startAngleRad: number, 
  sweepAngleRad: number
): boolean {
  let normalizedAngle = angle;
  let normalizedStart = startAngleRad;
  
  while (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;
  while (normalizedAngle >= 2 * Math.PI) normalizedAngle -= 2 * Math.PI;
  while (normalizedStart < 0) normalizedStart += 2 * Math.PI;
  while (normalizedStart >= 2 * Math.PI) normalizedStart -= 2 * Math.PI;
  
  if (sweepAngleRad >= 0) {
    const endAngle = normalizedStart + sweepAngleRad;
    if (endAngle > 2 * Math.PI) {
      return normalizedAngle >= normalizedStart || normalizedAngle <= endAngle - 2 * Math.PI;
    }
    return normalizedAngle >= normalizedStart && normalizedAngle <= endAngle;
  } else {
    const endAngle = normalizedStart + sweepAngleRad;
    if (endAngle < 0) {
      return normalizedAngle <= normalizedStart || normalizedAngle >= endAngle + 2 * Math.PI;
    }
    return normalizedAngle <= normalizedStart && normalizedAngle >= endAngle;
  }
}

/**
 * Get intersection points between two arcs
 */
export function getArcArcIntersections(
  center1: Point, radius1: number, startAngle1: number, sweepAngle1: number,
  center2: Point, radius2: number, startAngle2: number, sweepAngle2: number
): Point[] {
  const intersections: Point[] = [];
  
  // Distance between centers
  const dx = center2.x - center1.x;
  const dy = center2.y - center1.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  
  // Check if circles intersect
  if (d > radius1 + radius2 + 0.001) return intersections; // Too far apart
  if (d < Math.abs(radius1 - radius2) - 0.001) return intersections; // One inside the other
  if (d < 0.001 && Math.abs(radius1 - radius2) < 0.001) return intersections; // Same circle
  
  // Find intersection points of the two circles
  const a = (radius1 * radius1 - radius2 * radius2 + d * d) / (2 * d);
  const h2 = radius1 * radius1 - a * a;
  
  if (h2 < 0) return intersections; // No real intersection
  
  const h = Math.sqrt(h2);
  
  // Point P is along the line from center1 to center2, at distance a from center1
  const px = center1.x + (a * dx) / d;
  const py = center1.y + (a * dy) / d;
  
  // Convert angles to radians
  const start1Rad = startAngle1 * Math.PI / 180;
  const sweep1Rad = sweepAngle1 * Math.PI / 180;
  const start2Rad = startAngle2 * Math.PI / 180;
  const sweep2Rad = sweepAngle2 * Math.PI / 180;
  
  if (h < 0.001) {
    // Single intersection point (circles tangent)
    const point = { x: px, y: py };
    const angle1 = Math.atan2(point.y - center1.y, point.x - center1.x);
    const angle2 = Math.atan2(point.y - center2.y, point.x - center2.x);
    
    if (isAngleOnArc(angle1, start1Rad, sweep1Rad) && 
        isAngleOnArc(angle2, start2Rad, sweep2Rad)) {
      intersections.push(point);
    }
  } else {
    // Two intersection points
    const point1 = {
      x: px + (h * dy) / d,
      y: py - (h * dx) / d
    };
    const point2 = {
      x: px - (h * dy) / d,
      y: py + (h * dx) / d
    };
    
    // Check if each point is on both arcs
    for (const point of [point1, point2]) {
      const angle1 = Math.atan2(point.y - center1.y, point.x - center1.x);
      const angle2 = Math.atan2(point.y - center2.y, point.x - center2.x);
      
      if (isAngleOnArc(angle1, start1Rad, sweep1Rad) && 
          isAngleOnArc(angle2, start2Rad, sweep2Rad)) {
        intersections.push(point);
      }
    }
  }
  
  return intersections;
}

export function getLineArcIntersections(
  lineStart: Point,
  lineEnd: Point,
  arcCenter: Point,
  arcRadius: number,
  arcStartAngle: number,
  arcSweepAngle: number
): Point[] {
  const intersections: Point[] = [];
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const fx = lineStart.x - arcCenter.x;
  const fy = lineStart.y - arcCenter.y;
  
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - arcRadius * arcRadius;
  const discriminant = b * b - 4 * a * c;
  
  if (discriminant < 0 || a === 0) return intersections;
  
  const sqrtDisc = Math.sqrt(discriminant);
  const t1 = (-b - sqrtDisc) / (2 * a);
  const t2 = (-b + sqrtDisc) / (2 * a);
  
  const startAngleRad = arcStartAngle * Math.PI / 180;
  const sweepAngleRad = arcSweepAngle * Math.PI / 180;
  
  const isOnArc = (point: Point): boolean => {
    const angle = Math.atan2(point.y - arcCenter.y, point.x - arcCenter.x);
    let normalizedAngle = angle;
    let normalizedStart = startAngleRad;
    
    while (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;
    while (normalizedAngle >= 2 * Math.PI) normalizedAngle -= 2 * Math.PI;
    while (normalizedStart < 0) normalizedStart += 2 * Math.PI;
    while (normalizedStart >= 2 * Math.PI) normalizedStart -= 2 * Math.PI;
    
    if (sweepAngleRad >= 0) {
      const endAngle = normalizedStart + sweepAngleRad;
      if (endAngle > 2 * Math.PI) {
        return normalizedAngle >= normalizedStart || normalizedAngle <= endAngle - 2 * Math.PI;
      }
      return normalizedAngle >= normalizedStart && normalizedAngle <= endAngle;
    } else {
      const endAngle = normalizedStart + sweepAngleRad;
      if (endAngle < 0) {
        return normalizedAngle <= normalizedStart || normalizedAngle >= endAngle + 2 * Math.PI;
      }
      return normalizedAngle <= normalizedStart && normalizedAngle >= endAngle;
    }
  };
  
  for (const t of [t1, t2]) {
    if (t >= 0 && t <= 1) {
      const point = { x: lineStart.x + t * dx, y: lineStart.y + t * dy };
      if (isOnArc(point)) {
        intersections.push(point);
      }
    }
  }
  
  return intersections;
}

// ============== Dispatcher Functions ==============

export function getShapeVertices(shape: Shape): Point[] {
  const geo = shapeGeometry[shape.type];
  return geo ? geo.getVertices(shape) : [];
}

export function getShapeEdges(shape: Shape): [Point, Point][] {
  const geo = shapeGeometry[shape.type];
  return geo ? geo.getEdges(shape) : [];
}

export function getShapeMidpoints(shape: Shape): Point[] {
  const geo = shapeGeometry[shape.type];
  return geo ? geo.getMidpoints(shape) : [];
}

export function isShapeInRect(shape: Shape, rect: { x: number; y: number; width: number; height: number }): boolean {
  const geo = shapeGeometry[shape.type];
  return geo ? geo.isInRect(shape, rect) : false;
}

export function doesShapeIntersectRect(shape: Shape, rect: { x: number; y: number; width: number; height: number }): boolean {
  const geo = shapeGeometry[shape.type];
  return geo ? geo.intersectsRect(shape, rect) : false;
}

// ============== Line Intersection Finding ==============

export function findLineIntersections(
  lineStart: Point,
  lineEnd: Point,
  shapes: Shape[],
  excludeShapeId?: string | null
): Point[] {
  const intersections: Point[] = [];
  
  shapes.forEach(shape => {
    if (excludeShapeId && shape.id === excludeShapeId) return;
    
    // Check arc intersections
    if (shape.type === 'arc' && shape.radius !== undefined && 
        shape.startAngle !== undefined && shape.sweepAngle !== undefined) {
      const arcIntersections = getLineArcIntersections(
        lineStart, lineEnd,
        { x: shape.x, y: shape.y },
        shape.radius,
        shape.startAngle,
        shape.sweepAngle
      );
      arcIntersections.forEach(intersection => {
        const distToStart = distance(intersection, lineStart);
        const distToEnd = distance(intersection, lineEnd);
        if (distToStart > 5 && distToEnd > 5) {
          const isDuplicate = intersections.some(p => distance(p, intersection) < 1);
          if (!isDuplicate) {
            intersections.push(intersection);
          }
        }
      });
    }
    
    // Check edge intersections
    const edges = getShapeEdges(shape);
    edges.forEach(([p1, p2]) => {
      const intersection = getLineIntersection(lineStart, lineEnd, p1, p2);
      if (intersection) {
        const distToStart = distance(intersection, lineStart);
        const distToEnd = distance(intersection, lineEnd);
        if (distToStart > 5 && distToEnd > 5) {
          const isDuplicate = intersections.some(p => distance(p, intersection) < 1);
          if (!isDuplicate) {
            intersections.push(intersection);
          }
        }
      }
    });
  });
  
  return intersections;
}
