import type { DrawingTool, DrawingContext, DrawingMouseEvent, DrawingResult, SnapPointInfo } from '../../tools/DrawingTool';
import type { Shape } from '../../../store/useStore';

/**
 * Line drawing state
 */
export interface LineDrawState {
    /** First point of the line */
    point1: { x: number; y: number } | null;
    /** Preview of second point (while moving mouse) */
    previewPoint2: { x: number; y: number } | null;
}

/**
 * Line drawing tool
 * Click to set first point, shows infinite line preview, click again to confirm.
 * A line extends infinitely through two points (unlike a segment which has endpoints).
 * When drawing with Alt key, points snap to vertices/midpoints and create attachments.
 */
export class LineDrawing implements DrawingTool {
    readonly name = 'line';
    
    private point1: { x: number; y: number } | null = null;
    private previewPoint2: { x: number; y: number } | null = null;
    private currentShapeId: string | null = null;
    isDrawing: boolean = false;
    
    // Track snap points for creating attachments
    private startSnapInfo: SnapPointInfo | null = null;
    private endSnapInfo: SnapPointInfo | null = null;
    
    handleMouseDown(e: DrawingMouseEvent, ctx: DrawingContext): DrawingResult {
        if (e.button !== 0) return { handled: false };
        
        let x = e.x;
        let y = e.y;
        
        if (!this.point1) {
            // First click - set first point
            this.startSnapInfo = null;
            
            // Apply snapping if Alt is pressed
            if (e.altKey) {
                const snapInfo = ctx.findSnapPointInfo(x, y);
                if (snapInfo) {
                    x = snapInfo.x;
                    y = snapInfo.y;
                    this.startSnapInfo = snapInfo;
                } else {
                    x = ctx.snapToGrid(x);
                    y = ctx.snapToGrid(y);
                }
            }
            
            this.point1 = { x, y };
            this.isDrawing = true;
            
            // Create the line shape immediately (will be updated on mouse move)
            const shape: Omit<Shape, 'id'> = {
                type: 'line',
                x,
                y,
                points: [0, 0, 0, 0], // Will be updated
                stroke: 'black',
                rotation: 0,
            };
            ctx.addShape(shape);
            
            // Get the ID of newly added shape
            const shapes = ctx.getShapes();
            const newShape = shapes[shapes.length - 1];
            if (newShape) {
                this.currentShapeId = newShape.id;
            }
            
            return { handled: true };
        } else {
            // Second click - confirm line
            
            // Apply snapping if Alt is pressed
            if (e.altKey) {
                const snapInfo = ctx.findSnapPointInfo(x, y, this.currentShapeId);
                if (snapInfo) {
                    x = snapInfo.x;
                    y = snapInfo.y;
                    this.endSnapInfo = snapInfo;
                } else {
                    x = ctx.snapToGrid(x);
                    y = ctx.snapToGrid(y);
                }
            }
            
            if (this.currentShapeId) {
                // Check if the two points are too close (degenerate line)
                const dx = x - this.point1.x;
                const dy = y - this.point1.y;
                if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
                    // Delete the shape if points are too close
                    ctx.deleteShape(this.currentShapeId);
                } else {
                    // Update final position
                    ctx.updateShape(this.currentShapeId, {
                        points: [0, 0, dx, dy]
                    });
                    
                    // Create attachments for snapped points
                    const shapes = ctx.getShapes();
                    
                    if (this.startSnapInfo && this.isValidAttachmentTarget(this.startSnapInfo, shapes)) {
                        ctx.addSegmentAttachment({
                            segmentId: this.currentShapeId,
                            endpoint: 0,
                            targetShapeId: this.startSnapInfo.shapeId,
                            attachType: this.startSnapInfo.type,
                            targetIndex: this.startSnapInfo.index,
                        });
                    }
                    
                    if (this.endSnapInfo && this.isValidAttachmentTarget(this.endSnapInfo, shapes)) {
                        ctx.addSegmentAttachment({
                            segmentId: this.currentShapeId,
                            endpoint: 1,
                            targetShapeId: this.endSnapInfo.shapeId,
                            attachType: this.endSnapInfo.type,
                            targetIndex: this.endSnapInfo.index,
                        });
                    }
                }
            }
            
            this.finish();
            return { handled: true, finished: true };
        }
    }
    
    handleMouseMove(e: DrawingMouseEvent, ctx: DrawingContext): DrawingResult {
        if (!this.isDrawing || !this.point1 || !this.currentShapeId) {
            return { handled: false };
        }
        
        let x = e.x;
        let y = e.y;
        
        // Apply snapping if Alt is pressed
        if (e.altKey) {
            const snapInfo = ctx.findSnapPointInfo(x, y, this.currentShapeId);
            if (snapInfo) {
                x = snapInfo.x;
                y = snapInfo.y;
                this.endSnapInfo = snapInfo;
            } else {
                x = ctx.snapToGrid(x);
                y = ctx.snapToGrid(y);
                this.endSnapInfo = null;
            }
        }
        
        this.previewPoint2 = { x, y };
        
        // Update the line shape
        const dx = x - this.point1.x;
        const dy = y - this.point1.y;
        ctx.updateShape(this.currentShapeId, {
            points: [0, 0, dx, dy]
        });
        
        return { handled: true };
    }
    
    handleMouseUp(_e: DrawingMouseEvent, _ctx: DrawingContext): DrawingResult {
        // Line uses click-click, not click-drag, so mouse up does nothing
        return { handled: false };
    }
    
    cancel(): void {
        this.finish();
    }
    
    private finish(): void {
        this.point1 = null;
        this.previewPoint2 = null;
        this.currentShapeId = null;
        this.isDrawing = false;
        this.startSnapInfo = null;
        this.endSnapInfo = null;
    }
    
    getPreviewData(): LineDrawState {
        return {
            point1: this.point1,
            previewPoint2: this.previewPoint2,
        };
    }
    
    /** Check if the snap target is a valid attachment target */
    private isValidAttachmentTarget(snapInfo: SnapPointInfo, shapes: Shape[]): boolean {
        const targetShape = shapes.find(s => s.id === snapInfo.shapeId);
        if (!targetShape) return false;
        
        // Perpendicular foot only valid for triangles
        if (snapInfo.type === 'perpendicular') {
            return targetShape.type === 'triangle';
        }
        
        return targetShape.type === 'triangle' || targetShape.type === 'polygon';
    }
}

