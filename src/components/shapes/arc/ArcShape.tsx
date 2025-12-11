import React, { useCallback } from 'react';
import { Arc, Circle } from 'react-konva';
import { useStore, type Shape } from '../../../store/useStore';
import { BaseShape, getBindProps } from '../BaseShape';
import type { BaseShapeProps } from '../BaseShapeProps';
import { updateAttachedArcs } from './ArcAttachment';

export const ArcShape: React.FC<BaseShapeProps> = (props) => {
  const { shape } = props;
  const viewportScale = useStore((state) => state.viewport.scale);
  const shapes = useStore((state) => state.shapes);
  const updateShapeStore = useStore((state) => state.updateShape);

  // Update arcs attached to intersections involving this arc
  const handleDragMove = useCallback((x: number, y: number) => {
    const tempShape: Shape = { ...shape, x, y };
    const arcUpdates = updateAttachedArcs(tempShape, shapes);
    Object.entries(arcUpdates).forEach(([id, attrs]) => updateShapeStore(id, attrs));
  }, [shape, shapes, updateShapeStore]);

  if (shape.radius === undefined || shape.startAngle === undefined || shape.sweepAngle === undefined) {
    return null;
  }

  const { radius, startAngle, sweepAngle } = shape;

  return (
    <BaseShape {...props} onDragMove={handleDragMove}>
      {(base) => (
        <>
          <Arc
            {...getBindProps(base)}
            innerRadius={radius}
            outerRadius={radius}
            angle={Math.abs(sweepAngle)}
            rotation={sweepAngle >= 0 ? startAngle : startAngle + sweepAngle}
          />
          {base.isSelected && (
            <Circle
              x={base.x}
              y={base.y}
              radius={4 / viewportScale}
              fill="white"
              stroke="#3b82f6"
              strokeWidth={base.strokeWidth}
              listening={false}
            />
          )}
        </>
      )}
    </BaseShape>
  );
};

