import type { Shape } from '../store/useStore';

export interface Point {
  x: number;
  y: number;
}

// Check if point q lies on segment pr
export function onSegment(p: Point, q: Point, r: Point): boolean {
  return (
    q.x <= Math.max(p.x, r.x) &&
    q.x >= Math.min(p.x, r.x) &&
    q.y <= Math.max(p.y, r.y) &&
    q.y >= Math.min(p.y, r.y)
  );
}

// Orientation of ordered triplet (p, q, r)
// 0 -> colinear, 1 -> clockwise, 2 -> counterclockwise
function orientation(p: Point, q: Point, r: Point): number {
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
  if (Math.abs(val) < 0.001) return 0;
  return val > 0 ? 1 : 2;
}

// Find intersection between line segments p1q1 and p2q2
export function getLineIntersection(
  p1: Point,
  q1: Point,
  p2: Point,
  q2: Point
): Point | null {
  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  // General case
  if (o1 !== o2 && o3 !== o4) {
    // Calculate intersection point
    const den = (q2.y - p2.y) * (q1.x - p1.x) - (q2.x - p2.x) * (q1.y - p1.y);
    if (den === 0) return null;
    
    const ua =
      ((q2.x - p2.x) * (p1.y - p2.y) - (q2.y - p2.y) * (p1.x - p2.x)) / den;
      
    return {
      x: p1.x + ua * (q1.x - p1.x),
      y: p1.y + ua * (q1.y - p1.y),
    };
  }

  return null;
}

export function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

export function getRectLines(x: number, y: number, w: number, h: number, rotation: number = 0) {
    // If rotation is 0:
    if (rotation === 0) {
        const p1 = { x, y };
        const p2 = { x: x + w, y };
        const p3 = { x: x + w, y: y + h };
        const p4 = { x, y: y + h };
        return [
            [p1, p2],
            [p2, p3],
            [p3, p4],
            [p4, p1]
        ];
    }
    
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const rotate = (px: number, py: number) => ({
        x: x + (px - x) * cos - (py - y) * sin,
        y: y + (px - x) * sin + (py - y) * cos
    });

    const p1 = { x, y }; // Origin
    const p2 = rotate(x + w, y);
    const p3 = rotate(x + w, y + h);
    const p4 = rotate(x, y + h);

    return [
        [p1, p2],
        [p2, p3],
        [p3, p4],
        [p4, p1]
    ];
}

export function isPointInRect(p: Point, rect: { x: number; y: number; width: number; height: number }) {
  const minX = Math.min(rect.x, rect.x + rect.width);
  const maxX = Math.max(rect.x, rect.x + rect.width);
  const minY = Math.min(rect.y, rect.y + rect.height);
  const maxY = Math.max(rect.y, rect.y + rect.height);
  return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
}

