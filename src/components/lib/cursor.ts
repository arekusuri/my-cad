import Konva from 'konva';

export const setCursor = (cursor: string, e?: Konva.KonvaEventObject<MouseEvent>) => {
  const container = e?.target.getStage()?.container();
  if (container) {
    container.style.cursor = cursor;
  }
};

