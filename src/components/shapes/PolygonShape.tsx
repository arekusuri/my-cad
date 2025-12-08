import React, { useRef, useEffect } from 'react';
import { Line, Transformer, Circle } from 'react-konva';
import type { Shape } from '../../store/useStore';
import { useStore } from '../../store/useStore';
import Konva from 'konva';
import { commonDragBoundFunc, limitResizeBoundBoxFunc } from './CommonShape_ops';
import { getPolyTransformAttrs, calculateVertexDrag, calculateVertexPos } from './PolygonShape_ops';

interface PolygonShapeProps {
  shape: Shape;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<Shape>) => void;
  onTrim: (e: Konva.KonvaEventObject<MouseEvent> | Konva.KonvaEventObject<TouchEvent>) => void;
}

export const PolygonShape: React.FC<PolygonShapeProps> = ({
  shape,
  isSelected,
  onSelect,
  onChange,
  onTrim,
}) => {
  const shapeRef = useRef<Konva.Line>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const isShiftPressed = useStore((state) => state.isShiftPressed);
  const tool = useStore((state) => state.tool);
  const vertexEditMode = useStore((state) => state.vertexEditMode);
  const deleteShape = useStore((state) => state.deleteShape);
  const selectedVertexIndices = useStore((state) => state.selectedVertexIndices);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const [isDraggingShape, setIsDraggingShape] = React.useState(false);

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
      <Line
        x={shape.x}
        y={shape.y}
        rotation={shape.rotation}
        stroke={shape.stroke}
        fill={shape.fill}
        id={shape.id}
        points={shape.points}
        closed={true}
        hitStrokeWidth={20}
        draggable={isSelected && tool === 'select'}
        onClick={handleClick}
        onTap={handleClick}
        onDragStart={(e) => {
          dragStartPos.current = { x: e.target.x(), y: e.target.y() };
          setIsDraggingShape(true);
        }}
        dragBoundFunc={(pos) => commonDragBoundFunc(pos, dragStartPos.current, isShiftPressed)}
        onDragEnd={(e) => {
          dragStartPos.current = null;
          setIsDraggingShape(false);
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (!node) return;
          const newAttrs = getPolyTransformAttrs(node, shape);
          onChange(newAttrs);
        }}
        ref={shapeRef}
      />
      {isSelected && tool === 'select' && vertexEditMode && shape.points && !isDraggingShape && (
         Array.from({ length: shape.points.length / 2 }).map((_, i) => {
             const { x: absX, y: absY } = calculateVertexPos(shape, i);
             const isVertexSelected = selectedVertexIndices[shape.id]?.includes(i);

             return (
                 <Circle
                    key={i}
                    x={absX}
                    y={absY}
                    radius={4}
                    fill={isVertexSelected ? "red" : "white"}
                    stroke="#3b82f6"
                    strokeWidth={1}
                    draggable
                    onDragMove={(e) => {
                        const { newPoints } = calculateVertexDrag(e, shape, i, !!isVertexSelected, selectedVertexIndices[shape.id]);
                        onChange({ points: newPoints });
                    }}
                    onDragEnd={(e) => {
                         e.cancelBubble = true;
                    }}
                    onMouseDown={(e) => {
                         e.cancelBubble = true;
                    }}
                 />
             );
         })
      )}
      {isSelected && tool === 'select' && !vertexEditMode && (
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

