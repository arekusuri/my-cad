import type { Shape } from '../../store/useStore';
import { handleVertexDrag, type SnapPoint } from '../modes/AutoSnappingMode';
import { constrainLineToOrtho, constrainToAxis } from '../modes/OrthoMode';

interface HandleDraggingVertexParams {
  draggingVertex: { shapeId: string; index: number; startX: number; startY: number };
  tool: string;
  e: { evt: { altKey: boolean; shiftKey: boolean } };
  pos: { x: number; y: number };
  shapes: Shape[];
  updateShape: (id: string, attrs: Partial<Shape>) => void;
  snapToGrid: (val: number) => number;
  setHoveredSnapPoint: (point: SnapPoint | null) => void;
}

export const handleDraggingVertex = ({
  draggingVertex,
  tool,
  e,
  pos,
  shapes,
  updateShape,
  snapToGrid,
  setHoveredSnapPoint,
}: HandleDraggingVertexParams) => {
  if (draggingVertex && tool === 'select') {
    const mouseX = pos.x;
    const mouseY = pos.y;

    const isSnappingEnabled = e.evt.altKey;
    const isOrthoEnabled = e.evt.shiftKey;

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
    return true; // Indicates handled
  }
  return false;
};

