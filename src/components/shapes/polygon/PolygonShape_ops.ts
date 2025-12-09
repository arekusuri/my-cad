import type { Shape } from '../../../store/useStore';
import Konva from 'konva';
import { constrainLineToOrtho } from '../../modes/OrthoMode';

export const getPolygonTransformAttrs = (
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

export const getPolyTransformAttrs = (
  node: Konva.Line,
  shape: Shape
): Partial<Shape> => {
  const scaleX = node.scaleX();
  const scaleY = node.scaleY();

  // Reset scale to 1 and adjust dimensions instead
  node.scaleX(1);
  node.scaleY(1);

  const points = shape.points || [0, 0, 0, 0];
  const newPoints = points.map((p, i) => {
      return i % 2 === 0 ? p * scaleX : p * scaleY;
  });

  return {
    x: node.x(),
    y: node.y(),
    rotation: node.rotation(),
    points: newPoints,
  };
};

export const calculateVertexDrag = (
  e: Konva.KonvaEventObject<DragEvent>,
  shape: Shape,
  index: number,
  isVertexSelected: boolean,
  selectedVertexIndices: number[] | undefined,
  isOrthoMode: boolean = false
): { newPoints: number[] } => {
    // Inverse transform to get local coordinate
    const newAbsX = e.target.x();
    const newAbsY = e.target.y();
    
    const rad = (shape.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Subtract origin
    const dx = newAbsX - shape.x;
    const dy = newAbsY - shape.y;
    
    // Rotate back (-rotation)
    let newPx = dx * cos + dy * sin;
    let newPy = -dx * sin + dy * cos;
    
    // For segments with ortho mode: make the segment horizontal or vertical
    if (isOrthoMode && shape.type === 'segment' && shape.points && shape.points.length === 4) {
        // Segment has 2 points: [x1, y1, x2, y2]
        // If dragging point 0 (start), constrain relative to point 1 (end)
        // If dragging point 1 (end), constrain relative to point 0 (start)
        const otherIndex = index === 0 ? 1 : 0;
        const otherX = shape.points[otherIndex * 2];
        const otherY = shape.points[otherIndex * 2 + 1];
        
        const constrained = constrainLineToOrtho(otherX, otherY, newPx, newPy);
        newPx = constrained.endX;
        newPy = constrained.endY;
    }
    
    // Calculate delta from current pos
    const currentPx = shape.points![index * 2];
    const currentPy = shape.points![index * 2 + 1];
    const deltaX = newPx - currentPx;
    const deltaY = newPy - currentPy;
    
    const newPoints = [...(shape.points || [])];
    
    // Move all selected vertices of this shape
    const indicesToMove = isVertexSelected ? (selectedVertexIndices || [index]) : [index];
    
    indicesToMove.forEach(idx => {
        if (idx * 2 + 1 < newPoints.length) {
            newPoints[idx * 2] += deltaX;
            newPoints[idx * 2 + 1] += deltaY;
        }
    });

    return { newPoints };
}

export const calculateVertexPos = (shape: Shape, i: number) => {
     const px = shape.points![i * 2];
     const py = shape.points![i * 2 + 1];
     
     // Calculate absolute position for initial render
     const rad = (shape.rotation * Math.PI) / 180;
     const cos = Math.cos(rad);
     const sin = Math.sin(rad);
     
     const absX = shape.x + px * cos - py * sin;
     const absY = shape.y + px * sin + py * cos;
     return { x: absX, y: absY };
}

