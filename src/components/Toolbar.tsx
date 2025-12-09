import React from 'react';
import { useStore } from '../store/useStore';
import { MousePointer2, Square, Circle, Minus, Eraser, Scissors, Triangle, Hexagon } from 'lucide-react';

export const Toolbar: React.FC = () => {
  const tool = useStore((state) => state.tool);
  const setTool = useStore((state) => state.setTool);

  const tools = [
    { name: 'select', icon: MousePointer2 },
    { name: 'rect', icon: Square },
    { name: 'circle', icon: Circle },
    { name: 'triangle', icon: Triangle },
    { name: 'polygon', icon: Hexagon },
    { name: 'segment', icon: Minus },
    { name: 'trim', icon: Scissors },
    { name: 'eraser', icon: Eraser },
  ] as const;

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
    </div>
  );
};

