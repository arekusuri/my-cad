import React, { useState } from 'react';
import { Circle } from 'react-konva';
import { useStore } from '../../../store/useStore';
import { BaseShape, getBindProps } from '../BaseShape';
import type { BaseShapeProps } from '../BaseShapeProps';

export const CircleShape: React.FC<BaseShapeProps> = (props) => {
  const { shape, onChange } = props;
  const isAltPressed = useStore((state) => state.isAltPressed);
  const tool = useStore((state) => state.tool);
  const vertexEditMode = useStore((state) => state.vertexEditMode);
  const viewportScale = useStore((state) => state.viewport.scale);
  const [isDraggingRadius, setIsDraggingRadius] = useState(false);

  return (
    <BaseShape {...props}>
      {(base) => (
        <>
          <Circle
            {...getBindProps(base)}
            rotation={shape.rotation}
            fill={shape.fill}
            id={shape.id}
            radius={shape.radius}
            fillHitEnabled={false}
          />
          {base.isSelected && tool === 'select' && vertexEditMode && !base.isDragging && !isAltPressed && (
            <>
              <Circle
                x={shape.x}
                y={shape.y}
                radius={6 / viewportScale}
                fill="white"
                stroke="#3b82f6"
                strokeWidth={base.strokeWidth}
                draggable
                onDragMove={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
              />
              <Circle
                x={!isDraggingRadius ? shape.x + (shape.radius || 0) * Math.cos((shape.rotation || 0) * Math.PI / 180) : undefined}
                y={!isDraggingRadius ? shape.y + (shape.radius || 0) * Math.sin((shape.rotation || 0) * Math.PI / 180) : undefined}
                radius={6 / viewportScale}
                fill="white"
                stroke="#3b82f6"
                strokeWidth={base.strokeWidth}
                draggable
                dragBoundFunc={(pos) => {
                  const rotationRad = (shape.rotation || 0) * Math.PI / 180;
                  const dx = pos.x - shape.x, dy = pos.y - shape.y;
                  const uX = Math.cos(rotationRad), uY = Math.sin(rotationRad);
                  const dist = dx * uX + dy * uY;
                  return { x: shape.x + dist * uX, y: shape.y + dist * uY };
                }}
                onDragStart={() => setIsDraggingRadius(true)}
                onDragMove={(e) => {
                  const dx = e.target.x() - shape.x, dy = e.target.y() - shape.y;
                  onChange({ radius: Math.sqrt(dx * dx + dy * dy) });
                }}
                onDragEnd={() => setIsDraggingRadius(false)}
              />
            </>
          )}
        </>
      )}
    </BaseShape>
  );
};

