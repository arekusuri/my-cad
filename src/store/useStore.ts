import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type ShapeType = 'rect' | 'circle' | 'line' | 'polygon';

export interface Shape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  stroke: string;
  fill?: string;
  rotation: number;
}

interface StoreState {
  shapes: Shape[];
  selectedIds: string[];
  tool: 'select' | 'rect' | 'circle' | 'line' | 'polygon' | 'eraser' | 'trim';
  isShiftPressed: boolean;
  
  setTool: (tool: 'select' | 'rect' | 'circle' | 'line' | 'polygon' | 'eraser' | 'trim') => void;
  addShape: (shape: Omit<Shape, 'id'>) => void;
  updateShape: (id: string, attrs: Partial<Shape>) => void;
  selectShape: (id: string | string[] | null) => void;
  deleteShape: (id: string) => void;
  setShiftPressed: (pressed: boolean) => void;
}

export const useStore = create<StoreState>((set) => ({
  shapes: [],
  selectedIds: [],
  tool: 'select',
  isShiftPressed: false,

  setTool: (tool) => set({ tool, selectedIds: [] }),
  addShape: (shape) => set((state) => ({ 
    shapes: [...state.shapes, { ...shape, id: uuidv4() }] 
  })),
  updateShape: (id, attrs) => set((state) => ({
    shapes: state.shapes.map((s) => (s.id === id ? { ...s, ...attrs } : s))
  })),
  selectShape: (id) => set({ 
    selectedIds: id === null ? [] : Array.isArray(id) ? id : [id] 
  }),
  deleteShape: (id) => set((state) => ({
    shapes: state.shapes.filter((s) => s.id !== id),
    selectedIds: state.selectedIds.filter((sid) => sid !== id)
  })),
  setShiftPressed: (pressed) => set({ isShiftPressed: pressed }),
}));
