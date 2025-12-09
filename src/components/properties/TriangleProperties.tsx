import React from 'react';
import type { Shape } from '../../store/useStore';

interface TrianglePropertiesProps {
  shape: Shape;
  onUpdate: (attrs: Partial<Shape>) => void;
}

export const TriangleProperties: React.FC<TrianglePropertiesProps> = ({ shape, onUpdate }) => {
  return (
    <div className="border-t pt-3 mt-2">
      <h4 className="text-sm font-medium mb-2">Triangle Centers</h4>
      <label className="flex items-center gap-2 cursor-pointer">
        <input 
          type="checkbox" 
          checked={shape.showCircumcenter || false}
          onChange={(e) => onUpdate({ showCircumcenter: e.target.checked })}
          className="w-4 h-4 text-emerald-600 rounded"
        />
        <span className="text-sm">Show Circumcenter (外心)</span>
      </label>
    </div>
  );
};

