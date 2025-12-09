import React from 'react';
import type { Shape } from '../store/useStore';
import Konva from 'konva';
import { RectShape } from './shapes/RectShape';
import { CircleShape } from './shapes/CircleShape';
import { SegmentShape } from './shapes/SegmentShape';
import { TriangleShape } from './shapes/TriangleShape';
import { PolygonShape } from './shapes/PolygonShape';

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
