import Konva from 'konva';

export const commonDragBoundFunc = (
  pos: { x: number; y: number },
  dragStartPos: { x: number; y: number } | null,
  isShiftPressed: boolean
) => {
  // Orthogonal move constraint
  if (isShiftPressed && dragStartPos) {
    const dx = Math.abs(pos.x - dragStartPos.x);
    const dy = Math.abs(pos.y - dragStartPos.y);
    if (dx > dy) {
      return { x: pos.x, y: dragStartPos.y };
    } else {
      return { x: dragStartPos.x, y: pos.y };
    }
  }
  return pos;
};

export const limitResizeBoundBoxFunc = (oldBox: { width: number; height: number }, newBox: { width: number; height: number }) => {
    // Limit resize
    if (newBox.width < 5 || newBox.height < 5) {
      return oldBox;
    }
    return newBox;
};

