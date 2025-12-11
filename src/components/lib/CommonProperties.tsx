import React from 'react';
import type { Shape } from '../../store/useStore';

interface CommonPropertiesProps {
  shape: Shape;
  updateShape: (id: string, attrs: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
}

export const CommonProperties: React.FC<CommonPropertiesProps> = ({ shape, updateShape, deleteShape }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateShape(shape.id, { [name]: Number(value) });
  };

  return (
    <div className="grid grid-cols-2 gap-1.5 items-center">
      <label className="text-xs text-gray-600">X</label>
      <input 
        type="number" 
        name="x" 
        value={Math.round(shape.x)} 
        onChange={handleChange} 
        className="border rounded px-1.5 py-0.5 text-xs w-full"
      />
      <label className="text-xs text-gray-600">Y</label>
      <input 
        type="number" 
        name="y" 
        value={Math.round(shape.y)} 
        onChange={handleChange} 
        className="border rounded px-1.5 py-0.5 text-xs w-full"
      />
    </div>
  );
};

