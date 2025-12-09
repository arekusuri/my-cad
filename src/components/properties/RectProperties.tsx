import React from 'react';
import type { Shape } from '../../store/useStore';

interface RectPropertiesProps {
  shape: Shape;
  onUpdate: (attrs: Partial<Shape>) => void;
}

export const RectProperties: React.FC<RectPropertiesProps> = ({ shape, onUpdate }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onUpdate({ [name]: Number(value) });
  };

  return (
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
  );
};

