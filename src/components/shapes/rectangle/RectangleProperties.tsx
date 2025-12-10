import React from 'react';
import type { Shape } from '../../../store/useStore';
import { CommonProperties } from '../CommonProperties';

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
    <div className="flex flex-col gap-4">
      {/* Header removed, now handled in parent Properties.tsx */}
      
      <CommonProperties shape={shape} updateShape={updateShape} deleteShape={deleteShape} />

      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm">Width</label>
        <input 
          type="number" 
          name="width" 
          value={Math.round(shape.width || 0)} 
          onChange={handleChange} 
          className="border rounded px-2 py-1"
        />
        <label className="text-sm">Height</label>
        <input 
          type="number" 
          name="height" 
          value={Math.round(shape.height || 0)} 
          onChange={handleChange} 
          className="border rounded px-2 py-1"
        />
      </div>
      
       {/* Delete button removed */}
    </div>
  );
};

