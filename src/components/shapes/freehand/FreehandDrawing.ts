import type { DrawingTool, DrawingContext, DrawingMouseEvent, DrawingResult } from '../../tools/DrawingTool';

/**
 * Freehand drawing tool - drag to draw, release to complete.
 * Records mouse positions during drag to create a path.
 */
export class FreehandDrawing implements DrawingTool {
    readonly name = 'freehand';
    
    private currentShapeId: string | null = null;
    private points: number[] = [];
    isDrawing: boolean = false;
    
    handleMouseDown(e: DrawingMouseEvent, ctx: DrawingContext): DrawingResult {
        if (e.button !== 0) return { handled: false };
        
        // Start new freehand stroke
        this.points = [e.x, e.y];
        this.isDrawing = true;
        
        // Create initial shape with single point
        ctx.addShape({
            type: 'freehand',
            x: 0,
            y: 0,
            points: [...this.points],
            stroke: 'black',
            rotation: 0,
        });
        
        // Get the ID of newly added shape
        const shapes = ctx.getShapes();
        const newShape = shapes[shapes.length - 1];
        if (newShape) {
            this.currentShapeId = newShape.id;
        }
        
        return { handled: true };
    }
    
    handleMouseMove(e: DrawingMouseEvent, ctx: DrawingContext): DrawingResult {
        if (!this.isDrawing || !this.currentShapeId) {
            return { handled: false };
        }
        
        // Add point to path
        this.points.push(e.x, e.y);
        
        // Update shape with new points
        ctx.updateShape(this.currentShapeId, { points: [...this.points] });
        
        return { handled: true };
    }
    
    handleMouseUp(_e: DrawingMouseEvent, ctx: DrawingContext): DrawingResult {
        if (!this.isDrawing || !this.currentShapeId) {
            return { handled: false };
        }
        
        // Check if stroke is too short (less than 2 points)
        if (this.points.length < 4) {
            ctx.deleteShape(this.currentShapeId);
        }
        
        this.finish();
        return { handled: true, finished: true };
    }
    
    cancel(): void {
        this.finish();
    }
    
    private finish(): void {
        this.isDrawing = false;
        this.currentShapeId = null;
        this.points = [];
    }
    
    getPreviewData(): { shapeId: string | null } {
        return { shapeId: this.currentShapeId };
    }
}

