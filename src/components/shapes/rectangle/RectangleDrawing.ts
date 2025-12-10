import { DragDrawingTool } from '../../tools/DrawingTool';
import type { Shape } from '../../../store/useStore';
import { constrainToSquare } from '../../modes/OrthoMode';

/**
 * Rectangle drawing tool
 * Click and drag to create a rectangle - corner at click point, size by drag
 */
export class RectangleDrawing extends DragDrawingTool {
    readonly name = 'rectangle';
    
    protected createInitialShape(x: number, y: number): Omit<Shape, 'id'> {
        return {
            type: 'rectangle',
            x,
            y,
            width: 0,
            height: 0,
            stroke: 'black',
            rotation: 0,
        };
    }
    
    protected calculateShapeUpdate(x: number, y: number, isShiftPressed: boolean): Partial<Shape> {
        let width = x - this.startX;
        let height = y - this.startY;
        
        // Shift key constrains to square
        if (isShiftPressed) {
            const constrained = constrainToSquare(width, height);
            width = constrained.width;
            height = constrained.height;
        }
        
        return { width, height };
    }
    
    protected isShapeTooSmall(shape: Shape): boolean {
        return Math.abs(shape.width || 0) < 1 || Math.abs(shape.height || 0) < 1;
    }
}

