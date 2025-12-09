import React, { useRef, useEffect } from 'react';
import { Line, Transformer, Circle } from 'react-konva';
import type { Shape } from '../../../store/useStore';
import { useStore } from '../../../store/useStore';
import Konva from 'konva';
import { commonDragBoundFunc, limitResizeBoundBoxFunc } from '../CommonShape_ops';
import { getPolyTransformAttrs, calculateVertexDrag, calculateVertexPos } from './SegmentShape_ops';
import { setCursor } from '../cursor';

interface SegmentShapeProps {
  shape: Shape;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<Shape>) => void;
  onTrim: (e: Konva.KonvaEventObject<MouseEvent> | Konva.KonvaEventObject<TouchEvent>) => void;
}

export const SegmentShape: React.FC<SegmentShapeProps> = ({
  shape,
  isSelected,
  onSelect,
  onChange,
  onTrim,
}) => {
  const shapeRef = useRef<Konva.Line>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const isShiftPressed = useStore((state) => state.isShiftPressed);
  const isAltPressed = useStore((state) => state.isAltPressed);
  const tool = useStore((state) => state.tool);
  const vertexEditMode = useStore((state) => state.vertexEditMode);
  const deleteShape = useStore((state) => state.deleteShape);
  const selectedVertexIndices = useStore((state) => state.selectedVertexIndices);
  const viewportScale = useStore((state) => state.viewport.scale);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const [isDraggingShape, setIsDraggingShape] = React.useState(false);
  
  // Stroke width that maintains consistent visual appearance regardless of zoom
  const strokeWidth = 1 / viewportScale;

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
        strokeWidth={strokeWidth}
        fill={shape.fill}
        id={shape.id}
        points={shape.points}
        closed={false}
        hitStrokeWidth={20 / viewportScale}
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
          const newAttrs = getPolyTransformAttrs(node, shape);
          onChange(newAttrs);
        }}
        ref={shapeRef}
      />
      {isSelected && tool === 'select' && vertexEditMode && shape.points && !isDraggingShape && !isAltPressed && (
         Array.from({ length: shape.points.length / 2 }).map((_, i) => {
             const { x: absX, y: absY } = calculateVertexPos(shape, i);
             const isVertexSelected = selectedVertexIndices[shape.id]?.includes(i);

             return (
                 <Circle
                    key={i}
                    x={absX}
                    y={absY}
                    radius={4 / viewportScale}
                    fill={isVertexSelected ? "red" : "white"}
                    stroke="#3b82f6"
                    strokeWidth={strokeWidth}
                    draggable
                    onDragMove={(e) => {
                        const { newPoints } = calculateVertexDrag(e, shape, i, !!isVertexSelected, selectedVertexIndices[shape.id], isShiftPressed);
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

