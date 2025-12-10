import React from 'react';
import { useStore, type ToolType } from '../store/useStore';
import { MousePointer2, Square, Circle, Eraser, Scissors, Triangle, Hexagon, MapPin, ZoomIn, Maximize } from 'lucide-react';

// Custom segment icon: 30-degree angled line with points on both ends
const SegmentIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* 30-degree line from bottom-left to top-right */}
    <line x1="4" y1="17" x2="20" y2="9" />
    {/* Point at start */}
    <circle cx="4" cy="17" r="2" fill="currentColor" stroke="none" />
    {/* Point at end */}
    <circle cx="20" cy="9" r="2" fill="currentColor" stroke="none" />
  </svg>
);

// Custom line icon: 30-degree line with point in the middle (infinite line)
const LineIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* 30-degree line extending beyond bounds */}
    <line x1="2" y1="18" x2="22" y2="8" />
    {/* Point in the middle */}
    <circle cx="12" cy="13" r="2" fill="currentColor" stroke="none" />
  </svg>
);

export const Toolbar: React.FC = () => {
  const tool = useStore((state) => state.tool);
  const setTool = useStore((state) => state.setTool);
  const isZoomed = useStore((state) => state.isZoomed);
  const resetViewport = useStore((state) => state.resetViewport);

  const tools: Array<{ name: ToolType; icon: typeof MousePointer2 }> = [
    { name: 'select', icon: MousePointer2 },
    { name: 'rect', icon: Square },
    { name: 'circle', icon: Circle },
    { name: 'triangle', icon: Triangle },
    { name: 'polygon', icon: Hexagon },
    { name: 'segment', icon: SegmentIcon },
    { name: 'line', icon: LineIcon },
    { name: 'point', icon: MapPin },
    { name: 'trim', icon: Scissors },
    { name: 'eraser', icon: Eraser },
  ];

  const handleZoomClick = () => {
    if (isZoomed) {
      // Reset to show whole grid
      resetViewport();
    } else {
      // Enter zoom mode
      setTool('zoom');
    }
  };

  return (
    <div className="fixed left-4 top-4 z-10 flex flex-col gap-2 bg-white p-2 rounded-lg shadow-md border border-gray-200">
      {tools.map((t) => (
        <button
          key={t.name}
          onClick={() => setTool(t.name)}
          className={`p-2 rounded hover:bg-gray-100 ${
            tool === t.name ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
          }`}
          title={t.name}
        >
          <t.icon size={20} />
        </button>
      ))}
      {/* Zoom / Restore button - changes based on zoom state */}
      <button
        onClick={handleZoomClick}
        className={`p-2 rounded hover:bg-gray-100 ${
          tool === 'zoom' ? 'bg-blue-100 text-blue-600' : isZoomed ? 'bg-orange-100 text-orange-600' : 'text-gray-600'
        }`}
        title={isZoomed ? 'Restore view (show whole grid)' : 'Range zoom'}
      >
        {isZoomed ? <Maximize size={20} /> : <ZoomIn size={20} />}
      </button>
    </div>
  );
};

