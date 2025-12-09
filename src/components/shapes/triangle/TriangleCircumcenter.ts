import type { Shape } from '../../../store/useStore';
import type { Point } from '../../../utils/geometry';
import { getShapeVertices } from '../../../utils/geometry';

/**
 * Circumcenter (外心) of a triangle.
 * The circumcenter is the center of the circumscribed circle that passes through all three vertices.
 * It is equidistant from all three vertices of the triangle.
 */
export interface Circumcenter {
    /** Center point of the circumcircle */
    center: Point;
    /** Radius of the circumcircle */
    radius: number;
}

/**
 * Calculate the circumcenter (外心) of a triangle.
 * The circumcenter is found at the intersection of the perpendicular bisectors of the triangle's sides.
 * 
 * @param shape The triangle shape
 * @returns The circumcenter point and circumradius, or null if the triangle is degenerate
 */
export function getCircumcenter(shape: Shape): Circumcenter | null {
    if (shape.type !== 'triangle') return null;
    
    const vertices = getShapeVertices(shape);
    if (vertices.length !== 3) return null;
    
    const [A, B, C] = vertices;
    
    return calculateCircumcenter(A, B, C);
}

/**
 * Calculate the circumcenter from three points.
 * 
 * @param A First vertex
 * @param B Second vertex
 * @param C Third vertex
 * @returns The circumcenter and radius, or null if points are collinear
 */
export function calculateCircumcenter(A: Point, B: Point, C: Point): Circumcenter | null {
    // Calculate the determinant D = 2 * (Ax(By - Cy) + Bx(Cy - Ay) + Cx(Ay - By))
    const D = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
    
    // If D is close to zero, the points are collinear (degenerate triangle)
    if (Math.abs(D) < 0.0001) return null;
    
    // Calculate |A|², |B|², |C|² (squared magnitudes)
    const A2 = A.x * A.x + A.y * A.y;
    const B2 = B.x * B.x + B.y * B.y;
    const C2 = C.x * C.x + C.y * C.y;
    
    // Calculate circumcenter coordinates
    const centerX = (A2 * (B.y - C.y) + B2 * (C.y - A.y) + C2 * (A.y - B.y)) / D;
    const centerY = (A2 * (C.x - B.x) + B2 * (A.x - C.x) + C2 * (B.x - A.x)) / D;
    
    const center: Point = { x: centerX, y: centerY };
    
    // Calculate circumradius (distance from center to any vertex)
    const radius = Math.sqrt(
        Math.pow(center.x - A.x, 2) + Math.pow(center.y - A.y, 2)
    );
    
    return { center, radius };
}

/**
 * Get the circumcenter position for a triangle.
 * Returns just the center point, useful for simple display.
 * 
 * @param shape The triangle shape
 * @returns The circumcenter point, or null if invalid
 */
export function getCircumcenterPoint(shape: Shape): Point | null {
    const result = getCircumcenter(shape);
    return result ? result.center : null;
}

