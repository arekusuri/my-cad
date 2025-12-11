import React from 'react';
import type { Shape } from '../../../store/useStore';
import { CommonProperties } from '../../lib/CommonProperties';

interface RectanglePropertiesProps {
  shape: Shape;
  updateShape: (id: string, attrs: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
}

export const RectangleProperties: React.FC<RectanglePropertiesProps> = ({ shape, updateShape, deleteShape }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateShape(shape.id, { [name]: Number(value) });
  };

  return (
    <div className="flex flex-col gap-2">
      <CommonProperties shape={shape} updateShape={updateShape} deleteShape={deleteShape} />
      <div className="grid grid-cols-2 gap-1.5 items-center">
        <label className="text-xs text-gray-600">Width</label>
        <input 
          type="number" 
          name="width" 
          value={Math.round(shape.width || 0)} 
          onChange={handleChange} 
          className="border rounded px-1.5 py-0.5 text-xs w-full"
        />
        <label className="text-xs text-gray-600">Height</label>
        <input 
          type="number" 
          name="height" 
          value={Math.round(shape.height || 0)} 
          onChange={handleChange} 
          className="border rounded px-1.5 py-0.5 text-xs w-full"
        />
      </div>
    </div>
  );
};

