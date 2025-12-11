import React from 'react';
import { Line, Circle, Arc } from 'react-konva';
import { useStore } from '../../../store/useStore';
import { BaseShape, getBindProps } from '../BaseShape';
import type { BaseShapeProps } from '../BaseShapeProps';

function calculateArcParams(edge1End: { x: number; y: number }, edge2End: { x: number; y: number }) {
  const angle1 = Math.atan2(edge1End.y, edge1End.x);
  const angle2 = Math.atan2(edge2End.y, edge2End.x);
  let sweepAngle = angle2 - angle1;
  while (sweepAngle > Math.PI) sweepAngle -= 2 * Math.PI;
  while (sweepAngle <= -Math.PI) sweepAngle += 2 * Math.PI;
  return { startAngle: angle1 * (180 / Math.PI), sweepAngle: sweepAngle * (180 / Math.PI) };
}

export const AngleShape: React.FC<BaseShapeProps> = (props) => {
  const { shape } = props;
  const viewportScale = useStore((state) => state.viewport.scale);

  if (!shape.points || shape.points.length < 6) return null;

  // Calculate edge2 length
  const edge2End = { x: shape.points[4], y: shape.points[5] };
  const edge2Length = Math.sqrt(edge2End.x ** 2 + edge2End.y ** 2);
  
  // Scale edge1 to have same length as edge2
  const edge1Raw = { x: shape.points[2], y: shape.points[3] };
  const edge1Length = Math.sqrt(edge1Raw.x ** 2 + edge1Raw.y ** 2);
  const scale = edge1Length > 0.001 ? edge2Length / edge1Length : 1;
  const edge1End = { x: edge1Raw.x * scale, y: edge1Raw.y * scale };
  const { startAngle, sweepAngle } = calculateArcParams(edge1End, edge2End);
  const arcRadius = Math.min(
    Math.sqrt(edge1End.x ** 2 + edge1End.y ** 2),
    Math.sqrt(edge2End.x ** 2 + edge2End.y ** 2),
    30 / viewportScale
  ) * 0.3;

  return (
    <BaseShape {...props}>
      {(base) => (
        <>
          {/* First edge - draggable */}
          <Line
            {...getBindProps(base)}
            rotation={shape.rotation}
            points={[0, 0, edge1End.x, edge1End.y]}
          />
          {/* Second edge - also clickable for selection */}
          <Line
            x={base.x}
            y={base.y}
            rotation={shape.rotation}
            stroke={base.stroke}
            strokeWidth={base.strokeWidth}
            hitStrokeWidth={base.hitStrokeWidth}
            points={[0, 0, edge2End.x, edge2End.y]}
            onClick={base.onClick}
            onTap={base.onTap}
            draggable={base.draggable}
            onDragStart={base.onDragStart}
            onDragMove={base.onDragMove}
            onDragEnd={base.onDragEnd}
            dragBoundFunc={base.dragBoundFunc}
          />
          {/* Arc */}
          <Arc
            x={base.x}
            y={base.y}
            innerRadius={arcRadius}
            outerRadius={arcRadius}
            angle={Math.abs(sweepAngle)}
            rotation={shape.rotation + (sweepAngle >= 0 ? startAngle : startAngle + sweepAngle)}
            stroke={base.isSelected ? '#3b82f6' : '#666'}
            strokeWidth={base.strokeWidth}
            listening={false}
          />
          {/* Vertex indicator */}
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

