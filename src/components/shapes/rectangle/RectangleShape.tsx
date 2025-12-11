import React from 'react';
import { Rect, Circle } from 'react-konva';
import { useStore } from '../../../store/useStore';
import { getRectangleCornerPositions, calculateRectangleFromDrag } from './RectangleShape_ops';
import { BaseShape, getBindProps } from '../BaseShape';
import type { BaseShapeProps } from '../BaseShapeProps';

export const RectangleShape: React.FC<BaseShapeProps> = (props) => {
  const { shape, onChange } = props;
  const isAltPressed = useStore((state) => state.isAltPressed);
  const tool = useStore((state) => state.tool);
  const vertexEditMode = useStore((state) => state.vertexEditMode);
  const viewportScale = useStore((state) => state.viewport.scale);

  const corners = vertexEditMode ? getRectangleCornerPositions(shape) : [];

  return (
    <BaseShape {...props}>
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

