import React from 'react';
import type { Shape } from '../../../store/useStore';
import { CommonProperties } from '../CommonProperties';

interface PolygonPropertiesProps {
  shape: Shape;
  updateShape: (id: string, attrs: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
}

export const PolygonProperties: React.FC<PolygonPropertiesProps> = ({ shape, updateShape, deleteShape }) => {
  return (
    <div className="flex flex-col gap-4">
       {/* Header removed */}
      <CommonProperties shape={shape} updateShape={updateShape} deleteShape={deleteShape} />
       {/* Delete button removed */}
    </div>
  );
};
