import { DragDrawingTool } from '../../tools/DrawingTool';
import type { Shape } from '../../../store/useStore';
import { constrainLineToOrtho } from '../../modes/OrthoMode';

/**
 * Segment (line) drawing tool
 * Click and drag to create a line segment
 */
export class SegmentDrawing extends DragDrawingTool {
    readonly name = 'segment';
    
    protected createInitialShape(x: number, y: number): Omit<Shape, 'id'> {
        return {
            type: 'segment',
            x,
            y,
            points: [0, 0, 0, 0], // Points relative to origin
            stroke: 'black',
            rotation: 0,
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
}

