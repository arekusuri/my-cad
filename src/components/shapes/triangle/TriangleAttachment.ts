import type { Shape, AttachedPoint, SegmentAttachment } from '../../../store/useStore';
import type { Point } from '../../../utils/geometry';
import { getShapeVertices, getShapeMidpoints } from '../../../utils/geometry';
import { getCircumcenterPoint } from './TriangleCircumcenter';
import { calculatePerpendicularFoot } from './TrianglePerpendicularFoot';

/**
 * Calculate the absolute position of an attachment point on a triangle.
 * Works for both AttachedPoints and SegmentAttachment targets.
 * 
 * @param shape The triangle shape
 * @param attachType The type of attachment
 * @param index The index (vertex/midpoint/edge index)
 * @param referencePoint Optional reference point for perpendicular calculation
 */
export function getAttachmentPosition(
    shape: Shape,
    attachType: 'vertex' | 'midpoint' | 'circumcenter' | 'incenter' | 'centroid' | 'orthocenter' | 'perpendicular',
    index: number,
    referencePoint?: Point
): Point | null {
    if (shape.type !== 'triangle') return null;
    
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
    } else if (attachType === 'circumcenter') {
        return getCircumcenterPoint(shape);
    } else if (attachType === 'perpendicular') {
        // For perpendicular, index is the edge index (0, 1, 2)
        // Edge i goes from vertex[i] to vertex[(i+1)%3]
        const vertices = getShapeVertices(shape);
        if (vertices.length !== 3 || index < 0 || index > 2) return null;
        
        const edgeStart = vertices[index];
        const edgeEnd = vertices[(index + 1) % 3];
        
        if (referencePoint) {
            // Calculate perpendicular foot from reference point to edge
            const { foot, isOnEdge } = calculatePerpendicularFoot(referencePoint, edgeStart, edgeEnd);
            // Even if not on edge, return the foot (it will be clamped to edge ends)
            if (!isOnEdge) {
                // Clamp to edge endpoints
                const t = Math.max(0, Math.min(1, getParametricT(referencePoint, edgeStart, edgeEnd)));
                return {
                    x: edgeStart.x + t * (edgeEnd.x - edgeStart.x),
                    y: edgeStart.y + t * (edgeEnd.y - edgeStart.y)
                };
            }
            return foot;
        } else {
            // No reference point - return edge midpoint as fallback
            return {
                x: (edgeStart.x + edgeEnd.x) / 2,
                y: (edgeStart.y + edgeEnd.y) / 2
            };
        }
    }
    // Future: handle incenter, centroid, orthocenter here
    
    return null;
}

/**
 * Get parametric t value for projection onto line segment
 */
function getParametricT(point: Point, lineStart: Point, lineEnd: Point): number {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < 0.0001) return 0;
    return ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSq;
}

/**
 * Calculate the absolute position of an attached point on a triangle.
 * The point moves with the shape when it's transformed.
 */
export function getAttachedPointPosition(
    shape: Shape,
    attachedPoint: AttachedPoint
): Point | null {
    return getAttachmentPosition(shape, attachedPoint.attachType, attachedPoint.index);
}

/**
 * Get all attached points for a triangle with their calculated positions.
 */
export function getTriangleAttachedPoints(
    shape: Shape,
    attachedPoints: AttachedPoint[]
): Array<{ point: AttachedPoint; position: Point }> {
    if (shape.type !== 'triangle') return [];
    
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
    attachType: 'vertex' | 'midpoint' | 'circumcenter' | 'incenter' | 'centroid' | 'orthocenter' | 'perpendicular',
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
 * Get all segment attachments that target this triangle.
 */
export function getSegmentAttachmentsToTriangle(
    triangleId: string,
    segmentAttachments: SegmentAttachment[]
): SegmentAttachment[] {
    return segmentAttachments.filter(a => a.targetShapeId === triangleId);
}

/**
 * Update all segments attached to this triangle.
 * Returns an object mapping segment IDs to their new attributes.
 * 
 * The first point (endpoint 0) never moves automatically.
 * Only endpoint 1 follows its attachment when the triangle moves.
 */
export function updateAttachedSegments(
    triangle: Shape,
    allShapes: Shape[],
    segmentAttachments: SegmentAttachment[]
): Record<string, Partial<Shape>> {
    if (triangle.type !== 'triangle') return {};
    
    const updates: Record<string, Partial<Shape>> = {};
    const attachments = getSegmentAttachmentsToTriangle(triangle.id, segmentAttachments);
    
    for (const attachment of attachments) {
        const segment = allShapes.find(s => s.id === attachment.segmentId);
        if (!segment || segment.type !== 'segment' || !segment.points) continue;
        
        // For perpendicular attachments, use the segment's other endpoint as reference
        let referencePoint: Point | undefined;
        if (attachment.attachType === 'perpendicular') {
            // Get the other endpoint of the segment
            const otherEndpointIndex = attachment.endpoint === 0 ? 1 : 0;
            referencePoint = {
                x: segment.x + segment.points[otherEndpointIndex * 2],
                y: segment.y + segment.points[otherEndpointIndex * 2 + 1]
            };
            console.log('[updateAttachedSegments] Perpendicular calculation:', {
                segmentId: segment.id,
                endpoint: attachment.endpoint,
                otherEndpointIndex,
                referencePoint,
                segmentX: segment.x,
                segmentY: segment.y,
                segmentPoints: segment.points,
                targetIndex: attachment.targetIndex,
            });
        }
        
        const targetPos = getAttachmentPosition(triangle, attachment.attachType, attachment.targetIndex, referencePoint);
        console.log('[updateAttachedSegments] targetPos:', targetPos);
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
        
        if (hasOnlyOneAttachment) {
            // Only one attachment - keep first point fixed, only move attached endpoint
            if (attachment.endpoint === 1) {
                // Endpoint 1 attached: keep endpoint 0 fixed, update endpoint 1
                const startX = segment.x;
                const startY = segment.y;
                const oldPt2 = { x: startX + segment.points[2], y: startY + segment.points[3] };
                points[2] = targetPos.x - startX;
                points[3] = targetPos.y - startY;
                const newPt2 = { x: startX + points[2], y: startY + points[3] };
                console.log('[Triangle moved] Segment update:', {
                    point1: { x: startX, y: startY },
                    oldPoint2: oldPt2,
                    newPoint2: newPt2,
                    targetPos,
                    referencePoint,
                });
                // points[0] and points[1] stay at 0, 0
            }
            // If endpoint 0 is attached, do nothing - first point should never move
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
