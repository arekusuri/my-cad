import type { DrawingTool, DrawingContext, DrawingMouseEvent, DrawingResult } from '../../tools/DrawingTool';

export interface CompassDrawState {
    /** Step 1: Center point */
    center: { x: number; y: number };
    /** Step 2: Radius (distance from center to this point) */
    radiusPoint?: { x: number; y: number };
    /** Calculated radius value */
    radius?: number;
    /** Current arc's start point (resets after each arc is drawn) */
    startPoint?: { x: number; y: number };
}

/**
 * Compass tool for drawing arcs using continuous click interaction.
 * - Click 1: Set center point
 * - Click 2: Set radius (by clicking a point at desired distance)
 * - Click 3: Set arc start point
 * - Click 4: Set arc end point and draw arc (keeps center/radius)
 * - Click 5+: Continue drawing more arcs (every 2 clicks = 1 arc)
 * - Escape or Right-click: Stop drawing
 */
export class CompassDrawing implements DrawingTool {
    readonly name = 'compass';
    
    private drawState: CompassDrawState | null = null;
    private previewPoint: { x: number; y: number } | null = null;
    
    get isDrawing(): boolean {
        return this.drawState !== null;
    }
    
    handleMouseDown(e: DrawingMouseEvent, ctx: DrawingContext): DrawingResult {
        // Right click cancels the operation
        if (e.button === 2) {
            this.cancel();
            return { handled: true, finished: true };
        }
        
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
            // First click: set center point
            this.drawState = { center: { x, y } };
            this.previewPoint = { x, y };
            return { handled: true };
        } else if (!this.drawState.radiusPoint) {
            // Second click: set radius
            const { center } = this.drawState;
            const radius = Math.sqrt(
                Math.pow(x - center.x, 2) + 
                Math.pow(y - center.y, 2)
            );
            this.drawState = { ...this.drawState, radiusPoint: { x, y }, radius };
            this.previewPoint = { x, y };
            return { handled: true };
        } else if (!this.drawState.startPoint) {
            // Odd click (3, 5, 7...): set arc start point
            // Snap to the circle at the current angle
            const { center, radius } = this.drawState;
            if (!radius) return { handled: false };
            
            const angle = Math.atan2(y - center.y, x - center.x);
            const startPoint = {
                x: center.x + radius * Math.cos(angle),
                y: center.y + radius * Math.sin(angle)
            };
            
            this.drawState = { ...this.drawState, startPoint };
            this.previewPoint = startPoint;
            return { handled: true };
        } else {
            // Even click (4, 6, 8...): complete the arc and continue
            const { center, radius, startPoint } = this.drawState;
            if (!radius) return { handled: false };
            
            // Calculate angles
            const startAngle = Math.atan2(startPoint.y - center.y, startPoint.x - center.x);
            const endAngle = Math.atan2(y - center.y, x - center.x);
            
            // Calculate sweep angle (counter-clockwise positive)
            let sweepAngle = endAngle - startAngle;
            
            // Normalize sweep angle to get the shorter arc by default
            // But if shift is pressed, take the longer arc
            if (!e.shiftKey) {
                // Shorter arc
                if (sweepAngle > Math.PI) sweepAngle -= 2 * Math.PI;
                if (sweepAngle < -Math.PI) sweepAngle += 2 * Math.PI;
            } else {
                // Longer arc
                if (sweepAngle > 0 && sweepAngle < Math.PI) sweepAngle -= 2 * Math.PI;
                if (sweepAngle < 0 && sweepAngle > -Math.PI) sweepAngle += 2 * Math.PI;
            }
            
            // Convert to degrees
            const startAngleDeg = startAngle * (180 / Math.PI);
            const sweepAngleDeg = sweepAngle * (180 / Math.PI);
            
            // Create arc shape
            ctx.addShape({
                type: 'arc',
                x: center.x,
                y: center.y,
                radius,
                startAngle: startAngleDeg,
                sweepAngle: sweepAngleDeg,
                stroke: 'black',
                rotation: 0,
            });
            
            // Reset startPoint but keep center and radius for more arcs
            this.drawState = { 
                center: this.drawState.center, 
                radiusPoint: this.drawState.radiusPoint,
                radius: this.drawState.radius 
            };
            this.previewPoint = { x, y };
            
            // Don't finish - allow more arcs
            return { handled: true };
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
        
        // If we have radius set, snap preview to the circle
        if (this.drawState.radiusPoint) {
            const { center, radiusPoint } = this.drawState;
            const radius = Math.sqrt(
                Math.pow(radiusPoint.x - center.x, 2) + 
                Math.pow(radiusPoint.y - center.y, 2)
            );
            const angle = Math.atan2(y - center.y, x - center.x);
            
            // Shift key snaps to 15° increments
            let snappedAngle = angle;
            if (e.shiftKey && !this.drawState.startPoint) {
                const snapAngle = Math.PI / 12; // 15 degrees
                snappedAngle = Math.round(angle / snapAngle) * snapAngle;
            }
            
            this.previewPoint = {
                x: center.x + radius * Math.cos(snappedAngle),
                y: center.y + radius * Math.sin(snappedAngle)
            };
        } else {
            this.previewPoint = { x, y };
        }
        
        return { handled: true };
    }
    
    handleMouseUp(_e: DrawingMouseEvent, _ctx: DrawingContext): DrawingResult {
        // Compass uses clicks, not drag
        return { handled: false };
    }
    
    cancel(): void {
        this.drawState = null;
        this.previewPoint = null;
    }
    
    getPreviewData(): { drawState: CompassDrawState | null; previewPoint: { x: number; y: number } | null } {
        return {
            drawState: this.drawState,
            previewPoint: this.previewPoint,
        };
    }
}

