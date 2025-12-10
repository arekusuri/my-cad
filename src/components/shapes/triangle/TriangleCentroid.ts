import type { Shape } from '../../../store/useStore';
import type { Point } from '../../../utils/geometry';
import { getShapeVertices } from '../../../utils/geometry';

/**
 * Centroid (重心) of a triangle.
 * The centroid is the intersection point of the three medians.
 * It is also the center of mass of the triangle.
 * The centroid divides each median in ratio 2:1 from vertex.
 */

/**
 * Calculate the centroid (重心) of a triangle.
 * The centroid is simply the average of the three vertices.
 * 
 * Formula: G = ((x1 + x2 + x3) / 3, (y1 + y2 + y3) / 3)
 * 
 * @param shape The triangle shape
 * @returns The centroid point, or null if the triangle is invalid
 */
export function getCentroid(shape: Shape): Point | null {
    if (shape.type !== 'triangle') return null;
    
    const vertices = getShapeVertices(shape);
    if (vertices.length !== 3) return null;
    
    const [A, B, C] = vertices;
    
    return calculateCentroid(A, B, C);
}

/**
 * Calculate the centroid from three points.
 * 
 * @param A First vertex
 * @param B Second vertex
 * @param C Third vertex
 * @returns The centroid point
 */
export function calculateCentroid(A: Point, B: Point, C: Point): Point {
    return {
        x: (A.x + B.x + C.x) / 3,
        y: (A.y + B.y + C.y) / 3
    };
}

/**
 * Get the median endpoints for a triangle.
 * A median connects a vertex to the midpoint of the opposite side.
 * 
 * @param shape The triangle shape
 * @returns Array of median line segments, each as [vertex, midpoint]
 */
export function getMedians(shape: Shape): Array<{ vertex: Point; midpoint: Point }> {
    if (shape.type !== 'triangle') return [];
    
    const vertices = getShapeVertices(shape);
    if (vertices.length !== 3) return [];
    
    const [A, B, C] = vertices;
    
    return [
        // Median from A to midpoint of BC
        {
            vertex: A,
            midpoint: { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 }
        },
        // Median from B to midpoint of CA
        {
            vertex: B,
            midpoint: { x: (C.x + A.x) / 2, y: (C.y + A.y) / 2 }
        },
        // Median from C to midpoint of AB
        {
            vertex: C,
            midpoint: { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 }
        }
    ];
}

