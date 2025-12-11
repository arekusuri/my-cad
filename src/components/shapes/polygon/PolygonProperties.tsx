import React from 'react';
import type { Shape } from '../../../store/useStore';
import { CommonProperties } from '../../lib/CommonProperties';

interface PolygonPropertiesProps {
  shape: Shape;
  updateShape: (id: string, attrs: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
}

export const PolygonProperties: React.FC<PolygonPropertiesProps> = ({ shape, updateShape, deleteShape }) => {
  return (
    <div className="flex flex-col gap-2">
      <CommonProperties shape={shape} updateShape={updateShape} deleteShape={deleteShape} />
    </div>
  );
};
