import React, { useCallback } from 'react';
import { Rect, Circle } from 'react-konva';
import { useStore, type Shape } from '../../../store/useStore';
import { getRectangleCornerPositions, calculateRectangleFromDrag } from './RectangleShape_ops';
import { BaseShape, getBindProps } from '../BaseShape';
import type { BaseShapeProps } from '../BaseShapeProps';
import { updateAttachedArcs } from '../arc/ArcAttachment';

export const RectangleShape: React.FC<BaseShapeProps> = (props) => {
  const { shape, onChange } = props;
  const isAltPressed = useStore((state) => state.isAltPressed);
  const tool = useStore((state) => state.tool);
  const vertexEditMode = useStore((state) => state.vertexEditMode);
  const viewportScale = useStore((state) => state.viewport.scale);
  const shapes = useStore((state) => state.shapes);
  const updateShapeStore = useStore((state) => state.updateShape);

  const corners = vertexEditMode ? getRectangleCornerPositions(shape) : [];

  // Update arcs attached to intersections involving this rectangle
  const handleDragMove = useCallback((x: number, y: number) => {
    const tempShape: Shape = { ...shape, x, y };
    const arcUpdates = updateAttachedArcs(tempShape, shapes);
    Object.entries(arcUpdates).forEach(([id, attrs]) => updateShapeStore(id, attrs));
  }, [shape, shapes, updateShapeStore]);

  return (
    <BaseShape {...props} onDragMove={handleDragMove}>
      {(base) => (
        <>
          <Rect
            {...getBindProps(base)}
            rotation={shape.rotation}
            fill={shape.fill}
            id={shape.id}
            width={shape.width}
            height={shape.height}
            fillHitEnabled={false}
          />
          {base.isSelected && tool === 'select' && vertexEditMode && !base.isDragging && !isAltPressed && (
            corners.map((pos, i) => (
              <Circle
                key={i}
                x={pos.x}
                y={pos.y}
                radius={6 / viewportScale}
                fill="white"
                stroke="#3b82f6"
                strokeWidth={base.strokeWidth}
                draggable
                onDragMove={(e) => {
                  onChange(calculateRectangleFromDrag(shape, i, { x: e.target.x(), y: e.target.y() }));
                }}
              />
            ))
          )}
        </>
      )}
    </BaseShape>
  );
};

