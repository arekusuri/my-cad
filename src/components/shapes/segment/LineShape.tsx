import React, { useCallback } from 'react';
import { Line } from 'react-konva';
import { useStore, type Shape } from '../../../store/useStore';
import { VertexHandles } from '../../lib/VertexHandles';
import { calculateVertexDrag, calculateVertexPos } from './SegmentShape_ops';
import { BaseShape, getBindProps } from '../BaseShape';
import type { BaseShapeProps } from '../BaseShapeProps';
import { updateAttachedArcs } from '../arc/ArcAttachment';

function getExtendedLinePoints(x: number, y: number, points: number[]): number[] {
  if (!points || points.length < 4) return [0, 0, 0, 0];
  const dx = (x + points[2]) - (x + points[0]);
  const dy = (y + points[3]) - (y + points[1]);
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return points;
  const len = Math.sqrt(dx * dx + dy * dy);
  const extent = 50000;
  const ndx = (dx / len) * extent, ndy = (dy / len) * extent;
  return [points[0] - ndx, points[1] - ndy, points[2] + ndx, points[3] + ndy];
}

export const LineShape: React.FC<BaseShapeProps> = (props) => {
  const { shape, onChange } = props;
  const shapes = useStore((state) => state.shapes);
  const updateShapeStore = useStore((state) => state.updateShape);

  // Update arcs attached to intersections involving this line
  const handleDragMove = useCallback((x: number, y: number) => {
    const tempShape: Shape = { ...shape, x, y };
    const arcUpdates = updateAttachedArcs(tempShape, shapes);
    Object.entries(arcUpdates).forEach(([id, attrs]) => updateShapeStore(id, attrs));
  }, [shape, shapes, updateShapeStore]);

  return (
    <BaseShape {...props} onDragMove={handleDragMove}>
      {(base) => {
        const extendedPoints = getExtendedLinePoints(base.x, base.y, shape.points || [0, 0, 0, 0]);
        return (
          <>
            <Line
              {...getBindProps(base)}
              rotation={shape.rotation}
              fill={shape.fill}
              id={shape.id}
              points={extendedPoints}
              closed={false}
            />
            <VertexHandles
              shape={shape}
              isDragging={base.isDragging}
              onChange={onChange}
              getVertexPos={calculateVertexPos}
              onVertexDrag={calculateVertexDrag}
            />
          </>
        );
      }}
    </BaseShape>
  );
};

