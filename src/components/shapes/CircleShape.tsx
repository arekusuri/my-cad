import React, { useRef, useEffect } from 'react';
import { Circle, Transformer } from 'react-konva';
import type { Shape } from '../../store/useStore';
import { useStore } from '../../store/useStore';
import Konva from 'konva';
import { commonDragBoundFunc, limitResizeBoundBoxFunc } from './CommonShape_ops';
import { getCircleTransformAttrs } from './CircleShape_ops';

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
  const tool = useStore((state) => state.tool);
  const deleteShape = useStore((state) => state.deleteShape);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

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
        draggable={isSelected && tool === 'select'}
        onClick={handleClick}
        onTap={handleClick}
        onDragStart={(e) => {
          dragStartPos.current = { x: e.target.x(), y: e.target.y() };
        }}
        dragBoundFunc={(pos) => commonDragBoundFunc(pos, dragStartPos.current, isShiftPressed)}
        onDragEnd={(e) => {
          dragStartPos.current = null;
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
      {isSelected && tool === 'select' && (
        <Transformer
          ref={trRef}
          rotationSnaps={isShiftPressed ? [0, 90, 180, 270] : []}
          rotationSnapTolerance={20}
          boundBoxFunc={limitResizeBoundBoxFunc}
        />
      )}
    </>
  );
};

