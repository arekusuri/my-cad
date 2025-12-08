import React, { useRef, useEffect } from 'react';
import { RegularPolygon, Transformer, Line, Circle } from 'react-konva';
import type { Shape } from '../../store/useStore';
import { useStore } from '../../store/useStore';
import Konva from 'konva';
import { commonDragBoundFunc, limitResizeBoundBoxFunc } from './CommonShape_ops';
import { getTriangleTransformAttrs } from './TriangleShape_ops';
import { calculateVertexDrag, calculateVertexPos, getPolyTransformAttrs } from './PolygonShape_ops';

interface TriangleShapeProps {
  shape: Shape;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<Shape>) => void;
  onTrim: (e: Konva.KonvaEventObject<MouseEvent> | Konva.KonvaEventObject<TouchEvent>) => void;
}

export const TriangleShape: React.FC<TriangleShapeProps> = ({
  shape,
  isSelected,
  onSelect,
  onChange,
  onTrim,
}) => {
  const shapeRef = useRef<Konva.RegularPolygon | Konva.Line>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const isShiftPressed = useStore((state) => state.isShiftPressed);
  const tool = useStore((state) => state.tool);
  const vertexEditMode = useStore((state) => state.vertexEditMode);
  const selectedVertexIndices = useStore((state) => state.selectedVertexIndices);
  const deleteShape = useStore((state) => state.deleteShape);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const [isDraggingShape, setIsDraggingShape] = React.useState(false);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // Initialize points for vertex editing if missing
  useEffect(() => {
      if (isSelected && vertexEditMode && !shape.points && shape.type === 'triangle') {
           const r = shape.radius || 0;
           const points = [];
           for (let i = 0; i < 3; i++) {
               const angle = (i * 2 * Math.PI / 3) - Math.PI / 2;
               points.push(r * Math.cos(angle), r * Math.sin(angle));
           }
           onChange({ points });
      }
  }, [isSelected, vertexEditMode, shape.points, shape.radius, shape.type, onChange]);

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

  if (shape.points) {
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
              const node = shapeRef.current as Konva.Line;
              if (!node) return;
              const newAttrs = getPolyTransformAttrs(node, shape);
              onChange(newAttrs);
            }}
            ref={shapeRef as React.RefObject<Konva.Line>}
          />
          {isSelected && tool === 'select' && vertexEditMode && !isDraggingShape && (
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
  }

  return (
    <>
      <RegularPolygon
        sides={3}
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
          const node = shapeRef.current as Konva.RegularPolygon;
          if (!node) return;
          const newAttrs = getTriangleTransformAttrs(node, shape);
          onChange(newAttrs);
        }}
        ref={shapeRef as React.RefObject<Konva.RegularPolygon>}
      />
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

