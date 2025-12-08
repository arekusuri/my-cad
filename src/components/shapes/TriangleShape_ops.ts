import type { Shape } from '../../store/useStore';
import Konva from 'konva';

export const getTriangleTransformAttrs = (
  node: Konva.RegularPolygon,
  shape: Shape
): Partial<Shape> => {
  const scaleX = node.scaleX();
  
  // Reset scale to 1 and adjust dimensions instead
  node.scaleX(1);
  node.scaleY(1);

  return {
    x: node.x(),
    y: node.y(),
    rotation: node.rotation(),
    radius: Math.max(5, (shape.radius || 0) * scaleX),
  };
};

