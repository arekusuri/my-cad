import React from 'react';
import type { Shape } from '../../store/useStore';

interface CirclePropertiesProps {
  shape: Shape;
  onUpdate: (attrs: Partial<Shape>) => void;
}

export const CircleProperties: React.FC<CirclePropertiesProps> = ({ shape, onUpdate }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onUpdate({ [name]: Number(value) });
  };

  return (
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
  );
};

