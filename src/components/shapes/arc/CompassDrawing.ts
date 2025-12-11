import type { DrawingTool, DrawingContext, DrawingMouseEvent, DrawingResult, SnapPointInfo } from '../../tools/DrawingTool';
import { v4 as uuidv4 } from 'uuid';
import { getCompassRadius } from '../../lib/CompassRuler';

export interface CompassDrawState {
    /** Center point (set on first click) */
    center: { x: number; y: number };
    /** Pre-set radius from the ruler */
    radius: number;
    /** Current arc's start point */
    startPoint?: { x: number; y: number };
    /** Group ID for all arcs in this compass session */
    groupId: string;
    /** Snap info for center point (for attachment) */
    centerSnapInfo?: SnapPointInfo;
}

/**
 * Compass tool for drawing arcs with pre-set radius from ruler.
 * Workflow:
 * 1. Set radius on the ruler (before clicking)
 * 2. Click to place center point (shows dashed circle)
 * 3. Click to set arc start point
 * 4. Click to set arc end point (draws arc)
 * 5. Repeat 3-4 for more arcs
 * 6. Right-click or Escape to finish
 */
export class CompassDrawing implements DrawingTool {
    readonly name = 'compass';
    
    private drawState: CompassDrawState | null = null;
    private previewPoint: { x: number; y: number } | null = null;
    
    get isDrawing(): boolean {
        return this.drawState !== null;
    }
    
    handleMouseDown(e: DrawingMouseEvent, ctx: DrawingContext): DrawingResult {
        // Right click cancels/finishes the operation
        if (e.button === 2) {
            this.cancel();
            return { handled: true, finished: true };
        }
        
        if (e.button !== 0) return { handled: false };
        
        let x = e.x;
        let y = e.y;
        let centerSnapInfo: SnapPointInfo | undefined;
        
        // Apply snapping if Alt is pressed
        if (e.altKey) {
            const snapInfo = ctx.findSnapPointInfo(x, y);
            if (snapInfo) {
                x = snapInfo.x;
                y = snapInfo.y;
                // Store snap info for center point (first click)
                if (!this.drawState) {
                    centerSnapInfo = snapInfo;
                }
            } else {
                x = ctx.snapToGrid(x);
                y = ctx.snapToGrid(y);
            }
        }
        
        if (!this.drawState) {
            // First click: set center point with pre-set radius from ruler
            const radius = getCompassRadius();
            this.drawState = { 
                center: { x, y }, 
                radius,
                groupId: uuidv4(), 
                centerSnapInfo 
            };
            this.previewPoint = { x, y };
            return { handled: true };
        } else if (!this.drawState.startPoint) {
            // Second click: set arc start point
            // Snap to the circle at the current angle
            const { center, radius } = this.drawState;
            const angle = Math.atan2(y - center.y, x - center.x);
            const startPoint = {
                x: center.x + radius * Math.cos(angle),
                y: center.y + radius * Math.sin(angle)
            };
            
            this.drawState = { ...this.drawState, startPoint };
            this.previewPoint = startPoint;
            return { handled: true };
        } else {
            // Third+ click: complete the arc and prepare for next
            const { center, radius, startPoint } = this.drawState;
            
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
            
            // Create arc shape with groupId so all arcs from this session are linked
            // Include centerAttachment if center was snapped to a point
            const { centerSnapInfo } = this.drawState;
            let centerAttachment: {
                targetShapeId: string;
                attachType: 'vertex' | 'midpoint' | 'circumcenter' | 'incenter' | 'centroid' | 'orthocenter' | 'intersection';
                targetIndex: number;
                secondaryShapeId?: string;
                intersectionIndex?: number;
            } | undefined;
            
            if (centerSnapInfo && centerSnapInfo.type !== 'perpendicular') {
                if (centerSnapInfo.type === 'intersection') {
                    // For intersection attachments, store info about both shapes
                    centerAttachment = {
                        targetShapeId: centerSnapInfo.shapeId,
                        attachType: 'intersection',
                        targetIndex: centerSnapInfo.index,
                        secondaryShapeId: centerSnapInfo.secondaryShapeId,
                        intersectionIndex: centerSnapInfo.intersectionIndex ?? 0,
                    };
                } else {
                    centerAttachment = {
                        targetShapeId: centerSnapInfo.shapeId,
                        attachType: centerSnapInfo.type as 'vertex' | 'midpoint' | 'circumcenter' | 'incenter' | 'centroid' | 'orthocenter',
                        targetIndex: centerSnapInfo.index,
                    };
                }
            }
            
            ctx.addShape({
                type: 'arc',
                x: center.x,
                y: center.y,
                radius,
                startAngle: startAngleDeg,
                sweepAngle: sweepAngleDeg,
                stroke: 'black',
                rotation: 0,
                groupId: this.drawState.groupId,
                centerAttachment,
            });
            
            // Reset startPoint but keep center, radius, groupId, and centerSnapInfo for more arcs
            this.drawState = { 
                center: this.drawState.center, 
                radius: this.drawState.radius,
                groupId: this.drawState.groupId,
                centerSnapInfo: this.drawState.centerSnapInfo,
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
        
        const { center, radius } = this.drawState;
        const angle = Math.atan2(y - center.y, x - center.x);
        
        // Shift key snaps to 15° increments (only when setting start point)
        let snappedAngle = angle;
        if (e.shiftKey && !this.drawState.startPoint) {
            const snapAngle = Math.PI / 12; // 15 degrees
            snappedAngle = Math.round(angle / snapAngle) * snapAngle;
        }
        
        // Always snap preview to circle
        this.previewPoint = {
            x: center.x + radius * Math.cos(snappedAngle),
            y: center.y + radius * Math.sin(snappedAngle)
        };
        
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
