import React from 'react';
import type { Shape } from '../../../store/useStore';
import { CommonProperties } from '../CommonProperties';

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
    <div className="flex flex-col gap-4">
       {/* Header removed */}
      
      <CommonProperties shape={shape} updateShape={updateShape} deleteShape={deleteShape} />

      <div className="grid grid-cols-2 gap-2">
         <label className="text-sm">Radius</label>
         <input 
          type="number" 
          name="radius" 
          value={Math.round(shape.radius || 0)} 
          onChange={handleChange} 
          className="border rounded px-2 py-1"
        />
      </div>

       {/* Delete button removed */}
    </div>
  );
};
