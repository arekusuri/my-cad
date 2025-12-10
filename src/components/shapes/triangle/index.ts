export { TriangleShape } from './TriangleShape';
export { getTriangleTransformAttrs } from './TriangleShape_ops';
export { TriangleDrawing, type TriangleDrawState } from './TriangleDrawing';
export { TrianglePreview } from './TrianglePreview';
export { 
    getAttachmentPosition as getTriangleAttachmentPosition,
    getAttachedPointPosition as getTriangleAttachedPointPosition, 
    getTriangleAttachedPoints, 
    hasAttachedPointAt as hasTriangleAttachedPointAt,
    getSegmentAttachmentsToTriangle,
    updateAttachedSegments as updateTriangleAttachedSegments,
    getPerpendicularExtension,
    type EdgeExtensionInfo,
} from './TriangleAttachment';
export { 
    getTriangleSpecialSnapPoints, 
    registerTriangleSpecialSnapPoints 
} from './TriangleSnapPoints';
export {
    getPerpendicularFoot,
    getAllPerpendicularFeet,
    getOrthocenter,
    getAltitudeLength,
    calculatePerpendicularFoot,
    type PerpendicularFoot
} from './TrianglePerpendicularFoot';

