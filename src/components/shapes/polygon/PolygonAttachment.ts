import type { Shape, AttachedPoint } from '../../../store/useStore';
import type { Point } from '../../../utils/geometry';
import { getShapeVertices, getShapeMidpoints } from '../../../utils/geometry';

/**
 * Calculate the absolute position of an attached point on a polygon.
 * The point moves with the shape when it's transformed.
 */
export function getAttachedPointPosition(
    shape: Shape,
    attachedPoint: AttachedPoint
): Point | null {
    if (shape.type !== 'polygon') return null;
    
    if (attachedPoint.attachType === 'vertex') {
        const vertices = getShapeVertices(shape);
        if (attachedPoint.index < vertices.length) {
            return vertices[attachedPoint.index];
        }
    } else if (attachedPoint.attachType === 'midpoint') {
        const midpoints = getShapeMidpoints(shape);
        if (attachedPoint.index < midpoints.length) {
            return midpoints[attachedPoint.index];
        }
    }
    
    return null;
}

/**
 * Get all attached points for a polygon with their calculated positions.
 */
export function getPolygonAttachedPoints(
    shape: Shape,
    attachedPoints: AttachedPoint[]
): Array<{ point: AttachedPoint; position: Point }> {
    if (shape.type !== 'polygon') return [];
    
    const result: Array<{ point: AttachedPoint; position: Point }> = [];
    
    for (const ap of attachedPoints) {
        if (ap.shapeId === shape.id) {
            const pos = getAttachedPointPosition(shape, ap);
            if (pos) {
                result.push({ point: ap, position: pos });
            }
        }
    }
    
    return result;
}

/**
 * Check if an attached point already exists at the given location.
 */
export function hasAttachedPointAt(
    shapeId: string,
    attachType: 'vertex' | 'midpoint',
    index: number,
    attachedPoints: AttachedPoint[]
): boolean {
    return attachedPoints.some(
        ap => ap.shapeId === shapeId && 
              ap.attachType === attachType && 
              ap.index === index
    );
}

