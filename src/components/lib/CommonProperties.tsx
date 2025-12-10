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
    <>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm">X</label>
        <input 
          type="number" 
          name="x" 
          value={Math.round(shape.x)} 
          onChange={handleChange} 
          className="border rounded px-2 py-1"
        />

        <label className="text-sm">Y</label>
        <input 
          type="number" 
          name="y" 
          value={Math.round(shape.y)} 
          onChange={handleChange} 
          className="border rounded px-2 py-1"
        />
      </div>
    </>
  );
};

