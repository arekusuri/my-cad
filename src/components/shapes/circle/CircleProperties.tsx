import React from 'react';
import type { Shape } from '../../../store/useStore';
import { CommonProperties } from '../../lib/CommonProperties';

interface CirclePropertiesProps {
  shape: Shape;
  updateShape: (id: string, attrs: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
}

export const CircleProperties: React.FC<CirclePropertiesProps> = ({ shape, updateShape, deleteShape }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateShape(shape.id, { [name]: Number(value) });
  };

  return (
    <div className="flex flex-col gap-2">
      <CommonProperties shape={shape} updateShape={updateShape} deleteShape={deleteShape} />
      <div className="grid grid-cols-2 gap-1.5 items-center">
         <label className="text-xs text-gray-600">Radius</label>
         <input 
          type="number" 
          name="radius" 
          value={Math.round(shape.radius || 0)} 
          onChange={handleChange} 
          className="border rounded px-1.5 py-0.5 text-xs w-full"
        />
      </div>
    </div>
  );
};
