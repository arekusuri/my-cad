import React from 'react';
import { Line } from 'react-konva';
import { BaseShape, getBindProps } from '../BaseShape';
import type { BaseShapeProps } from '../BaseShapeProps';

export const FreehandShape: React.FC<BaseShapeProps> = (props) => {
  const { shape } = props;

  if (!shape.points || shape.points.length < 4) {
    return null;
  }

  return (
    <BaseShape {...props}>
      {(base) => (
        <Line
          {...getBindProps(base)}
          points={shape.points}
          tension={0.3}
          lineCap="round"
          lineJoin="round"
        />
      )}
    </BaseShape>
  );
};

