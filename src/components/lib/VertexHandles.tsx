import React from 'react';
import { Circle } from 'react-konva';
import { useStore, type Shape } from '../../store/useStore';
import type Konva from 'konva';

interface VertexHandlesProps {
  shape: Shape;
  isDragging?: boolean;
  onChange: (attrs: Partial<Shape>) => void;
  /** Function to calculate vertex position - shape-specific */
  getVertexPos: (shape: Shape, index: number) => { x: number; y: number };
  /** Function to calculate new points after vertex drag - shape-specific */
  onVertexDrag: (
    e: Konva.KonvaEventObject<DragEvent>,
    shape: Shape,
    index: number,
    isVertexSelected: boolean,
    selectedIndices: number[] | undefined,
    isShiftPressed: boolean
  ) => { newPoints: number[] };
}

/**
 * Renders draggable vertex handles for shapes with points arrays.
 * Automatically handles visibility based on selection, tool, and vertex edit mode.
 */
export const VertexHandles: React.FC<VertexHandlesProps> = ({
  shape,
  isDragging,
  onChange,
  getVertexPos,
  onVertexDrag,
}) => {
  const tool = useStore((state) => state.tool);
  const vertexEditMode = useStore((state) => state.vertexEditMode);
  const isAltPressed = useStore((state) => state.isAltPressed);
  const isShiftPressed = useStore((state) => state.isShiftPressed);
  const selectedIds = useStore((state) => state.selectedIds);
  const selectedVertexIndices = useStore((state) => state.selectedVertexIndices);
  const viewportScale = useStore((state) => state.viewport.scale);

  const isSelected = selectedIds.includes(shape.id);
  const strokeWidth = 1.5 / viewportScale;

  // Visibility conditions
  if (!isSelected || tool !== 'select' || !vertexEditMode || !shape.points || isDragging || isAltPressed) {
    return null;
  }

  const vertexCount = shape.points.length / 2;

  return (
    <>
      {Array.from({ length: vertexCount }).map((_, i) => {
        const { x, y } = getVertexPos(shape, i);
        const isVertexSelected = selectedVertexIndices[shape.id]?.includes(i);

        return (
          <Circle
            key={i}
            x={x}
            y={y}
            radius={4 / viewportScale}
            fill={isVertexSelected ? "red" : "white"}
            stroke="#3b82f6"
            strokeWidth={strokeWidth}
            draggable
            onDragMove={(e) => {
              const { newPoints } = onVertexDrag(
                e, shape, i,
                !!isVertexSelected,
                selectedVertexIndices[shape.id],
                isShiftPressed
              );
              onChange({ points: newPoints });
            }}
            onDragEnd={(e) => { e.cancelBubble = true; }}
            onMouseDown={(e) => { e.cancelBubble = true; }}
          />
        );
      })}
    </>
  );
};

