import { constrainToAxis } from '../modes/OrthoMode';

export const commonDragBoundFunc = (
  pos: { x: number; y: number },
  dragStartPos: { x: number; y: number } | null,
  isShiftPressed: boolean
) => {
  // Orthogonal move constraint
  if (isShiftPressed && dragStartPos) {
    return constrainToAxis(dragStartPos, pos);
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

