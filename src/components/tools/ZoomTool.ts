import type { Tool, ToolEvent, ToolContext, ToolResult } from './ToolInterface';
import { NOT_HANDLED, HANDLED } from './ToolInterface';

/**
 * Zoom tool - handles zoom box selection
 */
export class ZoomTool implements Tool {
  readonly toolTypes = ['zoom'] as const;
  readonly cursorClass = 'cursor-zoom-in';

  handleMouseDown(event: ToolEvent, context: ToolContext): ToolResult {
    if (context.tool !== 'zoom') return NOT_HANDLED;

    const { screenPos } = event;
    context.startZoomBox(screenPos.x, screenPos.y);
    return HANDLED;
  }

  handleMouseMove(event: ToolEvent, context: ToolContext): ToolResult {
    if (context.tool !== 'zoom') return NOT_HANDLED;

    const { screenPos } = event;
    if (context.updateZoomBox(screenPos.x, screenPos.y)) {
      return HANDLED;
    }
    return NOT_HANDLED;
  }

  handleMouseUp(_event: ToolEvent, context: ToolContext): ToolResult {
    if (context.tool !== 'zoom') return NOT_HANDLED;

    if (context.completeZoomBox()) {
      return HANDLED;
    }
    return NOT_HANDLED;
  }
}

// Singleton instance
export const zoomTool = new ZoomTool();

