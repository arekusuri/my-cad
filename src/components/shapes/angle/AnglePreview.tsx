import React from 'react';
import { Line, Circle } from 'react-konva';
import type { AngleDrawState } from './AngleDrawing';

interface AnglePreviewProps {
  /** Getter function to fetch preview data */
  getPreviewData: () => { drawState: AngleDrawState | null; previewPoint: { x: number; y: number } | null };
}

/**
 * Preview component for the angle tool while drawing.
 * Shows the vertex, first edge (solid), and second edge preview (dashed).
 * Both edge endpoints share the same x-coordinate (vertically aligned).
 */
export const AnglePreview: React.FC<AnglePreviewProps> = ({ getPreviewData }) => {
  const { drawState, previewPoint } = getPreviewData();
  if (!drawState) return null;
  
  const { vertex } = drawState;
  
  // Second edge goes directly to preview point (free angle)
  let edge2End = { x: vertex.x + 100, y: vertex.y - 100 }; // Default 45° up
  
  if (previewPoint) {
    edge2End = { x: previewPoint.x, y: previewPoint.y };
  }
  
  // Calculate second edge length
  const edge2Dx = edge2End.x - vertex.x;
  const edge2Dy = edge2End.y - vertex.y;
  const edge2Length = Math.sqrt(edge2Dx ** 2 + edge2Dy ** 2);
  
  // First edge is horizontal (always positive x), scaled to match second edge length
  const edge1End = { x: vertex.x + edge2Length, y: vertex.y };
  
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

