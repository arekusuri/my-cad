import React from 'react';
import { Line } from 'react-konva';

interface GridProps {
  viewport: {
    x: number;
    y: number;
    scale: number;
  };
}

const GRID_SIZE = 20;

export const Grid: React.FC<GridProps> = ({ viewport }) => {
  const lines = [];
  // When zoomed, we need to render more grid to cover visible area
  const visibleWidth = window.innerWidth / viewport.scale;
  const visibleHeight = window.innerHeight / viewport.scale;
  const offsetX = -viewport.x / viewport.scale;
  const offsetY = -viewport.y / viewport.scale;
  
  // Calculate grid bounds with some padding
  const startCol = Math.floor(offsetX / GRID_SIZE) - 1;
  const endCol = Math.ceil((offsetX + visibleWidth) / GRID_SIZE) + 1;
  const startRow = Math.floor(offsetY / GRID_SIZE) - 1;
  const endRow = Math.ceil((offsetY + visibleHeight) / GRID_SIZE) + 1;
  
  // Stroke width inversely proportional to scale so it looks the same on screen
  const gridStrokeWidth = 1 / viewport.scale;

  for (let i = startCol; i <= endCol; i++) {
    lines.push(
      <Line
        key={`v-${i}`}
        points={[i * GRID_SIZE, startRow * GRID_SIZE, i * GRID_SIZE, endRow * GRID_SIZE]}
        stroke="#e5e7eb"
        strokeWidth={gridStrokeWidth}
      />
    );
  }
  for (let j = startRow; j <= endRow; j++) {
    lines.push(
      <Line
        key={`h-${j}`}
        points={[startCol * GRID_SIZE, j * GRID_SIZE, endCol * GRID_SIZE, j * GRID_SIZE]}
        stroke="#e5e7eb"
        strokeWidth={gridStrokeWidth}
      />
    );
  }
  return <>{lines}</>;
};

