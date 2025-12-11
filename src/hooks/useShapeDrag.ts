import { useRef, useEffect, useCallback, useState } from 'react';
import { useStore } from '../store/useStore';
import type Konva from 'konva';
import { setCursor } from '../components/lib/cursor';
import { commonDragBoundFunc } from '../components/lib/CommonShape_ops';

interface UseShapeDragOptions {
  shapeId: string;
  shapeX: number;
  shapeY: number;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: { x: number; y: number }) => void;
}

interface UseShapeDragResult {
  /** Display position (accounts for multi-drag offset) */
  displayX: number;
  displayY: number;
  /** Whether this shape is being dragged by another shape in multi-selection */
  isBeingDraggedByOther: boolean;
  /** Whether this shape should be draggable (false when being dragged by other) */
  isDraggable: boolean;
  /** Whether this shape is currently being dragged (for cursor, vertex hide, etc.) */
  isDraggingShape: boolean;
  /** Ready-to-use Konva onDragStart handler */
  onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => void;
  /** Ready-to-use Konva onDragMove handler */
  onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => void;
  /** Ready-to-use Konva onDragEnd handler */
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  /** Ready-to-use Konva onMouseLeave handler */
  onMouseLeave: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  /** Ready-to-use Konva dragBoundFunc for shift-constrained dragging */
  dragBoundFunc: (pos: { x: number; y: number }) => { x: number; y: number };
}

/**
 * Hook for handling multi-selection drag.
 * Each shape uses this to:
 * 1. Calculate its display position during multi-drag
 * 2. Report drag events to the global state
 * 3. Commit its position when drag ends
 * 
 * Returns ready-to-use Konva event handlers that can be spread onto shape components.
 */
export function useShapeDrag({
  shapeId,
  shapeX,
  shapeY,
  isSelected,
  onSelect,
  onChange,
}: UseShapeDragOptions): UseShapeDragResult {
  const dragState = useStore((state) => state.dragState);
  const startDrag = useStore((state) => state.startDrag);
  const updateDrag = useStore((state) => state.updateDrag);
  const endDrag = useStore((state) => state.endDrag);
  const isShiftPressed = useStore((state) => state.isShiftPressed);
  
  // Track the final position to commit (saved while still dragging)
  const finalPosRef = useRef<{ x: number; y: number } | null>(null);
  const wasBeingDraggedRef = useRef(false);
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  
  // Local dragging state
  const [isDraggingShape, setIsDraggingShape] = useState(false);
  
  // Check if this shape is being dragged as part of multi-selection (but not the initiator)
  const isBeingDraggedByOther = dragState.isDragging && 
    isSelected && 
    dragState.initiatorId !== shapeId &&
    dragState.startPositions.has(shapeId);
  
  // Calculate display position
  let displayX = shapeX;
  let displayY = shapeY;
  
  if (isBeingDraggedByOther && dragState.startPoint && dragState.currentPoint) {
    const startPos = dragState.startPositions.get(shapeId);
    if (startPos) {
      const deltaX = dragState.currentPoint.x - dragState.startPoint.x;
      const deltaY = dragState.currentPoint.y - dragState.startPoint.y;
      displayX = startPos.x + deltaX;
      displayY = startPos.y + deltaY;
    }
  }
  
  // Save the position while we're still dragging (in effect, not during render)
  useEffect(() => {
    if (isBeingDraggedByOther) {
      finalPosRef.current = { x: displayX, y: displayY };
    }
  }, [isBeingDraggedByOther, displayX, displayY]);
  
  // Commit position when multi-drag ends (for non-initiator shapes)
  useEffect(() => {
    // If we were being dragged and now we're not
    if (wasBeingDraggedRef.current && !isBeingDraggedByOther && !dragState.isDragging) {
      const finalPos = finalPosRef.current;
      if (finalPos && (finalPos.x !== shapeX || finalPos.y !== shapeY)) {
        onChange(finalPos);
      }
      finalPosRef.current = null;
    }
    wasBeingDraggedRef.current = isBeingDraggedByOther;
  }, [dragState.isDragging, isBeingDraggedByOther, shapeX, shapeY, onChange]);
  
  // Ready-to-use Konva event handlers
  const onDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    if (!isSelected) onSelect();
    dragStartPosRef.current = { x: e.target.x(), y: e.target.y() };
    startDrag(shapeId, { x: e.target.x(), y: e.target.y() });
    setIsDraggingShape(true);
    setCursor('move', e);
  }, [isSelected, onSelect, shapeId, startDrag]);
  
  const onDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    updateDrag({ x: e.target.x(), y: e.target.y() });
  }, [updateDrag]);
  
  const onDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    dragStartPosRef.current = null;
    endDrag();
    setIsDraggingShape(false);
    setCursor('', e);
    onChange({ x: e.target.x(), y: e.target.y() });
  }, [endDrag, onChange]);
  
  const onMouseLeave = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDraggingShape) setCursor('', e);
  }, [isDraggingShape]);
  
  // Drag bound function for shift-constrained movement
  const dragBoundFunc = useCallback((pos: { x: number; y: number }) => {
    return commonDragBoundFunc(pos, dragStartPosRef.current, isShiftPressed);
  }, [isShiftPressed]);
  
  return {
    displayX,
    displayY,
    isBeingDraggedByOther,
    isDraggable: !isBeingDraggedByOther,
    isDraggingShape,
    onDragStart,
    onDragMove,
    onDragEnd,
    onMouseLeave,
    dragBoundFunc,
  };
}

