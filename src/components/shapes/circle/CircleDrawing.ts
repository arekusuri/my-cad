import { DragDrawingTool } from '../../tools/DrawingTool';
import type { Shape } from '../../../store/useStore';
import { constrainToAxis } from '../../modes/OrthoMode';

/**
 * Circle drawing tool
 * Click and drag to create a circle - center at click point, radius by drag distance
 */
export class CircleDrawing extends DragDrawingTool {
    readonly name = 'circle';
    
    protected createInitialShape(x: number, y: number): Omit<Shape, 'id'> {
        return {
            type: 'circle',
            x,
            y,
            radius: 0,
            stroke: 'black',
            rotation: 0,
        };
    }
    
    protected calculateShapeUpdate(x: number, y: number, isShiftPressed: boolean): Partial<Shape> {
        let targetX = x;
        let targetY = y;
        
        // Shift key constrains to axis (H or V only)
        if (isShiftPressed) {
            const constrained = constrainToAxis(
                { x: this.startX, y: this.startY },
                { x: targetX, y: targetY }
            );
            targetX = constrained.x;
            targetY = constrained.y;
        }
        
        const dx = targetX - this.startX;
        const dy = targetY - this.startY;
        const radius = Math.sqrt(dx * dx + dy * dy);
        
        return { radius };
    }
    
    protected isShapeTooSmall(shape: Shape): boolean {
        return (shape.radius || 0) < 1;
    }
}

