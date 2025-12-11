import React from 'react';
import type { Shape } from '../../../store/useStore';
import { CommonProperties } from '../../lib/CommonProperties';

interface TrianglePropertiesProps {
  shape: Shape;
  updateShape: (id: string, attrs: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
}

export const TriangleProperties: React.FC<TrianglePropertiesProps> = ({ shape, updateShape, deleteShape }) => {
  return (
    <div className="flex flex-col gap-2">
      <CommonProperties shape={shape} updateShape={updateShape} deleteShape={deleteShape} />
      
      <div className="flex items-center gap-1.5">
        <input
          type="checkbox"
          id="showCircumcenter"
          checked={!!shape.showCircumcenter}
          onChange={(e) => updateShape(shape.id, { showCircumcenter: e.target.checked })}
          className="h-3 w-3 rounded border-gray-300 text-blue-600"
        />
        <label htmlFor="showCircumcenter" className="text-xs text-gray-600 select-none cursor-pointer">
          Circumcenter (外心)
        </label>
      </div>
      
      <div className="flex items-center gap-1.5">
        <input
          type="checkbox"
          id="showOrthocenter"
          checked={!!shape.showOrthocenter}
          onChange={(e) => updateShape(shape.id, { showOrthocenter: e.target.checked })}
          className="h-3 w-3 rounded border-gray-300 text-blue-600"
        />
        <label htmlFor="showOrthocenter" className="text-xs text-gray-600 select-none cursor-pointer">
          Orthocenter (垂心)
        </label>
      </div>
      
      <div className="flex items-center gap-1.5">
        <input
          type="checkbox"
          id="showCentroid"
          checked={!!shape.showCentroid}
          onChange={(e) => updateShape(shape.id, { showCentroid: e.target.checked })}
          className="h-3 w-3 rounded border-gray-300 text-blue-600"
        />
        <label htmlFor="showCentroid" className="text-xs text-gray-600 select-none cursor-pointer">
          Centroid (重心)
        </label>
      </div>
    </div>
  );
};
