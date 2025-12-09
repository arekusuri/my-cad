import React from 'react';
import type { Shape } from '../../store/useStore';

interface SegmentPropertiesProps {
  shape: Shape;
  onUpdate: (attrs: Partial<Shape>) => void;
}

export const SegmentProperties: React.FC<SegmentPropertiesProps> = ({ shape, onUpdate }) => {
  // Calculate segment length
  const length = React.useMemo(() => {
    if (!shape.points || shape.points.length < 4) return 0;
    const dx = shape.points[2] - shape.points[0];
    const dy = shape.points[3] - shape.points[1];
    return Math.sqrt(dx * dx + dy * dy);
  }, [shape.points]);

  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="text-sm">Length</label>
      <span className="text-sm text-gray-600">{Math.round(length)}</span>
    </div>
  );
};

