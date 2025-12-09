import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { Line, Transformer, Circle } from 'react-konva';
import type { Shape } from '../../../store/useStore';
import { useStore } from '../../../store/useStore';
import Konva from 'konva';
import { commonDragBoundFunc, limitResizeBoundBoxFunc } from '../CommonShape_ops';
import { calculateVertexDrag, calculateVertexPos, getPolyTransformAttrs } from '../polygon/PolygonShape_ops';
import { setCursor } from '../cursor';
import { updateAttachedSegments } from './TriangleAttachment';
import { getCircumcenter } from './TriangleCircumcenter';

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
  const shapeRef = useRef<Konva.Line>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const isShiftPressed = useStore((state) => state.isShiftPressed);
  const isAltPressed = useStore((state) => state.isAltPressed);
  const tool = useStore((state) => state.tool);
  const vertexEditMode = useStore((state) => state.vertexEditMode);
  const selectedVertexIndices = useStore((state) => state.selectedVertexIndices);
  const deleteShape = useStore((state) => state.deleteShape);
  const shapes = useStore((state) => state.shapes);
  const segmentAttachments = useStore((state) => state.segmentAttachments);
  const updateShape = useStore((state) => state.updateShape);
  const viewportScale = useStore((state) => state.viewport.scale);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const [isDraggingShape, setIsDraggingShape] = React.useState(false);
  
  // Stroke width that maintains consistent visual appearance regardless of zoom
  const strokeWidth = 1 / viewportScale;

  // Calculate circumcenter for the triangle
  const circumcenter = useMemo(() => getCircumcenter(shape), [shape]);

  // Update attached segments during drag
  const updateAttachedSegmentsDuringDrag = useCallback((currentX: number, currentY: number) => {
    // Create a temporary shape object with the current drag position
    const tempShape: Shape = {
      ...shape,
      x: currentX,
      y: currentY,
    };
    
    // Get segment updates and apply them
    const updates = updateAttachedSegments(tempShape, shapes, segmentAttachments);
    Object.entries(updates).forEach(([segmentId, attrs]) => {
      updateShape(segmentId, attrs);
    });
  }, [shape, shapes, segmentAttachments, updateShape]);

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

  // Triangle requires points array with 6 values [x1,y1,x2,y2,x3,y3]
  if (!shape.points || shape.points.length < 6) {
    return null;
  }

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
        closed={true}
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
        onDragMove={(e) => {
          // Update attached segments in real-time during drag
          updateAttachedSegmentsDuringDrag(e.target.x(), e.target.y());
        }}
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
          const node = shapeRef.current as Konva.Line;
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
      {/* Circumcenter visualization - shown when triangle is selected */}
      {isSelected && circumcenter && (
        <>
          {/* Circumscribed circle (dashed) */}
          <Circle
            x={circumcenter.center.x}
            y={circumcenter.center.y}
            radius={circumcenter.radius}
            stroke="#f59e0b"
            strokeWidth={strokeWidth}
            dash={[6 / viewportScale, 4 / viewportScale]}
            listening={false}
          />
          {/* Circumcenter point */}
          <Circle
            x={circumcenter.center.x}
            y={circumcenter.center.y}
            radius={4 / viewportScale}
            fill="#f59e0b"
            stroke="#d97706"
            strokeWidth={strokeWidth}
            listening={false}
          />
        </>
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

