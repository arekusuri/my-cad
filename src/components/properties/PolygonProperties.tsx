import React from 'react';
import type { Shape } from '../../store/useStore';

interface PolygonPropertiesProps {
  shape: Shape;
  onUpdate: (attrs: Partial<Shape>) => void;
}

export const PolygonProperties: React.FC<PolygonPropertiesProps> = ({ shape, onUpdate }) => {
  // Calculate number of sides
  const sides = React.useMemo(() => {
    if (!shape.points) return 0;
    return shape.points.length / 2;
  }, [shape.points]);

  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="text-sm">Sides</label>
      <span className="text-sm text-gray-600">{sides}</span>
    </div>
  );
};

