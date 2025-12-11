import type { Shape } from '../../../store/useStore';
import { getShapeVertices, getShapeMidpoints, getShapeEdges, getLineArcIntersections } from '../../../utils/geometry';

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
 * Get the position of an arc-edge intersection point
 */
function getIntersectionPosition(
    arcShape: Shape,
    edgeShape: Shape,
    edgeIndex: number,
    intersectionIndex: number
): { x: number; y: number } | null {
    if (arcShape.type !== 'arc' || !arcShape.radius || 
        arcShape.startAngle === undefined || arcShape.sweepAngle === undefined) {
        return null;
    }
    
    const edges = getShapeEdges(edgeShape);
    if (edgeIndex >= edges.length) return null;
    
    const [p1, p2] = edges[edgeIndex];
    const intersections = getLineArcIntersections(
        p1, p2,
        { x: arcShape.x, y: arcShape.y },
        arcShape.radius,
        arcShape.startAngle,
        arcShape.sweepAngle
    );
    
    if (intersectionIndex < intersections.length) {
        return intersections[intersectionIndex];
    }
    
    // If the specific intersection index doesn't exist anymore (shapes moved),
    // return the closest intersection if any exist
    if (intersections.length > 0) {
        return intersections[0];
    }
    
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
    
    // Find all arcs attached to this shape (including intersection attachments)
    allShapes.forEach(shape => {
        if (shape.type !== 'arc' || !shape.centerAttachment) return;
        
        const attachment = shape.centerAttachment;
        
        // Handle intersection attachments
        if (attachment.attachType === 'intersection') {
            // Check if either the arc or the edge-containing shape moved
            const isInvolved = attachment.targetShapeId === movedShape.id || 
                              attachment.secondaryShapeId === movedShape.id;
            if (!isInvolved) return;
            
            // Find the arc and edge shapes
            const arcShape = allShapes.find(s => s.id === attachment.targetShapeId);
            const edgeShape = allShapes.find(s => s.id === attachment.secondaryShapeId);
            
            if (arcShape && edgeShape) {
                const newPos = getIntersectionPosition(
                    arcShape,
                    edgeShape,
                    attachment.targetIndex,
                    attachment.intersectionIndex ?? 0
                );
                
                if (newPos) {
                    updates[shape.id] = { x: newPos.x, y: newPos.y };
                }
            }
            return;
        }
        
        // Handle regular attachments (vertex, midpoint, etc.)
        if (attachment.targetShapeId !== movedShape.id) return;
        
        // Get the new position of the attachment point
        const newPos = getAttachmentPosition(
            movedShape,
            attachment.attachType,
            attachment.targetIndex
        );
        
        if (newPos) {
            updates[shape.id] = { x: newPos.x, y: newPos.y };
        }
    });
    
    return updates;
}

/**
 * Get all arcs attached to a specific shape.
 * Includes arcs with intersection attachments where the shape is either the arc or edge source.
 */
export function getArcsAttachedTo(
    targetShapeId: string,
    allShapes: Shape[]
): Shape[] {
    return allShapes.filter(shape => {
        if (shape.type !== 'arc' || !shape.centerAttachment) return false;
        
        const attachment = shape.centerAttachment;
        
        // Check if this shape is the primary target
        if (attachment.targetShapeId === targetShapeId) return true;
        
        // For intersection attachments, also check the secondary shape
        if (attachment.attachType === 'intersection' && 
            attachment.secondaryShapeId === targetShapeId) {
            return true;
        }
        
        return false;
    });
}

