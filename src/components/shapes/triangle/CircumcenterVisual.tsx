import React from 'react';
import { Circle } from 'react-konva';
import { useStore } from '../../../store/useStore';

interface CircumcenterVisualProps {
  data: { center: { x: number; y: number }; radius: number } | null;
}

export const CircumcenterVisual: React.FC<CircumcenterVisualProps> = ({ data }) => {
  const viewportScale = useStore((state) => state.viewport.scale);

  if (!data) return null;
  const { center, radius } = data;

  return (
    <>
      <Circle
        x={center.x}
        y={center.y}
        radius={radius}
        stroke="#ef4444"
        strokeWidth={1 / viewportScale}
        dash={[4 / viewportScale, 4 / viewportScale]}
        listening={false}
        opacity={0.6}
      />
      <Circle
        x={center.x}
        y={center.y}
        radius={3 / viewportScale}
        fill="#ef4444"
        listening={false}
      />
    </>
  );
};

