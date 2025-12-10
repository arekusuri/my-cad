import type { Tool, ToolEvent, ToolContext, ToolResult } from './ToolInterface';
import { NOT_HANDLED } from './ToolInterface';
import { findClosestSnapPoint } from '../modes/AutoSnappingMode';

/**
 * Drawing shapes tool - delegates to drawingTools for rect, circle, segment, line, triangle, polygon
 */
export class DrawingShapesTool implements Tool {
  readonly toolTypes = ['rectangle', 'circle', 'segment', 'line', 'triangle', 'polygon', 'angle', 'compass'] as const;
  readonly cursorClass = 'cursor-crosshair';

  handleMouseDown(event: ToolEvent, context: ToolContext): ToolResult {
    if (!this.isDrawingTool(context.tool)) return NOT_HANDLED;

    const drawingEvent = {
      x: event.pos.x,
      y: event.pos.y,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      button: event.button,
    };
    
    return context.drawingTools.handleMouseDown(drawingEvent);
  }

  handleMouseMove(event: ToolEvent, context: ToolContext): ToolResult {
    if (!this.isDrawingTool(context.tool)) return NOT_HANDLED;

    // Show snap points when Alt is pressed
    if (event.altKey) {
      // Enable perpendicular feet only when drawing a segment's second point
      const isDrawingSegment = context.tool === 'segment' && context.drawingTools.isDrawing;
      
      // Get segment start point for perpendicular reference
      const segmentStart = isDrawingSegment && context.drawingTools.getSegmentStartPoint 
        ? context.drawingTools.getSegmentStartPoint() 
        : null;
      
      const closest = findClosestSnapPoint(event.pos, context.shapes, 10, { 
        includePerpendicularFeet: isDrawingSegment,
        perpendicularReferencePoint: segmentStart ?? undefined
      });
      context.setHoveredSnapPoint(closest);
    } else {
      context.setHoveredSnapPoint(null);
    }

    const drawingEvent = {
      x: event.pos.x,
      y: event.pos.y,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      button: event.button,
    };
    
    return context.drawingTools.handleMouseMove(drawingEvent);
  }

  handleMouseUp(event: ToolEvent, context: ToolContext): ToolResult {
    if (!this.isDrawingTool(context.tool)) return NOT_HANDLED;

    const drawingEvent = {
      x: event.pos.x,
      y: event.pos.y,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      button: event.button,
    };
    
    return context.drawingTools.handleMouseUp(drawingEvent);
  }

  private isDrawingTool(tool: string): boolean {
    return (this.toolTypes as readonly string[]).includes(tool);
  }
}

// Singleton instance
export const drawingShapesTool = new DrawingShapesTool();

