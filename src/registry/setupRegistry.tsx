/**
 * Setup file that registers all shapes and tools with the registry.
 * Import this once at app startup.
 */
import React from 'react';
import { registerShape, registerTool } from './shapeRegistry';
import { MousePointer2, Eraser, Scissors, MapPin, ZoomIn } from 'lucide-react';

// Shape components
import { SegmentShape, LineShape } from '../components/shapes/segment';
import { RectangleShape } from '../components/shapes/rectangle/RectangleShape';
import { CircleShape } from '../components/shapes/circle/CircleShape';
import { TriangleShape } from '../components/shapes/triangle/TriangleShape';
import { PolygonShape } from '../components/shapes/polygon/PolygonShape';
import { AngleShape } from '../components/shapes/angle/AngleShape';
import { ArcShape } from '../components/shapes/arc/ArcShape';

// Drawing tools
import { SegmentDrawing } from '../components/shapes/segment/SegmentDrawing';
import { LineDrawing } from '../components/shapes/segment/LineDrawing';
import { RectangleDrawing } from '../components/shapes/rectangle/RectangleDrawing';
import { CircleDrawing } from '../components/shapes/circle/CircleDrawing';
import { TriangleDrawing } from '../components/shapes/triangle/TriangleDrawing';
import { PolygonDrawing } from '../components/shapes/polygon/PolygonDrawing';
import { AngleDrawing } from '../components/shapes/angle/AngleDrawing';
import { CompassDrawing } from '../components/shapes/arc/CompassDrawing';

// Icons
import { Square, Circle, Triangle, Hexagon } from 'lucide-react';

// Custom segment icon
const SegmentIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="17" x2="20" y2="9" />
    <circle cx="4" cy="17" r="2" fill="currentColor" stroke="none" />
    <circle cx="20" cy="9" r="2" fill="currentColor" stroke="none" />
  </svg>
);

// Custom line icon
const LineIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="18" x2="22" y2="8" />
    <circle cx="12" cy="13" r="2" fill="currentColor" stroke="none" />
  </svg>
);

// Custom angle icon
const AngleIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="18" x2="20" y2="18" />
    <line x1="4" y1="18" x2="16" y2="6" />
    <path d="M 10 18 A 6 6 0 0 1 8.5 13.5" fill="none" />
    <circle cx="4" cy="18" r="2" fill="currentColor" stroke="none" />
  </svg>
);

// Custom compass icon
const CompassIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="4" r="2" fill="currentColor" stroke="none" />
    <line x1="12" y1="4" x2="6" y2="20" />
    <line x1="12" y1="4" x2="18" y2="20" />
    <path d="M 5 18 L 6 20 L 7 18" fill="none" />
    <circle cx="18" cy="20" r="1" fill="currentColor" stroke="none" />
    <path d="M 6 20 A 12 12 0 0 1 10 14" fill="none" strokeDasharray="2 2" />
  </svg>
);

/**
 * Register all shapes with the registry
 */
export function setupShapeRegistry(): void {
  // Segment
  registerShape({
    type: 'segment',
    toolType: 'segment',
    component: SegmentShape,
    createDrawingTool: () => new SegmentDrawing(),
    toolbar: { icon: SegmentIcon, label: 'Segment', order: 50 },
  });

  // Line (infinite)
  registerShape({
    type: 'line',
    toolType: 'line',
    component: LineShape,
    createDrawingTool: () => new LineDrawing(),
    toolbar: { icon: LineIcon, label: 'Line', order: 60 },
  });

  // Rectangle
  registerShape({
    type: 'rectangle',
    toolType: 'rectangle',
    component: RectangleShape,
    createDrawingTool: () => new RectangleDrawing(),
    toolbar: { icon: Square, label: 'Rectangle', order: 20 },
  });

  // Circle
  registerShape({
    type: 'circle',
    toolType: 'circle',
    component: CircleShape,
    createDrawingTool: () => new CircleDrawing(),
    toolbar: { icon: Circle, label: 'Circle', order: 30 },
  });

  // Triangle
  registerShape({
    type: 'triangle',
    toolType: 'triangle',
    component: TriangleShape,
    createDrawingTool: () => new TriangleDrawing(),
    toolbar: { icon: Triangle, label: 'Triangle', order: 40 },
  });

  // Polygon
  registerShape({
    type: 'polygon',
    toolType: 'polygon',
    component: PolygonShape,
    createDrawingTool: () => new PolygonDrawing(),
    toolbar: { icon: Hexagon, label: 'Polygon', order: 45 },
  });

  // Angle
  registerShape({
    type: 'angle',
    toolType: 'angle',
    component: AngleShape,
    createDrawingTool: () => new AngleDrawing(),
    toolbar: { icon: AngleIcon, label: 'Angle', order: 70 },
  });

  // Arc (created by compass tool)
  registerShape({
    type: 'arc',
    toolType: 'compass',
    component: ArcShape,
    createDrawingTool: () => new CompassDrawing(),
    toolbar: { icon: CompassIcon, label: 'Compass', order: 80 },
  });

  // Non-drawing tools
  registerTool({
    type: 'select',
    toolbar: { icon: MousePointer2, label: 'Select', order: 10 },
  });

  registerTool({
    type: 'point',
    toolbar: { icon: MapPin, label: 'Point', order: 85 },
  });

  registerTool({
    type: 'trim',
    toolbar: { icon: Scissors, label: 'Trim', order: 90 },
  });

  registerTool({
    type: 'eraser',
    toolbar: { icon: Eraser, label: 'Eraser', order: 95 },
  });

  registerTool({
    type: 'zoom',
    toolbar: { icon: ZoomIn, label: 'Zoom', order: 100 },
  });
}

