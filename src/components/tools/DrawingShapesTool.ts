import type { Tool, ToolEvent, ToolContext, ToolResult } from './ToolInterface';
import { NOT_HANDLED } from './ToolInterface';
import { findClosestSnapPoint } from '../modes/AutoSnappingMode';

/**
 * Drawing shapes tool - delegates to drawingTools for rect, circle, segment, triangle, polygon
 */
export class DrawingShapesTool implements Tool {
  readonly toolTypes = ['rect', 'circle', 'segment', 'triangle', 'polygon'] as const;
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
      const closest = findClosestSnapPoint(event.pos, context.shapes);
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

