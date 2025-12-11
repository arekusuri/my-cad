import type { Shape } from '../../../store/useStore';
import { getShapeVertices, getShapeMidpoints } from '../../../utils/geometry';

/**
 * Get the position of an attachment point on a shape
 */
function getAttachmentPosition(
    shape: Shape,
    attachType: string,
    targetIndex: number
): { x: number; y: number } | null {
    if (attachType === 'vertex') {
        const vertices = getShapeVertices(shape);
        if (targetIndex < vertices.length) {
            return vertices[targetIndex];
        }
    } else if (attachType === 'midpoint') {
        const midpoints = getShapeMidpoints(shape);
        if (targetIndex < midpoints.length) {
            return midpoints[targetIndex];
        }
    }
    // TODO: Add support for circumcenter, orthocenter, centroid, incenter
    return null;
}

/**
 * Update all arcs attached to a shape when that shape moves.
 * Returns a map of shape ID -> position updates.
 */
export function updateAttachedArcs(
    movedShape: Shape,
    allShapes: Shape[]
): Record<string, Partial<Shape>> {
    const updates: Record<string, Partial<Shape>> = {};
    
    // Find all arcs attached to this shape
    allShapes.forEach(shape => {
        if (shape.type !== 'arc' || !shape.centerAttachment) return;
        if (shape.centerAttachment.targetShapeId !== movedShape.id) return;
        
        // Get the new position of the attachment point
        const newPos = getAttachmentPosition(
            movedShape,
            shape.centerAttachment.attachType,
            shape.centerAttachment.targetIndex
        );
        
        if (newPos) {
            updates[shape.id] = { x: newPos.x, y: newPos.y };
        }
    });
    
    return updates;
}

/**
 * Get all arcs attached to a specific shape.
 */
export function getArcsAttachedTo(
    targetShapeId: string,
    allShapes: Shape[]
): Shape[] {
    return allShapes.filter(
        shape => shape.type === 'arc' && 
                 shape.centerAttachment?.targetShapeId === targetShapeId
    );
}

