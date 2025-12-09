import type { Shape, AttachedPoint } from '../../store/useStore';
import { findClosestSnapPoint } from '../modes/AutoSnappingMode';
import { hasAttachedPointAt as hasTriangleAttachedPointAtOrigin } from '../shapes/triangle/TriangleAttachment';
import { hasAttachedPointAt as hasPolygonAttachedPointAtOrigin } from '../shapes/polygon/PolygonAttachment';

interface HandlePointToolParams {
    pos: { x: number; y: number };
    shapes: Shape[];
    attachedPoints: AttachedPoint[];
    addAttachedPoint: (point: Omit<AttachedPoint, 'id'>) => void;
}

export const handlePointTool = ({
    pos,
    shapes,
    attachedPoints,
    addAttachedPoint
}: HandlePointToolParams) => {
    const snapPoint = findClosestSnapPoint(pos, shapes);
    if (snapPoint) {
        const targetShape = shapes.find(s => s.id === snapPoint.shapeId);
        // Only allow attaching to triangles and polygons
        if (targetShape && (targetShape.type === 'triangle' || targetShape.type === 'polygon')) {
            // Check if point already exists at this location
            const hasExisting = targetShape.type === 'triangle'
                ? hasTriangleAttachedPointAtOrigin(snapPoint.shapeId, snapPoint.type, snapPoint.index, attachedPoints)
                : hasPolygonAttachedPointAtOrigin(snapPoint.shapeId, snapPoint.type, snapPoint.index, attachedPoints);
            
            if (!hasExisting) {
                addAttachedPoint({
                    shapeId: snapPoint.shapeId,
                    attachType: snapPoint.type,
                    index: snapPoint.index,
                });
            }
        }
    }
};

