import React from 'react';
import { useStore } from '../../store/useStore';
import { RectangleProperties } from '../shapes/rectangle/RectangleProperties';
import { CircleProperties } from '../shapes/circle/CircleProperties';
import { SegmentProperties } from '../shapes/segment/SegmentProperties';
import { TriangleProperties } from '../shapes/triangle/TriangleProperties';
import { PolygonProperties } from '../shapes/polygon/PolygonProperties';
import { X } from 'lucide-react';

export const Properties: React.FC = () => {
  const { selectedIds, shapes, updateShape, deleteShape, selectShape } = useStore();
  
  // "Actual panel" style: right sidebar, full height, persistent
  const panelClasses = "fixed right-0 top-0 h-full w-64 bg-white shadow-lg border-l border-gray-200 p-4 overflow-y-auto z-20";

  // Stop propagation to prevent clicks from reaching the canvas and deselecting
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleClose = () => {
      selectShape(null);
  }

  if (selectedIds.length === 0) {
    return null;
  }

  if (selectedIds.length > 1) {
    return (
      <div className={panelClasses} onMouseDown={handleMouseDown}>
        <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h3 className="font-bold">Properties</h3>
            <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
            </button>
        </div>
        <p className="text-gray-500">{selectedIds.length} shapes selected</p>
        <button 
          onClick={() => selectedIds.forEach(id => deleteShape(id))}
          className="bg-red-50 text-red-600 px-4 py-2 rounded hover:bg-red-100 mt-2 w-full"
        >
          Delete All
        </button>
      </div>
    );
  }

  const selectedShape = shapes.find((s) => s.id === selectedIds[0]);

  if (!selectedShape) {
      // Should effectively not happen if selectedIds has an ID, but safe fallback
      return null;
  }

  const renderProperties = () => {
    // Inject close button into the header of specific properties if needed, 
    // or just render the content below our common header
    const content = (() => {
        switch (selectedShape.type) {
            case 'rectangle':
                return <RectangleProperties shape={selectedShape} updateShape={updateShape} deleteShape={deleteShape} />;
            case 'circle':
                return <CircleProperties shape={selectedShape} updateShape={updateShape} deleteShape={deleteShape} />;
            case 'segment':
                return <SegmentProperties shape={selectedShape} updateShape={updateShape} deleteShape={deleteShape} />;
            case 'triangle':
                return <TriangleProperties shape={selectedShape} updateShape={updateShape} deleteShape={deleteShape} />;
            case 'polygon':
                return <PolygonProperties shape={selectedShape} updateShape={updateShape} deleteShape={deleteShape} />;
            default:
                return <div>Unknown shape type</div>;
        }
    })();
    
    return content;
  };

  return (
    <div className={panelClasses} onMouseDown={handleMouseDown}>
        <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h3 className="font-bold">Properties</h3>
            <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
            </button>
        </div>
      {renderProperties()}
    </div>
  );
};

