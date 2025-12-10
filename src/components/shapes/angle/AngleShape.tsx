import React, { useRef } from 'react';
import { Line, Circle, Arc } from 'react-konva';
import type { Shape } from '../../../store/useStore';
import { useStore } from '../../../store/useStore';
import Konva from 'konva';
import { setCursor } from '../../lib/cursor';

interface AngleShapeProps {
  shape: Shape;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<Shape>) => void;
  onTrim: (e: Konva.KonvaEventObject<MouseEvent> | Konva.KonvaEventObject<TouchEvent>) => void;
}

/**
 * Calculate the angle sweep from edge1 to edge2 (counter-clockwise positive).
 * Returns the start angle and sweep angle for drawing the arc on the correct side.
 */
function calculateArcParams(
  edge1End: { x: number; y: number },
  edge2End: { x: number; y: number }
): { startAngle: number; sweepAngle: number } {
  const angle1 = Math.atan2(edge1End.y, edge1End.x);
  const angle2 = Math.atan2(edge2End.y, edge2End.x);
  
  // Calculate the signed angle difference (counter-clockwise from edge1 to edge2)
  let sweepAngle = angle2 - angle1;
  
  // Normalize to (-π, π] to get the shorter arc
  while (sweepAngle > Math.PI) sweepAngle -= 2 * Math.PI;
  while (sweepAngle <= -Math.PI) sweepAngle += 2 * Math.PI;
  
  // Convert to degrees
  const startAngleDeg = angle1 * (180 / Math.PI);
  const sweepAngleDeg = sweepAngle * (180 / Math.PI);
  
  return { startAngle: startAngleDeg, sweepAngle: sweepAngleDeg };
}

export const AngleShape: React.FC<AngleShapeProps> = ({
  shape,
  isSelected,
  onSelect,
  onChange,
  onTrim,
}) => {
  const shapeRef = useRef<Konva.Line>(null);
  const tool = useStore((state) => state.tool);
  const deleteShape = useStore((state) => state.deleteShape);
  const viewportScale = useStore((state) => state.viewport.scale);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const [isDraggingShape, setIsDraggingShape] = React.useState(false);
  
  // Stroke width that maintains consistent visual appearance regardless of zoom
  const strokeWidth = 1 / viewportScale;

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent> | Konva.KonvaEventObject<TouchEvent>) => {
    if (tool === 'eraser') {
      deleteShape(shape.id);
      e.cancelBubble = true;
    } else if (tool === 'trim') {
      onTrim(e);
      e.cancelBubble = true;
    } else {
      onSelect();
    }
  };

  // Angle requires points array with 6 values [vx,vy, e1x,e1y, e2x,e2y]
  // where vertex is at (vx,vy)=>(0,0), edge1 ends at (e1x,e1y), edge2 ends at (e2x,e2y)
  if (!shape.points || shape.points.length < 6) {
    return null;
  }

  const points = shape.points;
  // Vertex is at origin (0,0) in local space
  const edge1End = { x: points[2], y: points[3] };
  const edge2End = { x: points[4], y: points[5] };
  
  // Calculate arc parameters for the angle display
  const { startAngle, sweepAngle } = calculateArcParams(edge1End, edge2End);
  
  // Arc radius is a fraction of the shorter edge length
  const arcRadius = Math.min(
    Math.sqrt(edge1End.x * edge1End.x + edge1End.y * edge1End.y),
    Math.sqrt(edge2End.x * edge2End.x + edge2End.y * edge2End.y),
    30 / viewportScale
  ) * 0.3;

  return (
    <>
      {/* First edge: vertex to edge1End */}
      <Line
        x={shape.x}
        y={shape.y}
        rotation={shape.rotation}
        stroke={shape.stroke}
        strokeWidth={strokeWidth}
        points={[0, 0, edge1End.x, edge1End.y]}
        draggable={tool === 'select'}
        onClick={handleClick}
        onTap={handleClick}
        hitStrokeWidth={20 / viewportScale}
        onMouseLeave={(e) => {
          if (!isDraggingShape) setCursor('', e);
        }}
        onDragStart={(e) => {
          if (!isSelected) onSelect();
          dragStartPos.current = { x: e.target.x(), y: e.target.y() };
          setIsDraggingShape(true);
          setCursor('move', e);
        }}
        onDragEnd={(e) => {
          dragStartPos.current = null;
          setIsDraggingShape(false);
          setCursor('', e);
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        ref={shapeRef}
      />
      {/* Second edge: vertex to edge2End */}
      <Line
        x={shape.x}
        y={shape.y}
        rotation={shape.rotation}
        stroke={shape.stroke}
        strokeWidth={strokeWidth}
        points={[0, 0, edge2End.x, edge2End.y]}
        listening={false}
      />
      {/* Arc showing the angle - positioned on the interior side */}
      <Arc
        x={shape.x}
        y={shape.y}
        innerRadius={arcRadius}
        outerRadius={arcRadius}
        angle={Math.abs(sweepAngle)}
        rotation={shape.rotation + (sweepAngle >= 0 ? startAngle : startAngle + sweepAngle)}
        stroke={isSelected ? '#3b82f6' : '#666'}
        strokeWidth={strokeWidth}
        listening={false}
      />
      {/* Vertex point indicator when selected */}
      {isSelected && (
        <Circle
          x={shape.x}
          y={shape.y}
          radius={4 / viewportScale}
          fill="white"
          stroke="#3b82f6"
          strokeWidth={strokeWidth}
          listening={false}
        />
      )}
    </>
  );
};

