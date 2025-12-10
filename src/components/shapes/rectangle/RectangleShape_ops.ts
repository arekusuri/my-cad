import type { Shape } from '../../../store/useStore';
import Konva from 'konva';

export const getRectangleTransformAttrs = (
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

export const getRectangleCornerPositions = (shape: Shape) => {
    const x = shape.x;
    const y = shape.y;
    const w = shape.width || 0;
    const h = shape.height || 0;
    const r = (shape.rotation || 0) * Math.PI / 180;
    const cos = Math.cos(r);
    const sin = Math.sin(r);

    // 0: TL (0,0), 1: TR (w,0), 2: BR (w,h), 3: BL (0,h)
    const corners = [
        { x: x, y: y }, // TL
        { x: x + w * cos, y: y + w * sin }, // TR
        { x: x + w * cos - h * sin, y: y + w * sin + h * cos }, // BR
        { x: x - h * sin, y: y + h * cos } // BL
    ];
    return corners;
};

export const calculateRectangleFromDrag = (
    shape: Shape,
    cornerIndex: number,
    dragPos: { x: number, y: number }
): Partial<Shape> => {
    // 1. Find fixed corner index (opposite)
    const fixedIndex = (cornerIndex + 2) % 4;
    const currentCorners = getRectangleCornerPositions(shape);
    const fixedPoint = currentCorners[fixedIndex];

    // 2. Rotate DragPos around FixedPoint by -rotation
    const r = (shape.rotation || 0) * Math.PI / 180;
    const cos = Math.cos(-r);
    const sin = Math.sin(-r);
    
    const dx = dragPos.x - fixedPoint.x;
    const dy = dragPos.y - fixedPoint.y;
    
    // Vector from Fixed to Drag in unrotated space
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;

    // 3. Calculate new Width/Height based on which corner is fixed
    // cornerIndex:
    // 0 (TL) -> Fixed BR (2). Vector BR->TL = (-w, -h). w = -lx, h = -ly.
    // 1 (TR) -> Fixed BL (3). Vector BL->TR = (w, -h). w = lx, h = -ly.
    // 2 (BR) -> Fixed TL (0). Vector TL->BR = (w, h). w = lx, h = ly.
    // 3 (BL) -> Fixed TR (1). Vector TR->BL = (-w, h). w = -lx, h = ly.
    
    let newW = 0;
    let newH = 0;

    if (cornerIndex === 0) { newW = -lx; newH = -ly; }
    else if (cornerIndex === 1) { newW = lx; newH = -ly; }
    else if (cornerIndex === 2) { newW = lx; newH = ly; }
    else if (cornerIndex === 3) { newW = -lx; newH = ly; }

    // 4. Calculate new X, Y (TL corner)
    let fxLocal = 0;
    let fyLocal = 0;
    if (fixedIndex === 1) fxLocal = newW;
    else if (fixedIndex === 2) { fxLocal = newW; fyLocal = newH; }
    else if (fixedIndex === 3) fyLocal = newH;
    
    // Rotate (fxLocal, fyLocal) by rotation
    const cosR = Math.cos(r);
    const sinR = Math.sin(r);
    const rotFx = fxLocal * cosR - fyLocal * sinR;
    const rotFy = fxLocal * sinR + fyLocal * cosR;

    const newX = fixedPoint.x - rotFx;
    const newY = fixedPoint.y - rotFy;

    return {
        x: newX,
        y: newY,
        width: newW,
        height: newH,
    };
};

