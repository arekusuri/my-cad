import type { DrawingTool, DrawingContext, DrawingMouseEvent, DrawingResult, SnapPointInfo } from '../../tools/DrawingTool';
import type { Shape } from '../../../store/useStore';
import { constrainLineToOrtho } from '../../modes/OrthoMode';
import type { Point, PerpendicularFootInfo } from '../../../utils/geometry';

/**
 * Segment (line) drawing tool
 * Click and drag to create a line segment.
 * When drawing with Alt key, endpoints snap to vertices/midpoints and create attachments.
 * Automatically snaps to perpendicular feet (垂足) on nearby edges.
 */
export class SegmentDrawing implements DrawingTool {
    readonly name = 'segment';
    
    protected startX: number = 0;
    protected startY: number = 0;
    protected currentShapeId: string | null = null;
    isDrawing: boolean = false;
    
    // Track snap points for creating attachments
    private startSnapInfo: SnapPointInfo | null = null;
    private endSnapInfo: SnapPointInfo | null = null;
    
    // Track perpendicular foot info for creating perpendicular attachments
    private endPerpFootInfo: PerpendicularFootInfo | null = null;
    
    // Track perpendicular feet (垂足) for display - closest points on nearby edges
    private perpendicularFeet: Point[] = [];
    
    handleMouseDown(e: DrawingMouseEvent, ctx: DrawingContext): DrawingResult {
        if (e.button !== 0) return { handled: false };
        
        let x = e.x;
        let y = e.y;
        this.startSnapInfo = null;
        this.endSnapInfo = null;
        
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
        
        this.startX = x;
        this.startY = y;
        
        // Create initial shape
        const shape: Omit<Shape, 'id'> = {
            type: 'segment',
            x,
            y,
            points: [0, 0, 0, 0],
            stroke: 'black',
            rotation: 0,
        };
        ctx.addShape(shape);
        
        // Get the ID of newly added shape
        const shapes = ctx.getShapes();
        const newShape = shapes[shapes.length - 1];
        if (newShape) {
            this.currentShapeId = newShape.id;
            this.isDrawing = true;
        }
        
        return { handled: true };
    }
    
