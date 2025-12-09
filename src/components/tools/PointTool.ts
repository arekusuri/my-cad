import type { Tool, ToolEvent, ToolContext, ToolResult } from './ToolInterface';
import { NOT_HANDLED, HANDLED } from './ToolInterface';
import { findClosestSnapPoint } from '../modes/AutoSnappingMode';
import { hasAttachedPointAt as hasTriangleAttachedPointAt } from '../shapes/triangle/TriangleAttachment';
import { hasAttachedPointAt as hasPolygonAttachedPointAt } from '../shapes/polygon/PolygonAttachment';

/**
 * Point tool - adds attached points on snap points of shapes
 */
export class PointTool implements Tool {
  readonly toolTypes = ['point'] as const;
  readonly cursorClass = 'cursor-pointer';

  handleMouseDown(event: ToolEvent, context: ToolContext): ToolResult {
    if (context.tool !== 'point') return NOT_HANDLED;

    const { pos } = event;
    const { shapes, attachedPoints, addAttachedPoint } = context;
    const snapPoint = findClosestSnapPoint(pos, shapes);
    
    if (snapPoint) {
      const targetShape = shapes.find(s => s.id === snapPoint.shapeId);
      // Only allow attaching to triangles and polygons
      if (targetShape && (targetShape.type === 'triangle' || targetShape.type === 'polygon')) {
        // Check if point already exists at this location
        const hasExisting = targetShape.type === 'triangle'
          ? hasTriangleAttachedPointAt(snapPoint.shapeId, snapPoint.type, snapPoint.index, attachedPoints)
          : hasPolygonAttachedPointAt(snapPoint.shapeId, snapPoint.type, snapPoint.index, attachedPoints);
        
        if (!hasExisting) {
          addAttachedPoint({
            shapeId: snapPoint.shapeId,
            attachType: snapPoint.type,
            index: snapPoint.index,
          });
        }
      }
    }
    
    return HANDLED;
  }

  handleMouseMove(event: ToolEvent, context: ToolContext): ToolResult {
    if (context.tool !== 'point') return NOT_HANDLED;
    
    // Show snap points while moving
    const { pos } = event;
    const { shapes, setHoveredSnapPoint } = context;
    const closest = findClosestSnapPoint(pos, shapes);
    setHoveredSnapPoint(closest);
    
    return HANDLED;
  }

  handleMouseUp(_event: ToolEvent, _context: ToolContext): ToolResult {
    return NOT_HANDLED;
  }
}

// Singleton instance
export const pointTool = new PointTool();
