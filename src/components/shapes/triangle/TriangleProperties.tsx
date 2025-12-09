import React from 'react';
import type { Shape } from '../../../store/useStore';
import { CommonProperties } from '../CommonProperties';

interface TrianglePropertiesProps {
  shape: Shape;
  updateShape: (id: string, attrs: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
}

export const TriangleProperties: React.FC<TrianglePropertiesProps> = ({ shape, updateShape, deleteShape }) => {
  return (
    <div className="flex flex-col gap-4">
       {/* Header removed */}
      <CommonProperties shape={shape} updateShape={updateShape} deleteShape={deleteShape} />
      
      <div className="flex items-center gap-2 px-1">
        <input
          type="checkbox"
          id="showCircumcenter"
          checked={!!shape.showCircumcenter}
          onChange={(e) => updateShape(shape.id, { showCircumcenter: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="showCircumcenter" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
          Show Circumcenter
        </label>
      </div>
    </div>
  );
};
