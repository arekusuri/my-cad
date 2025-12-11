import React, { useCallback } from 'react';
import { Line } from 'react-konva';
import type { LineType, Shape } from '../../../store/useStore';
import { useStore } from '../../../store/useStore';
import { VertexHandles } from '../../lib/VertexHandles';
import { calculateVertexDrag, calculateVertexPos } from './SegmentShape_ops';
import { BaseShape, getBindProps } from '../BaseShape';
import type { BaseShapeProps } from '../BaseShapeProps';
import { updateAttachedArcs } from '../arc/ArcAttachment';

function getLineDash(lineType: LineType | undefined, scale: number): number[] | undefined {
  const baseSize = 8, dotSize = 2, gap = 4;
  switch (lineType) {
    case 'dashed': return [baseSize / scale, gap / scale];
    case 'dotted': return [dotSize / scale, gap / scale];
    case 'dashdot': return [baseSize / scale, gap / scale, dotSize / scale, gap / scale];
    default: return undefined;
  }
}

export const SegmentShape: React.FC<BaseShapeProps> = (props) => {
  const { shape, onChange } = props;
  const viewportScale = useStore((state) => state.viewport.scale);
  const shapes = useStore((state) => state.shapes);
  const updateShapeStore = useStore((state) => state.updateShape);
  
  const dashPattern = getLineDash(shape.lineType, viewportScale);

  // Update arcs attached to intersections involving this segment
  const handleDragMove = useCallback((x: number, y: number) => {
    const tempShape: Shape = { ...shape, x, y };
    const arcUpdates = updateAttachedArcs(tempShape, shapes);
    Object.entries(arcUpdates).forEach(([id, attrs]) => updateShapeStore(id, attrs));
  }, [shape, shapes, updateShapeStore]);

  return (
    <BaseShape {...props} onDragMove={handleDragMove}>
      {(base) => (
        <>
          <Line
            {...getBindProps(base)}
            rotation={shape.rotation}
            dash={dashPattern}
            fill={shape.fill}
            id={shape.id}
            points={shape.points}
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
      )}
    </BaseShape>
  );
};

