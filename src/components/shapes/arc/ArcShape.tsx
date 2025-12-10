import React, { useRef } from 'react';
import { Arc, Circle } from 'react-konva';
import type { Shape } from '../../../store/useStore';
import { useStore } from '../../../store/useStore';
import Konva from 'konva';
import { setCursor } from '../../lib/cursor';

interface ArcShapeProps {
  shape: Shape;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<Shape>) => void;
  onTrim: (e: Konva.KonvaEventObject<MouseEvent> | Konva.KonvaEventObject<TouchEvent>) => void;
}

export const ArcShape: React.FC<ArcShapeProps> = ({
  shape,
  isSelected,
  onSelect,
  onChange,
  onTrim,
}) => {
  const shapeRef = useRef<Konva.Arc>(null);
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

  // Arc requires radius, startAngle, and sweepAngle
  if (shape.radius === undefined || shape.startAngle === undefined || shape.sweepAngle === undefined) {
    return null;
  }

  const radius = shape.radius;
  const startAngle = shape.startAngle;
  const sweepAngle = shape.sweepAngle;

  return (
    <>
      <Arc
        x={shape.x}
        y={shape.y}
        innerRadius={radius}
        outerRadius={radius}
        angle={Math.abs(sweepAngle)}
        rotation={sweepAngle >= 0 ? startAngle : startAngle + sweepAngle}
        stroke={shape.stroke}
        strokeWidth={strokeWidth}
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
      {/* Center point indicator when selected */}
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

