import type { Shape, AttachedPoint, SegmentAttachment } from '../../../store/useStore';
import type { Point } from '../../../utils/geometry';
import { getShapeVertices, getShapeMidpoints, getShapeEdges, getPerpendicularFoot } from '../../../utils/geometry';

/**
 * Calculate the absolute position of an attachment point on a polygon.
 * Works for both AttachedPoints and SegmentAttachment targets.
 */
export function getAttachmentPosition(
    shape: Shape,
    attachType: 'vertex' | 'midpoint' | 'perpendicular',
    index: number,
    referencePoint?: Point  // For perpendicular, the point to project from
): Point | null {
    if (shape.type !== 'polygon') return null;
    
    if (attachType === 'vertex') {
        const vertices = getShapeVertices(shape);
        if (index < vertices.length) {
            return vertices[index];
        }
    } else if (attachType === 'midpoint') {
        const midpoints = getShapeMidpoints(shape);
        if (index < midpoints.length) {
            return midpoints[index];
        }
    } else if (attachType === 'perpendicular' && referencePoint) {
        // For perpendicular, index is the edge index
        const edges = getShapeEdges(shape);
        if (index < edges.length) {
            const [p1, p2] = edges[index];
            const foot = getPerpendicularFoot(referencePoint, p1, p2);
            if (foot) {
                return foot;
            }
            // If perpendicular foot falls outside the edge, snap to nearest endpoint
            const d1 = Math.hypot(referencePoint.x - p1.x, referencePoint.y - p1.y);
            const d2 = Math.hypot(referencePoint.x - p2.x, referencePoint.y - p2.y);
            return d1 < d2 ? p1 : p2;
        }
    }
    
    return null;
}

/**
 * Calculate the absolute position of an attached point on a polygon.
 * The point moves with the shape when it's transformed.
 */
export function getAttachedPointPosition(
    shape: Shape,
    attachedPoint: AttachedPoint
): Point | null {
    return getAttachmentPosition(shape, attachedPoint.attachType, attachedPoint.index);
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

/**
 * Get all segment attachments that target this polygon.
 */
export function getSegmentAttachmentsToPolygon(
    polygonId: string,
    segmentAttachments: SegmentAttachment[]
): SegmentAttachment[] {
    return segmentAttachments.filter(a => a.targetShapeId === polygonId);
}

/**
 * Update all segments attached to this polygon.
 * Returns an object mapping segment IDs to their new attributes.
 * 
 * If a segment has only one endpoint attached, the entire segment translates.
 * If both endpoints are attached, each endpoint moves independently.
 * For perpendicular attachments, the attached point maintains perpendicular relationship to the edge.
 */
export function updateAttachedSegments(
    polygon: Shape,
    allShapes: Shape[],
    segmentAttachments: SegmentAttachment[]
): Record<string, Partial<Shape>> {
    if (polygon.type !== 'polygon') return {};
    
    const updates: Record<string, Partial<Shape>> = {};
    const attachments = getSegmentAttachmentsToPolygon(polygon.id, segmentAttachments);
    
    for (const attachment of attachments) {
        const segment = allShapes.find(s => s.id === attachment.segmentId);
        if (!segment || segment.type !== 'segment' || !segment.points) continue;
        
        // For perpendicular attachments, we need the other endpoint as reference
        let referencePoint: Point | undefined;
        if (attachment.attachType === 'perpendicular') {
            // Get the other (free) endpoint's absolute position
            const otherEndpoint = attachment.endpoint === 0 ? 1 : 0;
            referencePoint = {
                x: segment.x + segment.points[otherEndpoint * 2],
                y: segment.y + segment.points[otherEndpoint * 2 + 1]
            };
        }
        
        const targetPos = getAttachmentPosition(polygon, attachment.attachType, attachment.targetIndex, referencePoint);
        if (!targetPos) continue;
        
        // Check how many attachments this segment has in total
        const segmentTotalAttachments = segmentAttachments.filter(a => a.segmentId === segment.id);
        const hasOnlyOneAttachment = segmentTotalAttachments.length === 1;
        
        // Get or create updates for this segment
        if (!updates[segment.id]) {
            updates[segment.id] = { 
                x: segment.x,
                y: segment.y,
                points: [...segment.points] 
            };
        }
        
        const currentUpdate = updates[segment.id];
        const points = currentUpdate.points as number[];
        
        if (attachment.attachType === 'perpendicular') {
            // For perpendicular attachments, always update the endpoint position to the perpendicular foot
            if (attachment.endpoint === 0) {
                // Update start point - move origin
                const endAbsX = segment.x + segment.points[2];
                const endAbsY = segment.y + segment.points[3];
                
                currentUpdate.x = targetPos.x;
                currentUpdate.y = targetPos.y;
                points[2] = endAbsX - targetPos.x;
                points[3] = endAbsY - targetPos.y;
                points[0] = 0;
                points[1] = 0;
            } else {
                // Update end point
                const startX = currentUpdate.x !== undefined ? currentUpdate.x : segment.x;
                const startY = currentUpdate.y !== undefined ? currentUpdate.y : segment.y;
                points[2] = targetPos.x - startX;
                points[3] = targetPos.y - startY;
            }
        } else if (hasOnlyOneAttachment) {
            // Only one attachment - translate the entire segment
            // Calculate delta from current attached point position to target position
            const currentAttachedX = segment.x + segment.points[attachment.endpoint * 2];
            const currentAttachedY = segment.y + segment.points[attachment.endpoint * 2 + 1];
            const deltaX = targetPos.x - currentAttachedX;
            const deltaY = targetPos.y - currentAttachedY;
            
            currentUpdate.x = segment.x + deltaX;
            currentUpdate.y = segment.y + deltaY;
            // Points stay the same (segment shape unchanged)
        } else if (attachment.endpoint === 0) {
            // Two attachments - update start point, move the segment origin
            const endAbsX = segment.x + segment.points[2];
            const endAbsY = segment.y + segment.points[3];
            
            currentUpdate.x = targetPos.x;
            currentUpdate.y = targetPos.y;
            // Adjust end point to maintain absolute position
            points[2] = endAbsX - targetPos.x;
            points[3] = endAbsY - targetPos.y;
            points[0] = 0;
            points[1] = 0;
        } else {
            // Two attachments - update end point
            const startX = currentUpdate.x !== undefined ? currentUpdate.x : segment.x;
            const startY = currentUpdate.y !== undefined ? currentUpdate.y : segment.y;
            points[2] = targetPos.x - startX;
            points[3] = targetPos.y - startY;
        }
    }
    
    return updates;
}

