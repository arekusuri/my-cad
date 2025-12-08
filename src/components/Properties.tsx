import React from 'react';
import { useStore } from '../store/useStore';

export const Properties: React.FC = () => {
  const { selectedIds, shapes, updateShape, deleteShape } = useStore();
  
  if (selectedIds.length === 0) {
    return (
      <div className="fixed right-4 top-4 w-64 bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <p className="text-gray-500">No shape selected</p>
      </div>
    );
  }

  if (selectedIds.length > 1) {
    return (
      <div className="fixed right-4 top-4 w-64 bg-white p-4 rounded-lg shadow-md border border-gray-200 flex flex-col gap-4">
        <h3 className="font-bold border-b pb-2">Properties</h3>
        <p className="text-gray-500">{selectedIds.length} shapes selected</p>
        <button 
          onClick={() => selectedIds.forEach(id => deleteShape(id))}
          className="bg-red-50 text-red-600 px-4 py-2 rounded hover:bg-red-100 mt-2"
        >
          Delete All
        </button>
      </div>
    );
  }

  const selectedShape = shapes.find((s) => s.id === selectedIds[0]);

  if (!selectedShape) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateShape(selectedShape.id, { [name]: Number(value) });
  };

  return (
    <div className="fixed right-4 top-4 w-64 bg-white p-4 rounded-lg shadow-md border border-gray-200 flex flex-col gap-4">
      <h3 className="font-bold border-b pb-2">Properties</h3>
      
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm">X</label>
        <input 
          type="number" 
          name="x" 
          value={Math.round(selectedShape.x)} 
          onChange={handleChange} 
          className="border rounded px-2 py-1"
        />

        <label className="text-sm">Y</label>
        <input 
          type="number" 
          name="y" 
          value={Math.round(selectedShape.y)} 
          onChange={handleChange} 
          className="border rounded px-2 py-1"
        />

        <label className="text-sm">Rotation</label>
        <input 
          type="number" 
          name="rotation" 
          value={Math.round(selectedShape.rotation)} 
          onChange={handleChange} 
          className="border rounded px-2 py-1"
        />
      </div>

      {selectedShape.type === 'rect' && (
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm">Width</label>
          <input 
            type="number" 
            name="width" 
            value={Math.round(selectedShape.width || 0)} 
            onChange={handleChange} 
            className="border rounded px-2 py-1"
          />
          <label className="text-sm">Height</label>
          <input 
            type="number" 
            name="height" 
            value={Math.round(selectedShape.height || 0)} 
            onChange={handleChange} 
            className="border rounded px-2 py-1"
          />
        </div>
      )}

      {selectedShape.type === 'circle' && (
        <div className="grid grid-cols-2 gap-2">
           <label className="text-sm">Radius</label>
           <input 
            type="number" 
            name="radius" 
            value={Math.round(selectedShape.radius || 0)} 
            onChange={handleChange} 
            className="border rounded px-2 py-1"
          />
        </div>
      )}

      <button 
        onClick={() => deleteShape(selectedShape.id)}
        className="bg-red-50 text-red-600 px-4 py-2 rounded hover:bg-red-100 mt-2"
      >
        Delete
      </button>
    </div>
  );
};
