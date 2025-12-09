export { PolygonShape } from './PolygonShape';
export { getPolygonTransformAttrs, getPolyTransformAttrs, calculateVertexDrag, calculateVertexPos } from './PolygonShape_ops';
export { PolygonDrawing } from './PolygonDrawing';
export { 
    getAttachmentPosition as getPolygonAttachmentPosition,
    getAttachedPointPosition as getPolygonAttachedPointPosition, 
    getPolygonAttachedPoints, 
    hasAttachedPointAt as hasPolygonAttachedPointAt,
    getSegmentAttachmentsToPolygon,
    updateAttachedSegments as updatePolygonAttachedSegments,
} from './PolygonAttachment';

