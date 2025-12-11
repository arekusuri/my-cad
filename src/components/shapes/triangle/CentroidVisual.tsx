import React from 'react';
import { Circle } from 'react-konva';
import { useStore } from '../../../store/useStore';

interface CentroidVisualProps {
  data: { x: number; y: number } | null;
}

export const CentroidVisual: React.FC<CentroidVisualProps> = ({ data }) => {
  const viewportScale = useStore((state) => state.viewport.scale);

  if (!data) return null;

  return (
    <Circle
      x={data.x}
      y={data.y}
      radius={3 / viewportScale}
      fill="#10b981"
      listening={false}
    />
  );
};

