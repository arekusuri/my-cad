import React from 'react';
import { Circle, Arc, Line } from 'react-konva';
import type { CompassDrawState } from './CompassDrawing';

interface CompassPreviewProps {
  drawState: CompassDrawState | null;
  previewPoint: { x: number; y: number } | null;
}

/**
 * Preview component for the compass tool while drawing.
 * Shows helper elements during drawing:
 * - Center point
 * - Circle guide (dotted)
 * - Start/end points
 * - Arc preview
 * These are only visible during drawing, not on the final shape.
 */
export const CompassPreview: React.FC<CompassPreviewProps> = ({ drawState, previewPoint }) => {
  if (!drawState) return null;
  
  const { center, radiusPoint, radius: storedRadius, startPoint } = drawState;
  
  // Calculate radius - use stored radius if available, otherwise calculate from preview
  const radius = storedRadius 
    ? storedRadius
    : radiusPoint 
      ? Math.sqrt(Math.pow(radiusPoint.x - center.x, 2) + Math.pow(radiusPoint.y - center.y, 2))
      : (previewPoint ? Math.sqrt(Math.pow(previewPoint.x - center.x, 2) + Math.pow(previewPoint.y - center.y, 2)) : 0);
  
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
  
  // "Waiting mode" = radius is set but no start point yet (between arcs)
  const isWaitingForNextArc = radiusPoint && !startPoint;
  
  return (
    <>
      {/* Center point - always show while compass is active */}
      <Circle
        x={center.x}
        y={center.y}
        radius={4}
        fill="#ef4444"
        stroke="#ef4444"
        strokeWidth={1}
        listening={false}
      />
      
      {/* Radius line (from center to preview point when setting radius) */}
      {previewPoint && !radiusPoint && (
        <Line
          points={[center.x, center.y, previewPoint.x, previewPoint.y]}
          stroke="#666"
          strokeWidth={1}
          dash={[6, 4]}
          listening={false}
        />
      )}
      
      {/* Circle guide (dotted) - show once radius is set */}
      {radiusPoint && radius > 0 && (
        <Circle
          x={center.x}
          y={center.y}
          radius={radius}
          stroke="#999"
          strokeWidth={1}
          dash={[6, 4]}
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
          strokeWidth={1}
          listening={false}
        />
      )}
      
      {/* Start point indicator (green) */}
      {startPoint && (
        <Circle
          x={startPoint.x}
          y={startPoint.y}
          radius={4}
          fill="#22c55e"
          stroke="#22c55e"
          strokeWidth={1}
          listening={false}
        />
      )}
      
      {/* Preview endpoint on circle */}
      {previewPoint && radiusPoint && !isWaitingForNextArc && (
        <Circle
          x={previewPoint.x}
          y={previewPoint.y}
          radius={4}
          fill={startPoint ? "#f97316" : "#3b82f6"}
          stroke={startPoint ? "#f97316" : "#3b82f6"}
          strokeWidth={1}
          listening={false}
        />
      )}
    </>
  );
};

