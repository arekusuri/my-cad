import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type ShapeType = 'rect' | 'circle' | 'segment' | 'triangle' | 'polygon';

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
  selectedVertexIndices: Record<string, number[]>; // shapeId -> array of vertex indices
  vertexEditMode: boolean;
  tool: 'select' | 'rect' | 'circle' | 'segment' | 'triangle' | 'polygon' | 'eraser' | 'trim';
  isShiftPressed: boolean;
  
  setTool: (tool: 'select' | 'rect' | 'circle' | 'segment' | 'triangle' | 'polygon' | 'eraser' | 'trim') => void;
  setVertexEditMode: (enabled: boolean) => void;
  addShape: (shape: Omit<Shape, 'id'>) => void;
  updateShape: (id: string, attrs: Partial<Shape>) => void;
  selectShape: (id: string | string[] | null) => void;
  selectVertices: (indices: Record<string, number[]>) => void;
  deleteShape: (id: string) => void;
  setShiftPressed: (pressed: boolean) => void;
}

export const useStore = create<StoreState>((set) => ({
  shapes: [],
  selectedIds: [],
  selectedVertexIndices: {},
  vertexEditMode: false,
  tool: 'select',
  isShiftPressed: false,

  setTool: (tool) => set({ tool, selectedIds: [], selectedVertexIndices: {}, vertexEditMode: false }),
  setVertexEditMode: (enabled) => set({ vertexEditMode: enabled }),
  addShape: (shape) => set((state) => ({ 
    shapes: [...state.shapes, { ...shape, id: uuidv4() }] 
  })),
  updateShape: (id, attrs) => set((state) => ({
    shapes: state.shapes.map((s) => (s.id === id ? { ...s, ...attrs } : s))
  })),
  selectShape: (id) => set({ 
    selectedIds: id === null ? [] : Array.isArray(id) ? id : [id],
    selectedVertexIndices: {}, // Clear vertex selection when shape selection changes
    vertexEditMode: false,
  }),
  selectVertices: (indices) => set({ selectedVertexIndices: indices }),
  deleteShape: (id) => set((state) => ({
    shapes: state.shapes.filter((s) => s.id !== id),
    selectedIds: state.selectedIds.filter((sid) => sid !== id),
    selectedVertexIndices: { ...state.selectedVertexIndices, [id]: [] }
  })),
  setShiftPressed: (pressed) => set({ isShiftPressed: pressed }),
}));
