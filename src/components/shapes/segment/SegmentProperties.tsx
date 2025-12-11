import React from 'react';
import type { Shape, LineType } from '../../../store/useStore';
import { CommonProperties } from '../../lib/CommonProperties';

const LINE_TYPES: { value: LineType; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'dashdot', label: 'Dash-Dot' },
];

const COLORS: { value: string; label: string }[] = [
  { value: '#000000', label: 'Black' },
  { value: '#374151', label: 'Gray' },
  { value: '#ef4444', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#22c55e', label: 'Green' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
];

interface SegmentPropertiesProps {
  shape: Shape;
  updateShape: (id: string, attrs: Partial<Shape>) => void;
  deleteShape: (id: string) => void;
}

export const SegmentProperties: React.FC<SegmentPropertiesProps> = ({ shape, updateShape, deleteShape }) => {
  return (
    <div className="flex flex-col gap-2">
      <CommonProperties shape={shape} updateShape={updateShape} deleteShape={deleteShape} />
      
      {/* Color */}
      <div className="grid grid-cols-2 gap-1.5 items-center">
        <label className="text-xs text-gray-600">Color</label>
        <div className="flex items-center gap-1">
          <select
            value={shape.stroke}
            onChange={(e) => updateShape(shape.id, { stroke: e.target.value })}
            className="flex-1 border rounded px-1 py-0.5 text-xs"
          >
            {COLORS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <div 
            className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"
            style={{ backgroundColor: shape.stroke }}
          />
        </div>
      </div>
      
      {/* Line Type */}
      <div className="grid grid-cols-2 gap-1.5 items-center">
        <label className="text-xs text-gray-600">Line</label>
        <select
          value={shape.lineType || 'solid'}
          onChange={(e) => updateShape(shape.id, { lineType: e.target.value as LineType })}
          className="border rounded px-1 py-0.5 text-xs w-full"
        >
          {LINE_TYPES.map((lt) => (
            <option key={lt.value} value={lt.value}>
              {lt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
