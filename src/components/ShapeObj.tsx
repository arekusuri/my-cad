import React from 'react';
import type { Shape } from '../store/useStore';
import Konva from 'konva';
import { RectShape } from './shapes/rect/RectShape';
import { CircleShape } from './shapes/circle/CircleShape';
import { SegmentShape } from './shapes/segment/SegmentShape';
import { TriangleShape } from './shapes/triangle/TriangleShape';
import { PolygonShape } from './shapes/polygon/PolygonShape';

interface ShapeObjProps {
  shape: Shape;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<Shape>) => void;
  onTrim: (e: Konva.KonvaEventObject<MouseEvent> | Konva.KonvaEventObject<TouchEvent>) => void;
}

export const ShapeObj: React.FC<ShapeObjProps> = (props) => {
  const { shape } = props;

  switch (shape.type) {
    case 'rect':
      return <RectShape {...props} />;
    case 'circle':
      return <CircleShape {...props} />;
    case 'segment':
      return <SegmentShape {...props} />;
    case 'triangle':
      return <TriangleShape {...props} />;
    case 'polygon':
      return <PolygonShape {...props} />;
    default:
      return null;
  }
};
