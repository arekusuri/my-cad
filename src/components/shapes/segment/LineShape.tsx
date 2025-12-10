import React, { useRef, useEffect } from 'react';
import { Line, Transformer, Circle } from 'react-konva';
import type { Shape } from '../../../store/useStore';
import { useStore } from '../../../store/useStore';
import Konva from 'konva';
import { commonDragBoundFunc, limitResizeBoundBoxFunc } from '../../lib/CommonShape_ops';
import { getPolyTransformAttrs, calculateVertexDrag, calculateVertexPos } from './SegmentShape_ops';
import { setCursor } from '../../lib/cursor';

interface LineShapeProps {
  shape: Shape;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<Shape>) => void;
  onTrim: (e: Konva.KonvaEventObject<MouseEvent> | Konva.KonvaEventObject<TouchEvent>) => void;
}

/**
 * Calculate the extended line points that go beyond the canvas bounds.
 * A line defined by two points extends infinitely in both directions.
 */
function getExtendedLinePoints(
  x: number,
  y: number,
  points: number[],
  canvasWidth: number,
  canvasHeight: number
): number[] {
  if (!points || points.length < 4) return [0, 0, 0, 0];
  
  // Get the two defining points in absolute coordinates
  const p1x = x + points[0];
  const p1y = y + points[1];
  const p2x = x + points[2];
  const p2y = y + points[3];
  
  // Direction vector
  const dx = p2x - p1x;
  const dy = p2y - p1y;
  
  // If points are the same, return original
  if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
    return points;
  }
  
  // Extend the line by finding intersections with canvas bounds
  // We'll extend far beyond the visible area
  const extent = Math.max(canvasWidth, canvasHeight) * 10;
  
  // Normalize direction and scale
  const len = Math.sqrt(dx * dx + dy * dy);
  const ndx = (dx / len) * extent;
  const ndy = (dy / len) * extent;
  
  // Extended points (relative to shape origin)
  const ext1x = points[0] - ndx;
  const ext1y = points[1] - ndy;
  const ext2x = points[2] + ndx;
  const ext2y = points[3] + ndy;
  
  return [ext1x, ext1y, ext2x, ext2y];
}

export const LineShape: React.FC<LineShapeProps> = ({
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

  // Get extended line points for rendering
  const extendedPoints = getExtendedLinePoints(
    shape.x,
    shape.y,
    shape.points || [0, 0, 0, 0],
    5000, // Large canvas size for extension
    5000
  );

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
        points={extendedPoints}
        closed={false}
        hitStrokeWidth={20 / viewportScale}
        draggable={tool === 'select'}
        onClick={handleClick}
        onTap={handleClick}
        onMouseLeave={(e) => {
          if (!isDraggingShape) setCursor('', e);
        }}
        onDragStart={(e) => {
          // Select shape when starting to drag (allows click-and-drag in one motion)
          if (!isSelected) onSelect();
          dragStartPos.current = { x: e.target.x(), y: e.target.y() };
          setIsDraggingShape(true);
          setCursor('move', e);
        }}
        dragBoundFunc={(pos) => commonDragBoundFunc(pos, dragStartPos.current, isShiftPressed)}
        onDragEnd={(e) => {
          dragStartPos.current = null;
          setIsDraggingShape(false);
          setCursor('', e);
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

