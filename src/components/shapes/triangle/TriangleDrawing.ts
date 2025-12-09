import type { DrawingTool, DrawingContext, DrawingMouseEvent, DrawingResult } from '../../tools/DrawingTool';
import { constrainToAxis } from '../../modes/OrthoMode';

export interface TriangleDrawState {
    p1: { x: number; y: number };
    p2?: { x: number; y: number };
}

/**
 * Triangle drawing tool using 3-click interaction.
 * - Click 1: Set first point
 * - Click 2: Set second point (with Shift for ortho constraint)
 * - Click 3: Complete triangle (with Shift for ortho constraint)
 */
export class TriangleDrawing implements DrawingTool {
    readonly name = 'triangle';
    
    private drawState: TriangleDrawState | null = null;
    private previewPoint: { x: number; y: number } | null = null;
    
    get isDrawing(): boolean {
        return this.drawState !== null;
    }
    
    handleMouseDown(e: DrawingMouseEvent, ctx: DrawingContext): DrawingResult {
        if (e.button !== 0) return { handled: false };
        
        let x = e.x;
        let y = e.y;
        
        // Apply snapping if Alt is pressed
        if (e.altKey) {
            const vertexSnap = ctx.findSnapPoint(x, y);
            if (vertexSnap) {
                x = vertexSnap.x;
                y = vertexSnap.y;
            } else {
                x = ctx.snapToGrid(x);
                y = ctx.snapToGrid(y);
            }
        }
        
        if (!this.drawState) {
            // First click: set point 1
            this.drawState = { p1: { x, y } };
            this.previewPoint = { x, y };
            return { handled: true };
        } else if (!this.drawState.p2) {
            // Second click: set point 2
            if (e.shiftKey) {
                const constrained = constrainToAxis(this.drawState.p1, { x, y });
                x = constrained.x;
                y = constrained.y;
            }
            this.drawState = { ...this.drawState, p2: { x, y } };
            this.previewPoint = { x, y };
            return { handled: true };
        } else {
            // Third click: finalize triangle
            const { p1, p2 } = this.drawState;
            
            if (e.shiftKey) {
                const constrained = constrainToAxis(p2, { x, y });
                x = constrained.x;
                y = constrained.y;
            }
            
            const p3 = { x, y };
            
            // Create triangle with points relative to p1 (origin)
            ctx.addShape({
                type: 'triangle',
                x: p1.x,
                y: p1.y,
                stroke: 'black',
                rotation: 0,
                points: [
                    0, 0,                           // p1 relative to origin
                    p2.x - p1.x, p2.y - p1.y,       // p2 relative to origin
                    p3.x - p1.x, p3.y - p1.y        // p3 relative to origin
                ],
            });
            
            // Reset state
            this.drawState = null;
            this.previewPoint = null;
            
            return { handled: true, finished: true };
        }
    }
    
    handleMouseMove(e: DrawingMouseEvent, ctx: DrawingContext): DrawingResult {
        if (!this.drawState) {
            return { handled: false };
        }
        
        let x = e.x;
        let y = e.y;
        
        // Apply snapping if Alt is pressed
        if (e.altKey) {
            const vertexSnap = ctx.findSnapPoint(x, y);
            if (vertexSnap) {
                x = vertexSnap.x;
                y = vertexSnap.y;
            } else {
                x = ctx.snapToGrid(x);
                y = ctx.snapToGrid(y);
            }
        }
        
        // Apply ortho constraint if Shift is pressed
        if (e.shiftKey) {
            const referencePoint = this.drawState.p2 ?? this.drawState.p1;
            const constrained = constrainToAxis(referencePoint, { x, y });
            x = constrained.x;
            y = constrained.y;
        }
        
        this.previewPoint = { x, y };
        
        return { handled: true };
    }
    
    handleMouseUp(_e: DrawingMouseEvent, _ctx: DrawingContext): DrawingResult {
        // Triangle uses clicks, not drag - nothing to do on mouse up
        return { handled: false };
    }
    
    cancel(): void {
        this.drawState = null;
        this.previewPoint = null;
    }
    
    getPreviewData(): { drawState: TriangleDrawState | null; previewPoint: { x: number; y: number } | null } {
        return {
            drawState: this.drawState,
            previewPoint: this.previewPoint,
        };
    }
}

