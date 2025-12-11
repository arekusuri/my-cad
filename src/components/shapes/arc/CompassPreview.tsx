import React from 'react';
import { Circle, Arc, Line } from 'react-konva';
import type { CompassDrawState } from './CompassDrawing';

interface CompassPreviewProps {
  /** Getter function to fetch preview data */
  getPreviewData: () => { drawState: CompassDrawState | null; previewPoint: { x: number; y: number } | null };
}

/**
 * Preview component for the compass tool while drawing.
 * Shows helper elements during drawing:
 * - Center point (red dot)
 * - Dashed circle guide showing the radius
 * - Start point (green dot)
 * - End point preview (orange dot)
 * - Arc preview (solid line)
 */
export const CompassPreview: React.FC<CompassPreviewProps> = ({ getPreviewData }) => {
  const { drawState, previewPoint } = getPreviewData();
  if (!drawState) return null;
  
  const { center, radius, startPoint } = drawState;
  
  // Calculate angles for arc preview
  let startAngle = 0;
  let sweepAngle = 0;
  
  if (startPoint && previewPoint) {
    startAngle = Math.atan2(startPoint.y - center.y, startPoint.x - center.x) * (180 / Math.PI);
    const endAngle = Math.atan2(previewPoint.y - center.y, previewPoint.x - center.x) * (180 / Math.PI);
    sweepAngle = endAngle - startAngle;
    
    // Normalize to shorter arc
    if (sweepAngle > 180) sweepAngle -= 360;
    if (sweepAngle < -180) sweepAngle += 360;
  }
  
  return (
    <>
      {/* Center point - red indicator */}
      <Circle
        x={center.x}
        y={center.y}
        radius={4}
        fill="#ef4444"
        stroke="#dc2626"
        strokeWidth={1}
        listening={false}
      />
      
      {/* Dashed circle guide showing the full radius */}
      <Circle
        x={center.x}
        y={center.y}
        radius={radius}
        stroke="#6b7280"
        strokeWidth={1}
        dash={[8, 4]}
        listening={false}
      />
      
      {/* Radius line from center to preview point */}
      {previewPoint && !startPoint && (
        <Line
          points={[center.x, center.y, previewPoint.x, previewPoint.y]}
          stroke="#9ca3af"
          strokeWidth={1}
          dash={[4, 4]}
          listening={false}
        />
      )}
      
      {/* Arc preview - solid line */}
      {startPoint && previewPoint && Math.abs(sweepAngle) > 0.1 && (
        <Arc
          x={center.x}
          y={center.y}
          innerRadius={radius}
          outerRadius={radius}
          angle={Math.abs(sweepAngle)}
          rotation={sweepAngle >= 0 ? startAngle : startAngle + sweepAngle}
          stroke="black"
          strokeWidth={2}
          listening={false}
        />
      )}
      
      {/* Start point indicator (green) */}
      {startPoint && (
        <Circle
          x={startPoint.x}
          y={startPoint.y}
          radius={5}
          fill="#22c55e"
          stroke="#16a34a"
          strokeWidth={1}
          listening={false}
        />
      )}
      
      {/* Preview endpoint on circle (blue when setting start, orange when drawing arc) */}
      {previewPoint && (
        <Circle
          x={previewPoint.x}
          y={previewPoint.y}
          radius={5}
          fill={startPoint ? "#f97316" : "#3b82f6"}
          stroke={startPoint ? "#ea580c" : "#2563eb"}
          strokeWidth={1}
          listening={false}
        />
      )}
    </>
  );
};
