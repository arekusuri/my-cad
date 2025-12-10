import React from 'react';
import { Line, Circle } from 'react-konva';
import type { AngleDrawState } from './AngleDrawing';

interface AnglePreviewProps {
  drawState: AngleDrawState | null;
  previewPoint: { x: number; y: number } | null;
}

/**
 * Preview component for the angle tool while drawing.
 * Shows the vertex, first edge (solid), and second edge preview (dashed).
 * Both edge endpoints share the same x-coordinate (vertically aligned).
 */
export const AnglePreview: React.FC<AnglePreviewProps> = ({ drawState, previewPoint }) => {
  if (!drawState) return null;
  
  const { vertex } = drawState;
  
  // Calculate x-extent based on preview point
  let xExtent = 100; // Default length
  let edge2Y = vertex.y - 100; // Default angle (45° up)
  
  if (previewPoint) {
    const dx = previewPoint.x - vertex.x;
    const dy = previewPoint.y - vertex.y;
    if (Math.abs(dx) > 10) {
      xExtent = dx;
    }
    edge2Y = vertex.y + dy;
  }
  
  // First edge is horizontal, endpoints share the same x
  const edge1End = { x: vertex.x + xExtent, y: vertex.y };
  // Second edge endpoint has same x as first edge endpoint
  const edge2End = { x: vertex.x + xExtent, y: edge2Y };
  
  return (
    <>
      {/* Vertex point */}
      <Circle
        x={vertex.x}
        y={vertex.y}
        radius={4}
        fill="#3b82f6"
        stroke="#3b82f6"
        strokeWidth={1}
        listening={false}
      />
      
      {/* First edge (horizontal) - solid line */}
      <Line
        points={[vertex.x, vertex.y, edge1End.x, edge1End.y]}
        stroke="black"
        strokeWidth={1}
        listening={false}
      />
      
      {/* Second edge preview - dashed line (same x-extent as first edge) */}
      <Line
        points={[vertex.x, vertex.y, edge2End.x, edge2End.y]}
        stroke="#3b82f6"
        strokeWidth={1}
        dash={[6, 4]}
        listening={false}
      />
      
      {/* Preview endpoint */}
      <Circle
        x={edge2End.x}
        y={edge2End.y}
        radius={3}
        fill="#3b82f6"
        listening={false}
      />
    </>
  );
};

