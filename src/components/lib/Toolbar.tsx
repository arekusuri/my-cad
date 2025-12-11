import React from 'react';
import { useStore } from '../../store/useStore';
import { Maximize } from 'lucide-react';
import { getToolbarItems } from '../../registry';

export const Toolbar: React.FC = () => {
  const tool = useStore((state) => state.tool);
  const setTool = useStore((state) => state.setTool);
  const isZoomed = useStore((state) => state.isZoomed);
  const resetViewport = useStore((state) => state.resetViewport);

  // Get tools from registry (sorted by order)
  const tools = getToolbarItems();

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
      {tools
        .filter(t => t.type !== 'zoom') // Handle zoom separately
        .map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.type}
              onClick={() => setTool(t.type)}
              className={`p-2 rounded hover:bg-gray-100 ${
                tool === t.type ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
              }`}
              title={t.label}
            >
              <Icon size={20} />
            </button>
          );
        })}
      {/* Zoom / Restore button - changes based on zoom state */}
      <button
        onClick={handleZoomClick}
        className={`p-2 rounded hover:bg-gray-100 ${
          tool === 'zoom' ? 'bg-blue-100 text-blue-600' : isZoomed ? 'bg-orange-100 text-orange-600' : 'text-gray-600'
        }`}
        title={isZoomed ? 'Restore view (show whole grid)' : 'Range zoom'}
      >
        {isZoomed ? (
          <Maximize size={20} />
        ) : (
          (() => {
            const zoomTool = tools.find(t => t.type === 'zoom');
            const ZoomIcon = zoomTool?.icon;
            return ZoomIcon ? <ZoomIcon size={20} /> : null;
          })()
        )}
      </button>
    </div>
  );
};

