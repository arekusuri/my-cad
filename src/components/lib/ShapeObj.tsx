import React from 'react';
import type { Shape } from '../../store/useStore';
import Konva from 'konva';
import { RectangleShape } from '../shapes/rectangle/RectangleShape';
import { CircleShape } from '../shapes/circle/CircleShape';
import { SegmentShape, LineShape } from '../shapes/segment';
import { TriangleShape } from '../shapes/triangle/TriangleShape';
import { PolygonShape } from '../shapes/polygon/PolygonShape';

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
    case 'rectangle':
      return <RectangleShape {...props} />;
    case 'circle':
      return <CircleShape {...props} />;
    case 'segment':
      return <SegmentShape {...props} />;
    case 'line':
      return <LineShape {...props} />;
    case 'triangle':
      return <TriangleShape {...props} />;
    case 'polygon':
      return <PolygonShape {...props} />;
    default:
      return null;
  }
};

