import type { Shape } from '../../store/useStore';
import Konva from 'konva';

export const getRectTransformAttrs = (
  node: Konva.Rect,
  shape: Shape
): Partial<Shape> => {
  const scaleX = node.scaleX();
  const scaleY = node.scaleY();

  // Reset scale to 1 and adjust dimensions instead
  node.scaleX(1);
  node.scaleY(1);

  return {
    x: node.x(),
    y: node.y(),
    rotation: node.rotation(),
    width: Math.max(5, (shape.width || 0) * scaleX),
    height: Math.max(5, (shape.height || 0) * scaleY),
  };
};

