import type { DrawingTool, DrawingContext, DrawingMouseEvent, DrawingResult } from '../../tools/DrawingTool';
import type { Shape } from '../../../store/useStore';

export interface AngleDrawState {
    /** The vertex point (shared point of both edges) */
    vertex: { x: number; y: number };
    /** First edge endpoint (horizontal by default) */
    edge1End?: { x: number; y: number };
}

const DEFAULT_EDGE_LENGTH = 100;

/**
 * Angle drawing tool using 2-click interaction.
 * - Click 1: Set vertex point, creates a default horizontal first edge
 * - Click 2: Set the angle (second edge direction) and confirm both edge lengths
 */
export class AngleDrawing implements DrawingTool {
    readonly name = 'angle';
    
    private drawState: AngleDrawState | null = null;
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
            // First click: set vertex point and create default horizontal edge
            const vertex = { x, y };
            const edge1End = { x: x + DEFAULT_EDGE_LENGTH, y: y }; // Horizontal to the right
            
            this.drawState = { vertex, edge1End };
            this.previewPoint = { x: x + DEFAULT_EDGE_LENGTH, y: y - DEFAULT_EDGE_LENGTH }; // Default 45° up
            
            return { handled: true };
        } else {
            // Second click: finalize angle with second edge
            const { vertex } = this.drawState;
            
            // The x-distance from vertex to click determines both edges' x-extent
            const dx = x - vertex.x;
            const dy = y - vertex.y;
            
            // Use the x-distance as the common x-extent for both edges
            // First edge is horizontal, second edge goes to the click point
            // Both endpoints share the same x-coordinate
            const xExtent = Math.abs(dx) > 10 ? dx : DEFAULT_EDGE_LENGTH;
            
            // First edge: horizontal to the right (or left if click is on left)
            const edge1End = { x: vertex.x + xExtent, y: vertex.y };
            
            // Second edge: same x-extent, y from click (endpoints are vertically aligned)
            const edge2End = { x: vertex.x + xExtent, y: vertex.y + dy };
            
            // Create angle shape with points relative to vertex (origin)
            // points: [vertex(0,0), edge1End, edge2End]
            ctx.addShape({
                type: 'angle',
                x: vertex.x,
                y: vertex.y,
                stroke: 'black',
                rotation: 0,
                points: [
                    0, 0,                                   // vertex at origin
                    edge1End.x - vertex.x, edge1End.y - vertex.y,  // edge1 endpoint relative
                    edge2End.x - vertex.x, edge2End.y - vertex.y   // edge2 endpoint relative
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
        
        // Shift key snaps to common angles (15° increments)
        if (e.shiftKey && this.drawState.vertex) {
            const { vertex } = this.drawState;
            const dx = x - vertex.x;
            const dy = y - vertex.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (length > 0) {
                let angle = Math.atan2(dy, dx);
                // Snap to 15° increments
                const snapAngle = Math.PI / 12; // 15 degrees
                angle = Math.round(angle / snapAngle) * snapAngle;
                
                x = vertex.x + length * Math.cos(angle);
                y = vertex.y + length * Math.sin(angle);
            }
        }
        
        this.previewPoint = { x, y };
        
        return { handled: true };
    }
    
    handleMouseUp(_e: DrawingMouseEvent, _ctx: DrawingContext): DrawingResult {
        // Angle uses clicks, not drag - nothing to do on mouse up
        return { handled: false };
    }
    
    cancel(): void {
        this.drawState = null;
        this.previewPoint = null;
    }
    
    getPreviewData(): { drawState: AngleDrawState | null; previewPoint: { x: number; y: number } | null } {
        return {
            drawState: this.drawState,
            previewPoint: this.previewPoint,
        };
    }
}

