import type { Tool, ToolEvent, ToolContext, ToolResult } from './ToolInterface';
import { NOT_HANDLED, HANDLED } from './ToolInterface';
import { handleVertexDrag } from '../modes/AutoSnappingMode';
import { constrainLineToOrtho, constrainToAxis } from '../modes/OrthoMode';
import { findClosestSnapPoint } from '../modes/AutoSnappingMode';

/**
 * Select tool - handles selection, vertex dragging, and selection box
 */
export class SelectToolClass implements Tool {
  readonly toolTypes = ['select'] as const;
  readonly cursorClass = 'cursor-pointer';

  handleMouseDown(event: ToolEvent, context: ToolContext): ToolResult {
    if (context.tool !== 'select') return NOT_HANDLED;

    const { pos, altKey } = event;
    const { hoveredSnapPoint, shapes, startDrag, selectShape, startSelectionBox } = context;

    // Check if we are clicking a highlighted vertex to drag (but not in Alt mode - Alt is for snapping only)
    if (hoveredSnapPoint && hoveredSnapPoint.type === 'vertex' && !altKey) {
      startDrag(hoveredSnapPoint, shapes);
      return HANDLED;
    }

    // If clicking on stage (empty area), start selection box
    const clickedOnEmpty = event.target === event.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
      startSelectionBox(pos.x, pos.y);
      return HANDLED;
    }

    return NOT_HANDLED;
  }

  handleMouseMove(event: ToolEvent, context: ToolContext): ToolResult {
    if (context.tool !== 'select') return NOT_HANDLED;

    const { pos } = event;
    const { 
      draggingVertex, 
      shapes,
      setHoveredSnapPoint,
      updateSelectionBox 
    } = context;

    // 1. Vertex Dragging
    if (draggingVertex) {
      this.handleVertexDragging(event, context);
      return HANDLED;
    }

    // 2. Selection box update
    if (updateSelectionBox(pos.x, pos.y)) {
      return HANDLED;
    }

    // 3. Snap point highlighting (only with Alt key in select mode)
    if (event.altKey) {
      const closest = findClosestSnapPoint(pos, shapes);
      setHoveredSnapPoint(closest);
    } else {
      setHoveredSnapPoint(null);
    }

    return NOT_HANDLED;
  }

  handleMouseUp(_event: ToolEvent, context: ToolContext): ToolResult {
    if (context.tool !== 'select') return NOT_HANDLED;

    const { endDrag, completeSelectionBox } = context;
    
    endDrag();
    completeSelectionBox();
    
    return NOT_HANDLED; // Let other handlers also run
  }

  private handleVertexDragging(event: ToolEvent, context: ToolContext): void {
    const { pos, shiftKey, altKey } = event;
    const { draggingVertex, shapes, updateShape, snapToGrid, setHoveredSnapPoint } = context;
    
    if (!draggingVertex) return;

    const mouseX = pos.x;
    const mouseY = pos.y;

    const isSnappingEnabled = altKey;
    const isOrthoEnabled = shiftKey;

    let newX = mouseX;
    let newY = mouseY;

    // Check if we're dragging a segment vertex
    const draggedShape = shapes.find((s) => s.id === draggingVertex.shapeId);
    const isSegmentVertex = draggedShape?.type === 'segment';

    // For segments with ortho: make segment H/V (handled in handleVertexDrag)
    // For other shapes: constrain movement to axis
    if (isOrthoEnabled && !isSegmentVertex) {
      const constrained = constrainToAxis(
        { x: draggingVertex.startX, y: draggingVertex.startY },
        { x: mouseX, y: mouseY }
      );
      newX = constrained.x;
      newY = constrained.y;
    }

    // Then apply grid snapping if enabled
    if (isSnappingEnabled) {
      newX = snapToGrid(newX);
      newY = snapToGrid(newY);
    }

    // Pass isOrthoEnabled for line H/V constraint
    handleVertexDrag(draggingVertex, newX, newY, shapes, updateShape, isOrthoEnabled);

    // Calculate actual highlight position (for segments with ortho, compute constrained position)
    let highlightX = newX;
    let highlightY = newY;
    if (isOrthoEnabled && isSegmentVertex && draggedShape?.points && draggedShape.points.length === 4) {
      const idx = draggingVertex.index;
      const otherIndex = idx === 0 ? 1 : 0;
      const otherAbsX = draggedShape.x + draggedShape.points[otherIndex * 2];
      const otherAbsY = draggedShape.y + draggedShape.points[otherIndex * 2 + 1];
      const constrained = constrainLineToOrtho(otherAbsX, otherAbsY, newX, newY);
      highlightX = constrained.endX;
      highlightY = constrained.endY;
    }

    // Update the visual highlight position to follow the mouse
    setHoveredSnapPoint({
      shapeId: draggingVertex.shapeId,
      index: draggingVertex.index,
      x: highlightX,
      y: highlightY,
      type: 'vertex',
    });
  }
}

// Singleton instance
export const selectTool = new SelectToolClass();
