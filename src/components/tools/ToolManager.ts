import type { ToolType } from '../../store/useStore';
import type { Tool, ToolEvent, ToolContext, ToolResult } from './ToolInterface';
import { NOT_HANDLED } from './ToolInterface';
import { pointTool } from './PointTool';
import { selectTool } from './SelectTool';
import { zoomTool } from './ZoomTool';
import { drawingShapesTool } from './DrawingShapesTool';
import { trimTool } from './TrimTool';

/**
 * Manages all tools and dispatches events to the appropriate tool.
 */
class ToolManagerClass {
  private tools: Tool[] = [];
  private cursorMap: Map<ToolType, string> = new Map();

  constructor() {
    // Register all tools
    this.register(zoomTool);
    this.register(pointTool);
    this.register(selectTool);
    this.register(trimTool);
    this.register(drawingShapesTool);
  }

  /**
   * Register a tool handler
   */
  register(tool: Tool): void {
    this.tools.push(tool);
    // Map each tool type to its cursor
    for (const toolType of tool.toolTypes) {
      this.cursorMap.set(toolType as ToolType, tool.cursorClass);
    }
  }

  /**
   * Get cursor class for a tool type
   */
  getCursor(toolType: ToolType): string {
    return this.cursorMap.get(toolType) || 'cursor-default';
  }

  /**
   * Handle mouse down - dispatches to all tools until one handles it
   */
  handleMouseDown(event: ToolEvent, context: ToolContext): ToolResult {
    for (const tool of this.tools) {
      const result = tool.handleMouseDown(event, context);
      if (result.handled) {
        return result;
      }
    }
    return NOT_HANDLED;
  }

  /**
   * Handle mouse move - dispatches to all tools until one handles it
   */
  handleMouseMove(event: ToolEvent, context: ToolContext): ToolResult {
    for (const tool of this.tools) {
      const result = tool.handleMouseMove(event, context);
      if (result.handled) {
        return result;
      }
    }
    return NOT_HANDLED;
  }

  /**
   * Handle mouse up - dispatches to all tools until one handles it
   */
  handleMouseUp(event: ToolEvent, context: ToolContext): ToolResult {
    for (const tool of this.tools) {
      const result = tool.handleMouseUp(event, context);
      if (result.handled) {
        return result;
      }
    }
    return NOT_HANDLED;
  }
}

// Singleton instance
export const toolManager = new ToolManagerClass();
