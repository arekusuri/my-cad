import React, { useRef, useEffect } from 'react';
import { Rect, Circle, Line, Transformer } from 'react-konva';
import type { Shape } from '../store/useStore';
import { useStore } from '../store/useStore';
import Konva from 'konva';

interface ShapeObjProps {
  shape: Shape;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<Shape>) => void;
  onTrim: (e: Konva.KonvaEventObject<MouseEvent> | Konva.KonvaEventObject<TouchEvent>) => void;
}

export const ShapeObj: React.FC<ShapeObjProps> = ({
  shape,
  isSelected,
  onSelect,
  onChange,
  onTrim,
}) => {
  const shapeRef = useRef<Konva.Shape>(null);
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

  const commonProps = {
    x: shape.x,
    y: shape.y,
    rotation: shape.rotation,
    stroke: shape.stroke,
    fill: shape.fill,
    id: shape.id,
    draggable: isSelected && tool === 'select', // Only draggable when selected and in select tool
    onClick: handleClick,
    onTap: handleClick,
    onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => {
        dragStartPos.current = { x: e.target.x(), y: e.target.y() };
    },
    dragBoundFunc: (pos: { x: number; y: number }) => {
        // Orthogonal move constraint
        if (isShiftPressed && dragStartPos.current) {
            const dx = Math.abs(pos.x - dragStartPos.current.x);
            const dy = Math.abs(pos.y - dragStartPos.current.y);
            if (dx > dy) {
                return { x: pos.x, y: dragStartPos.current.y };
            } else {
                return { x: dragStartPos.current.x, y: pos.y };
            }
        }
        return pos;
    },
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
      dragStartPos.current = null;
      onChange({
        x: e.target.x(),
        y: e.target.y(),
      });
    },
    onTransformEnd: () => {
      const node = shapeRef.current;
      if (!node) return;

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // Reset scale to 1 and adjust dimensions instead
      node.scaleX(1);
      node.scaleY(1);

      const newAttrs: Partial<Shape> = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
      };

      if (shape.type === 'rect') {
        newAttrs.width = Math.max(5, (shape.width || 0) * scaleX);
        newAttrs.height = Math.max(5, (shape.height || 0) * scaleY);
      } else if (shape.type === 'circle') {
        newAttrs.radius = Math.max(5, (shape.radius || 0) * scaleX);
      } else if (shape.type === 'line') {
        // Apply scale to points to maintain visual size but reset scale
        const points = shape.points || [0, 0, 0, 0];
        const newPoints = points.map((p, i) => {
            return i % 2 === 0 ? p * scaleX : p * scaleY;
        });
        newAttrs.points = newPoints;
      }

      onChange(newAttrs);
    },
  };

  return (
    <>
      {shape.type === 'rect' && (
        <Rect
          {...commonProps}
          ref={shapeRef as React.RefObject<Konva.Rect>}
          width={shape.width}
          height={shape.height}
        />
      )}
      {shape.type === 'circle' && (
        <Circle
          {...commonProps}
          ref={shapeRef as React.RefObject<Konva.Circle>}
          radius={shape.radius}
        />
      )}
      {shape.type === 'line' && (
        <Line
          {...commonProps}
          ref={shapeRef as React.RefObject<Konva.Line>}
          points={shape.points}
          hitStrokeWidth={20}
        />
      )}
      {isSelected && tool === 'select' && (
        <Transformer
          ref={trRef}
          rotationSnaps={isShiftPressed ? [0, 90, 180, 270] : []}
          rotationSnapTolerance={20}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};
