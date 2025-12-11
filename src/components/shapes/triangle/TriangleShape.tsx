import React, { useCallback, useState } from 'react';
import { Line } from 'react-konva';
import type { Shape } from '../../../store/useStore';
import { useStore } from '../../../store/useStore';
import { VertexHandles } from '../../lib/VertexHandles';
import { calculateVertexDrag, calculateVertexPos } from '../polygon/PolygonShape_ops';
import { updateAttachedSegments } from './TriangleAttachment';
import { updateAttachedArcs } from '../arc/ArcAttachment';
import { getCircumcenter } from './TriangleCircumcenter';
import { getOrthocenter } from './TriangleOrthoCenter';
import { getCentroid } from './TriangleCentroid';
import { CircumcenterVisual } from './CircumcenterVisual';
import { OrthocenterVisual } from './OrthocenterVisual';
import { CentroidVisual } from './CentroidVisual';
import { BaseShape, getBindProps } from '../BaseShape';
import type { BaseShapeProps } from '../BaseShapeProps';

export const TriangleShape: React.FC<BaseShapeProps> = (props) => {
  const { shape, onChange } = props;
  const shapes = useStore((state) => state.shapes);
  const segmentAttachments = useStore((state) => state.segmentAttachments);
  const updateShapeStore = useStore((state) => state.updateShape);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);

  const handleDragMove = useCallback((x: number, y: number) => {
    setDragPosition({ x, y });
    const tempShape: Shape = { ...shape, x, y };
    // Update attached segments
    const segmentUpdates = updateAttachedSegments(tempShape, shapes, segmentAttachments);
    Object.entries(segmentUpdates).forEach(([id, attrs]) => updateShapeStore(id, attrs));
    // Update attached arcs
    const arcUpdates = updateAttachedArcs(tempShape, shapes);
    Object.entries(arcUpdates).forEach(([id, attrs]) => updateShapeStore(id, attrs));
  }, [shape, shapes, segmentAttachments, updateShapeStore]);

  if (!shape.points || shape.points.length < 6) return null;

  return (
    <BaseShape {...props}
      onDragStart={(x, y) => setDragPosition({ x, y })}
      onDragMove={handleDragMove}
      onDragEnd={() => setDragPosition(null)}
    >
      {(base) => {
        const currentShape = dragPosition 
          ? { ...shape, x: dragPosition.x, y: dragPosition.y }
          : { ...shape, x: base.x, y: base.y };
        const circumcenter = currentShape.showCircumcenter ? getCircumcenter(currentShape) : null;
        const orthocenter = currentShape.showOrthocenter ? getOrthocenter(currentShape) : null;
        const centroid = currentShape.showCentroid ? getCentroid(currentShape) : null;

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
            <CircumcenterVisual data={circumcenter} />
            <OrthocenterVisual data={orthocenter} />
            <CentroidVisual data={centroid} />
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