import React from 'react';
import type Konva from 'konva';
import { useStore, type Shape } from '../../store/useStore';
import { useShapeDrag } from '../../hooks/useShapeDrag';

export interface BaseShapeChildProps {
  x: number;
  y: number;
  draggable: boolean;
  onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onMouseLeave: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  dragBoundFunc: (pos: { x: number; y: number }) => { x: number; y: number };
  onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onTap: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  stroke: string;
  strokeWidth: number;
  hitStrokeWidth: number;
  isDragging: boolean;
  isSelected: boolean;
}

/** Optional drag event callbacks for shapes that need custom drag behavior */
interface DragCallbacks {
  onDragStart?: (x: number, y: number) => void;
  onDragMove?: (x: number, y: number) => void;
  onDragEnd?: () => void;
}

interface BaseShapeProps extends DragCallbacks {
  shape: Shape;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (attrs: Partial<Shape>) => void;
  onTrim: (e: Konva.KonvaEventObject<MouseEvent> | Konva.KonvaEventObject<TouchEvent>) => void;
  children: (props: BaseShapeChildProps) => React.ReactNode;
}

/**
 * Base component that wraps all common shape logic.
 * 
 * @example
 * // Simple usage
 * <BaseShape {...props}>
 *   {(base) => <Rect {...getBindProps(base)} width={shape.width} />}
 * </BaseShape>
 * 
 * // With custom drag callbacks (for attached segments, etc.)
 * <BaseShape {...props} onDragMove={(x, y) => updateAttachments(x, y)}>
 *   {(base) => <Line {...getBindProps(base)} points={shape.points} />}
 * </BaseShape>
 */
export const BaseShape: React.FC<BaseShapeProps> = ({
  shape,
  isSelected,
  onSelect,
  onChange,
  onTrim,
  onDragStart: onDragStartExtra,
  onDragMove: onDragMoveExtra,
  onDragEnd: onDragEndExtra,
  children,
}) => {
  const tool = useStore((state) => state.tool);
  const deleteShape = useStore((state) => state.deleteShape);
  const viewportScale = useStore((state) => state.viewport.scale);

  const {
    displayX,
    displayY,
    isDraggable,
    isDraggingShape,
    onDragStart,
    onDragMove,
    onDragEnd,
    onMouseLeave,
    dragBoundFunc,
  } = useShapeDrag({
    shapeId: shape.id,
    shapeX: shape.x,
    shapeY: shape.y,
    isSelected,
    onSelect,
    onChange,
  });

  const strokeWidth = 1 / viewportScale;

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent> | Konva.KonvaEventObject<TouchEvent>) => {
    if (tool === 'eraser') {
      deleteShape(shape.id);
      e.cancelBubble = true;
    } else if (tool === 'trim') {
      onTrim(e);
      e.cancelBubble = true;
    } else if (tool === 'select') {
      // Only allow selection when select tool is active
      onSelect();
    }
    // For all other tools, do nothing on click (don't select)
  };

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    onDragStart(e);
    onDragStartExtra?.(e.target.x(), e.target.y());
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    onDragMove(e);
    onDragMoveExtra?.(e.target.x(), e.target.y());
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onDragEnd(e);
    onDragEndExtra?.();
  };

  const childProps: BaseShapeChildProps = {
    x: displayX,
    y: displayY,
    draggable: tool === 'select' && isDraggable,
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd,
    onMouseLeave,
    dragBoundFunc,
    onClick: handleClick,
    onTap: handleClick,
    stroke: isSelected ? '#3b82f6' : (shape.stroke || '#000'),
    strokeWidth,
    hitStrokeWidth: 20 / viewportScale,
    isDragging: isDraggingShape,
    isSelected,
  };

  return <>{children(childProps)}</>;
};

/**
 * Helper to spread only the bindable props (excludes state props)
 */
export function getBindProps(props: BaseShapeChildProps) {
  const { isDragging, isSelected, ...bindProps } = props;
  return bindProps;
}