    handleMouseMove(e: DrawingMouseEvent, ctx: DrawingContext): DrawingResult {
        if (!this.isDrawing || !this.currentShapeId) {
            return { handled: false };
        }
        
        let x = e.x;
        let y = e.y;
        
        // Always find perpendicular feet (垂足) from current position to nearby edges
        const currentPos: Point = { x, y };
        this.perpendicularFeet = ctx.findPerpendicularFeet(currentPos, this.currentShapeId);
        
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
                // Only clear endSnapInfo if we're in snap mode but didn't find a snap point
                this.endSnapInfo = null;
            }
        }
        // Note: Don't clear endSnapInfo when Alt is not pressed - keep the last snapped position
        
        // Calculate shape update
        const updates = this.calculateShapeUpdate(x, y, e.shiftKey);
        ctx.updateShape(this.currentShapeId, updates);
        
        return { handled: true };
    }
    
    handleMouseUp(e: DrawingMouseEvent, ctx: DrawingContext): DrawingResult {
        if (!this.isDrawing || !this.currentShapeId) {
            return { handled: false };
        }
        
        let finalX = e.x;
        let finalY = e.y;
        this.endPerpFootInfo = null;
        
        // Try to snap to perpendicular foot first (closest perpendicular point on any edge)
        const perpFootInfo = ctx.findClosestPerpendicularFootInfo({ x: e.x, y: e.y }, this.currentShapeId);
        if (perpFootInfo) {
            finalX = perpFootInfo.point.x;
            finalY = perpFootInfo.point.y;
            this.endPerpFootInfo = perpFootInfo;
            // Apply final position snapped to perpendicular foot
            const updates = this.calculateShapeUpdate(finalX, finalY, e.shiftKey);
            ctx.updateShape(this.currentShapeId, updates);
        } else if (e.altKey) {
            // If no perpendicular foot, try vertex/midpoint snap with Alt key
            const snapInfo = ctx.findSnapPointInfo(e.x, e.y, this.currentShapeId);
            if (snapInfo) {
                this.endSnapInfo = snapInfo;
                finalX = snapInfo.x;
                finalY = snapInfo.y;
                // Apply final position
                const updates = this.calculateShapeUpdate(finalX, finalY, e.shiftKey);
                ctx.updateShape(this.currentShapeId, updates);
            }
        }
        
        // Check if shape is too small and should be deleted
        const shapes = ctx.getShapes();
        const shape = shapes.find(s => s.id === this.currentShapeId);
        
        if (shape && this.isShapeTooSmall(shape)) {
            ctx.deleteShape(shape.id);
        } else if (shape) {
            // Create attachments for snapped endpoints
            if (this.startSnapInfo && this.isValidAttachmentTarget(this.startSnapInfo, shapes)) {
                ctx.addSegmentAttachment({
                    segmentId: shape.id,
                    endpoint: 0,
                    targetShapeId: this.startSnapInfo.shapeId,
                    attachType: this.startSnapInfo.type,
                    targetIndex: this.startSnapInfo.index,
                });
            }
            
            // Create perpendicular attachment if snapped to perpendicular foot
            if (this.endPerpFootInfo && this.isValidPerpAttachmentTarget(this.endPerpFootInfo.shapeId, shapes)) {
                ctx.addSegmentAttachment({
                    segmentId: shape.id,
                    endpoint: 1,
                    targetShapeId: this.endPerpFootInfo.shapeId,
                    attachType: 'perpendicular',
                    targetIndex: this.endPerpFootInfo.edgeIndex,
                });
            } else if (this.endSnapInfo && this.isValidAttachmentTarget(this.endSnapInfo, shapes)) {
                ctx.addSegmentAttachment({
                    segmentId: shape.id,
                    endpoint: 1,
                    targetShapeId: this.endSnapInfo.shapeId,
                    attachType: this.endSnapInfo.type,
                    targetIndex: this.endSnapInfo.index,
                });
            }
        }
        
        this.finish();
        return { handled: true, finished: true };
    }
    
    cancel(): void {
        this.currentShapeId = null;
        this.startSnapInfo = null;
        this.endSnapInfo = null;
        this.endPerpFootInfo = null;
        this.perpendicularFeet = [];
        this.finish();
    }
    
    protected finish(): void {
        this.isDrawing = false;
        this.currentShapeId = null;
        this.startSnapInfo = null;
        this.endSnapInfo = null;
        this.endPerpFootInfo = null;
        this.perpendicularFeet = [];
    }
    
    getPreviewData(): { shapeId: string | null; perpendicularFeet: Point[] } {
        return { 
            shapeId: this.currentShapeId,
            perpendicularFeet: this.perpendicularFeet,
        };
    }
    
    protected calculateShapeUpdate(x: number, y: number, isShiftPressed: boolean): Partial<Shape> {
        let endX = x - this.startX;
        let endY = y - this.startY;
        
        if (isShiftPressed) {
            // Shift key forces H/V constraint
            const constrained = constrainLineToOrtho(0, 0, endX, endY);
            endX = constrained.endX;
            endY = constrained.endY;
        } else {
            // Auto-snap to vertical/horizontal if close
            const angle = Math.atan2(endY, endX) * 180 / Math.PI;
            const absAngle = Math.abs(angle);
            const threshold = 5; // degrees
            
            // Horizontal: 0 or 180 (which is +/- 180)
            if (absAngle < threshold || Math.abs(absAngle - 180) < threshold) {
                endY = 0;
            }
            // Vertical: 90 or -90
            else if (Math.abs(absAngle - 90) < threshold) {
                endX = 0;
            }
        }
        
        return { points: [0, 0, endX, endY] };
    }
    
    protected isShapeTooSmall(shape: Shape): boolean {
        const points = shape.points || [0, 0, 0, 0];
        return Math.abs(points[2] - points[0]) < 1 && Math.abs(points[3] - points[1]) < 1;
    }
    
    /** Check if the snap target is a valid attachment target (triangle or polygon) */
    private isValidAttachmentTarget(snapInfo: SnapPointInfo, shapes: Shape[]): boolean {
        const targetShape = shapes.find(s => s.id === snapInfo.shapeId);
        return targetShape !== undefined && 
               (targetShape.type === 'triangle' || targetShape.type === 'polygon');
    }
    
    /** Check if the shape is a valid perpendicular attachment target (triangle or polygon) */
    private isValidPerpAttachmentTarget(shapeId: string, shapes: Shape[]): boolean {
        const targetShape = shapes.find(s => s.id === shapeId);
        return targetShape !== undefined && 
               (targetShape.type === 'triangle' || targetShape.type === 'polygon');
    }
}

