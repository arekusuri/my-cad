import type { Tool, ToolEvent, ToolContext, ToolResult } from './ToolInterface';
import { NOT_HANDLED } from './ToolInterface';

/**
 * Trim tool - trims segments at intersection points
 * Note: The actual trim logic is triggered from ShapeObj.onTrim when clicking on shapes
 */
export class TrimTool implements Tool {
  readonly toolTypes = ['trim', 'eraser'] as const;
  readonly cursorClass = 'cursor-cell';

  handleMouseDown(_event: ToolEvent, context: ToolContext): ToolResult {
    if (context.tool !== 'trim' && context.tool !== 'eraser') return NOT_HANDLED;
    // Trim is handled at shape level via ShapeObj.onTrim
    return NOT_HANDLED;
  }

  handleMouseMove(_event: ToolEvent, context: ToolContext): ToolResult {
    if (context.tool !== 'trim' && context.tool !== 'eraser') return NOT_HANDLED;
    return NOT_HANDLED;
  }

  handleMouseUp(_event: ToolEvent, context: ToolContext): ToolResult {
    if (context.tool !== 'trim' && context.tool !== 'eraser') return NOT_HANDLED;
    return NOT_HANDLED;
  }
}

// Singleton instance
export const trimTool = new TrimTool();

