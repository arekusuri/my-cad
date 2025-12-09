import React, { useRef, useEffect, useState } from 'react';
import { Circle, Transformer } from 'react-konva';
import type { Shape } from '../../store/useStore';
import { useStore } from '../../store/useStore';
import Konva from 'konva';
import { commonDragBoundFunc, limitResizeBoundBoxFunc } from './CommonShape_ops';
import { getCircleTransformAttrs } from './CircleShape_ops';
import { setCursor } from './cursor';

interface CircleShapeProps {
  shape: Shape;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<Shape>) => void;
  onTrim: (e: Konva.KonvaEventObject<MouseEvent> | Konva.KonvaEventObject<TouchEvent>) => void;
}

export const CircleShape: React.FC<CircleShapeProps> = ({
  shape,
  isSelected,
  onSelect,
  onChange,
  onTrim,
}) => {
  const shapeRef = useRef<Konva.Circle>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const isShiftPressed = useStore((state) => state.isShiftPressed);
  const isAltPressed = useStore((state) => state.isAltPressed);
  const tool = useStore((state) => state.tool);
  const vertexEditMode = useStore((state) => state.vertexEditMode);
  const deleteShape = useStore((state) => state.deleteShape);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const [isDraggingRadius, setIsDraggingRadius] = useState(false);
  const [isDraggingShape, setIsDraggingShape] = useState(false);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

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

  return (
    <>
      <Circle
        x={shape.x}
        y={shape.y}
        rotation={shape.rotation}
        stroke={shape.stroke}
        fill={shape.fill}
        id={shape.id}
        radius={shape.radius}
        draggable={tool === 'select'}
        onClick={handleClick}
        onTap={handleClick}
        onMouseEnter={(e) => {
          if (tool === 'select') setCursor('grab', e);
        }}
        onMouseLeave={(e) => {
          if (!isDraggingShape) setCursor('', e);
        }}
        onDragStart={(e) => {
          // Select shape when starting to drag (allows click-and-drag in one motion)
          if (!isSelected) onSelect();
          dragStartPos.current = { x: e.target.x(), y: e.target.y() };
          setIsDraggingShape(true);
          setCursor('grabbing', e);
        }}
        dragBoundFunc={(pos) => commonDragBoundFunc(pos, dragStartPos.current, isShiftPressed)}
        onDragEnd={(e) => {
          dragStartPos.current = null;
          setIsDraggingShape(false);
          setCursor('grab', e);
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (!node) return;
          const newAttrs = getCircleTransformAttrs(node, shape);
          onChange(newAttrs);
        }}
        ref={shapeRef}
      />
      {isSelected && tool === 'select' && !vertexEditMode && (
        <Transformer
          ref={trRef}
          rotationSnaps={isShiftPressed ? [0, 90, 180, 270] : []}
          rotationSnapTolerance={20}
          boundBoxFunc={limitResizeBoundBoxFunc}
        />
      )}
      {isSelected && tool === 'select' && vertexEditMode && !isDraggingShape && !isAltPressed && (
        <>
           {/* Center Point */}
           <Circle
              x={shape.x}
              y={shape.y}
              radius={6}
              fill="white"
              stroke="#3b82f6"
              strokeWidth={1}
              draggable
              onDragMove={(e) => {
                  onChange({ x: e.target.x(), y: e.target.y() });
              }}
           />
           {/* Radius Point */}
           <Circle
              // Only control position when not dragging to prevent snap-back during drag
              x={!isDraggingRadius ? shape.x + (shape.radius || 0) * Math.cos((shape.rotation || 0) * Math.PI / 180) : undefined}
              y={!isDraggingRadius ? shape.y + (shape.radius || 0) * Math.sin((shape.rotation || 0) * Math.PI / 180) : undefined}
              radius={6}
              fill="white"
              stroke="#3b82f6"
              strokeWidth={1}
              draggable
              dragBoundFunc={(pos) => {
                  const rotationRad = (shape.rotation || 0) * Math.PI / 180;
                  // Vector from center
                  const dx = pos.x - shape.x;
                  const dy = pos.y - shape.y;
                  
                  // Project onto rotation vector
                  const uX = Math.cos(rotationRad);
                  const uY = Math.sin(rotationRad);
                  const dist = dx * uX + dy * uY;
                  
                  return {
                      x: shape.x + dist * uX,
                      y: shape.y + dist * uY
                  };
              }}
              onDragStart={() => setIsDraggingRadius(true)}
              onDragMove={(e) => {
                  const dx = e.target.x() - shape.x;
                  const dy = e.target.y() - shape.y;
                  const newRadius = Math.sqrt(dx * dx + dy * dy);
                  // Only update radius, keep original rotation
                  onChange({ radius: newRadius });
              }}
              onDragEnd={() => setIsDraggingRadius(false)}
           />
        </>
      )}
    </>
  );
};