export function isShapeInRect(shape: Shape, rect: { x: number; y: number; width: number; height: number }): boolean {
    const minX = Math.min(rect.x, rect.x + rect.width);
    const maxX = Math.max(rect.x, rect.x + rect.width);
    const minY = Math.min(rect.y, rect.y + rect.height);
    const maxY = Math.max(rect.y, rect.y + rect.height);

    // Helper to check if point is inside
    const contains = (x: number, y: number) => x >= minX && x <= maxX && y >= minY && y <= maxY;

    if (shape.type === 'rect') {
        const corners = getRectLines(shape.x, shape.y, shape.width || 0, shape.height || 0, shape.rotation).map(line => line[0]);
        return corners.every(p => contains(p.x, p.y));
    } else if (shape.type === 'circle') {
        const r = shape.radius || 0;
        // Check bounding box of circle
        return contains(shape.x - r, shape.y - r) && contains(shape.x + r, shape.y + r);
    } else if (shape.type === 'segment' || shape.type === 'triangle' || shape.type === 'polygon') {
        const points = shape.points || [];
        if (points.length < 2) return false;
        
        const rad = (shape.rotation * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        
        for (let i = 0; i < points.length; i += 2) {
            const px = points[i];
            const py = points[i+1];
            
            const rx = px * cos - py * sin;
            const ry = px * sin + py * cos;
            
            const absX = shape.x + rx;
            const absY = shape.y + ry;
            
            if (!contains(absX, absY)) return false;
        }
        return true;
    }
    return false;
}

export function doesShapeIntersectRect(shape: Shape, rect: { x: number; y: number; width: number; height: number }): boolean {
    if (isShapeInRect(shape, rect)) return true;

    const rectLines = getRectLines(rect.x, rect.y, rect.width, rect.height, 0); 
    
     if (shape.type === 'rect') {
        const corners = getRectLines(shape.x, shape.y, shape.width || 0, shape.height || 0, shape.rotation).map(line => line[0]);
        if (corners.some(p => isPointInRect(p, rect))) return true;

        const shapeLines = getRectLines(shape.x, shape.y, shape.width || 0, shape.height || 0, shape.rotation);
        
        for (const l1 of rectLines) {
            for (const l2 of shapeLines) {
                if (getLineIntersection(l1[0], l1[1], l2[0], l2[1])) return true;
            }
        }
        
        return false; 
    } else if (shape.type === 'circle') {
        if (isPointInRect({x: shape.x, y: shape.y}, rect)) return true;
        
        const cx = Math.max(Math.min(shape.x, rect.x + rect.width), rect.x);
        const cy = Math.max(Math.min(shape.y, rect.y + rect.height), rect.y);
        const dx = shape.x - cx;
        const dy = shape.y - cy;
        return (dx * dx + dy * dy) <= ((shape.radius || 0) * (shape.radius || 0));
        
    } else if (shape.type === 'segment' || shape.type === 'triangle' || shape.type === 'polygon') {
         const points = shape.points || [];
         if (points.length < 2) return false;
         
         const rad = (shape.rotation * Math.PI) / 180;
         const cos = Math.cos(rad);
         const sin = Math.sin(rad);
         
         const transformedPoints: Point[] = [];
         for(let i=0; i<points.length; i+=2) {
            const px = points[i];
            const py = points[i+1];
            const rx = px * cos - py * sin;
            const ry = px * sin + py * cos;
            transformedPoints.push({ x: shape.x + rx, y: shape.y + ry });
         }

        // Check segments - triangles and polygons are closed, segments are open
        const numPoints = transformedPoints.length;
        const isClosed = shape.type === 'triangle' || shape.type === 'polygon';
        const numSegments = isClosed ? numPoints : numPoints - 1;

        for (let i = 0; i < numSegments; i++) {
            const p1 = transformedPoints[i];
            const p2 = transformedPoints[(i+1) % numPoints];
            
             for (const l of rectLines) {
                if (getLineIntersection(p1, p2, l[0], l[1])) return true;
            }
            if (isPointInRect(p1, rect) || isPointInRect(p2, rect)) return true;
        }
    }
    
    return false;
}

export function getShapeVertices(shape: Shape): Point[] {
    const vertices: Point[] = [];
    
    if (shape.type === 'rect') {
        const corners = getRectLines(shape.x, shape.y, shape.width || 0, shape.height || 0, shape.rotation).map(line => line[0]);
        vertices.push(...corners);
    } else if (shape.type === 'segment') {
        const points = shape.points || [];
        const rad = (shape.rotation * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        
        for (let i = 0; i < points.length; i += 2) {
            const px = points[i];
            const py = points[i+1];
            
            const rx = px * cos - py * sin;
            const ry = px * sin + py * cos;
            
            vertices.push({ x: shape.x + rx, y: shape.y + ry });
        }
    } else if (shape.type === 'triangle') {
        if (shape.points && shape.points.length >= 6) {
             // If points exist, use them directly
             const points = shape.points;
             const rad = (shape.rotation * Math.PI) / 180;
             const cos = Math.cos(rad);
             const sin = Math.sin(rad);
             
             for (let i = 0; i < points.length; i += 2) {
                const px = points[i];
                const py = points[i+1];
                
                const rx = px * cos - py * sin;
                const ry = px * sin + py * cos;
                
                vertices.push({ x: shape.x + rx, y: shape.y + ry });
            }
        } else {
            // Fallback to radius based regular triangle
            const r = shape.radius || 0;
            const rad = (shape.rotation * Math.PI) / 180;
            
            for (let i = 0; i < 3; i++) {
                 // Angle for vertex i in local space
                 const angle = (i * 2 * Math.PI / 3) - Math.PI / 2; // -PI/2 to start at top
                 const px = r * Math.cos(angle);
                 const py = r * Math.sin(angle);
                 
                 // Rotate by shape rotation
                 const rx = px * Math.cos(rad) - py * Math.sin(rad);
                 const ry = px * Math.sin(rad) + py * Math.cos(rad);
                 
                 vertices.push({ x: shape.x + rx, y: shape.y + ry });
            }
        }
    } else if (shape.type === 'polygon') {
        const POLYGON_SIDES = 6;
        if (shape.points && shape.points.length >= POLYGON_SIDES * 2) {
             // If points exist, use them directly
             const points = shape.points;
             const rad = (shape.rotation * Math.PI) / 180;
             const cos = Math.cos(rad);
             const sin = Math.sin(rad);
             
             for (let i = 0; i < points.length; i += 2) {
                const px = points[i];
                const py = points[i+1];
                
                const rx = px * cos - py * sin;
                const ry = px * sin + py * cos;
                
                vertices.push({ x: shape.x + rx, y: shape.y + ry });
            }
        } else {
            // Fallback to radius based regular hexagon
            const r = shape.radius || 0;
            const rad = (shape.rotation * Math.PI) / 180;
            
            for (let i = 0; i < POLYGON_SIDES; i++) {
                 // Angle for vertex i in local space
                 const angle = (i * 2 * Math.PI / POLYGON_SIDES) - Math.PI / 2; // -PI/2 to start at top
                 const px = r * Math.cos(angle);
                 const py = r * Math.sin(angle);
                 
                 // Rotate by shape rotation
                 const rx = px * Math.cos(rad) - py * Math.sin(rad);
                 const ry = px * Math.sin(rad) + py * Math.cos(rad);
                 
                 vertices.push({ x: shape.x + rx, y: shape.y + ry });
            }
        }
    } else if (shape.type === 'circle') {
        // Center
        vertices.push({ x: shape.x, y: shape.y });
        // Maybe quadrants?
        // Right
        vertices.push({ x: shape.x + (shape.radius || 0), y: shape.y });
    }
    
    return vertices;
}

export function getShapeMidpoints(shape: Shape): Point[] {
    const midpoints: Point[] = [];
    
    if (shape.type === 'rect') {
        const lines = getRectLines(shape.x, shape.y, shape.width || 0, shape.height || 0, shape.rotation);
        lines.forEach(line => {
             const p1 = line[0];
             const p2 = line[1];
             midpoints.push({
                 x: (p1.x + p2.x) / 2,
                 y: (p1.y + p2.y) / 2
             });
        });
    } else if (shape.type === 'segment' || shape.type === 'triangle' || shape.type === 'polygon') {
        const vertices = getShapeVertices(shape);
        // For segment/triangle/polygon, vertices are ordered.
        // Segment: 2 points -> 1 midpoint
        // Triangle: 3 points -> 3 segments (closed)
        // Polygon: 6 points -> 6 segments (closed)
        
        const numPoints = vertices.length;
        if (numPoints < 2) return midpoints;

        const isClosed = shape.type === 'triangle' || shape.type === 'polygon'; // Triangle/Polygon are closed, segment is open
        
        const limit = isClosed ? numPoints : numPoints - 1;
        
        for (let i = 0; i < limit; i++) {
            const p1 = vertices[i];
            const p2 = vertices[(i + 1) % numPoints];
            midpoints.push({
                x: (p1.x + p2.x) / 2,
                y: (p1.y + p2.y) / 2
            });
        }
    }
    
    return midpoints;
}
