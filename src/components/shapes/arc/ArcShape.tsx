import React from 'react';
import { Arc, Circle } from 'react-konva';
import { useStore } from '../../../store/useStore';
import { BaseShape, getBindProps } from '../BaseShape';
import type { BaseShapeProps } from '../BaseShapeProps';

export const ArcShape: React.FC<BaseShapeProps> = (props) => {
  const { shape } = props;
  const viewportScale = useStore((state) => state.viewport.scale);

  if (shape.radius === undefined || shape.startAngle === undefined || shape.sweepAngle === undefined) {
    return null;
  }

  const { radius, startAngle, sweepAngle } = shape;

  return (
    <BaseShape {...props}>
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

