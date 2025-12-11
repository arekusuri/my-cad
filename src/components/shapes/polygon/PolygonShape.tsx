import React, { useEffect, useCallback } from 'react';
import { RegularPolygon, Line } from 'react-konva';
import type { Shape } from '../../../store/useStore';
import { useStore } from '../../../store/useStore';
import { VertexHandles } from '../../lib/VertexHandles';
import { calculateVertexDrag, calculateVertexPos } from './PolygonShape_ops';
import { updateAttachedSegments } from './PolygonAttachment';
import { updateAttachedArcs } from '../arc/ArcAttachment';
import { BaseShape, getBindProps } from '../BaseShape';
import type { BaseShapeProps } from '../BaseShapeProps';

const POLYGON_SIDES = 6;

export const PolygonShape: React.FC<BaseShapeProps> = (props) => {
  const { shape, onChange } = props;
  const vertexEditMode = useStore((state) => state.vertexEditMode);
  const shapes = useStore((state) => state.shapes);
  const segmentAttachments = useStore((state) => state.segmentAttachments);
  const updateShapeStore = useStore((state) => state.updateShape);

  const handleDragMove = useCallback((x: number, y: number) => {
    const tempShape: Shape = { ...shape, x, y };
    // Update attached segments
    const segmentUpdates = updateAttachedSegments(tempShape, shapes, segmentAttachments);
    Object.entries(segmentUpdates).forEach(([id, attrs]) => updateShapeStore(id, attrs));
    // Update attached arcs
    const arcUpdates = updateAttachedArcs(tempShape, shapes);
    Object.entries(arcUpdates).forEach(([id, attrs]) => updateShapeStore(id, attrs));
  }, [shape, shapes, segmentAttachments, updateShapeStore]);

  useEffect(() => {
    if (props.isSelected && vertexEditMode && !shape.points && shape.type === 'polygon') {
      const r = shape.radius || 0;
      const points = [];
      for (let i = 0; i < POLYGON_SIDES; i++) {
        const angle = (i * 2 * Math.PI / POLYGON_SIDES) - Math.PI / 2;
        points.push(r * Math.cos(angle), r * Math.sin(angle));
      }
      onChange({ points });
    }
  }, [props.isSelected, vertexEditMode, shape.points, shape.radius, shape.type, onChange]);

  return (
    <BaseShape {...props} onDragMove={handleDragMove}>
      {(base) => {
        if (shape.points) {
          return (
            <>
              <Line
                {...getBindProps(base)}
                rotation={shape.rotation}
                fill={shape.fill}
                id={shape.id}
                points={shape.points}
                closed={true}
                fillHitEnabled={false}
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
        }

        return (
          <RegularPolygon
            sides={POLYGON_SIDES}
            {...getBindProps(base)}
            rotation={shape.rotation}
            fill={shape.fill}
            id={shape.id}
            radius={shape.radius}
            fillHitEnabled={false}
          />
        );
      }}
    </BaseShape>
  );
};

