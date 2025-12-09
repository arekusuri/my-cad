import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type ShapeType = 'rect' | 'circle' | 'segment' | 'triangle' | 'polygon';

export interface AttachedPoint {
  id: string;
  shapeId: string;
  /** 'vertex' for shape vertices, 'midpoint' for edge midpoints */
  attachType: 'vertex' | 'midpoint';
  /** Index of the vertex or edge (for midpoint, it's the edge between vertex[index] and vertex[index+1]) */
  index: number;
}

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

export type ToolType = 'select' | 'rect' | 'circle' | 'segment' | 'triangle' | 'polygon' | 'eraser' | 'trim' | 'point';

interface StoreState {
  shapes: Shape[];
  attachedPoints: AttachedPoint[];
  selectedIds: string[];
  selectedVertexIndices: Record<string, number[]>; // shapeId -> array of vertex indices
  vertexEditMode: boolean;
  tool: ToolType;
  isShiftPressed: boolean;
  isAltPressed: boolean;
  
  setTool: (tool: ToolType) => void;
  setVertexEditMode: (enabled: boolean) => void;
  addShape: (shape: Omit<Shape, 'id'>) => void;
  updateShape: (id: string, attrs: Partial<Shape>) => void;
  selectShape: (id: string | string[] | null) => void;
  selectVertices: (indices: Record<string, number[]>) => void;
  deleteShape: (id: string) => void;
  addAttachedPoint: (point: Omit<AttachedPoint, 'id'>) => void;
  removeAttachedPoint: (id: string) => void;
  setShiftPressed: (pressed: boolean) => void;
  setAltPressed: (pressed: boolean) => void;
}

export const useStore = create<StoreState>((set) => ({
  shapes: [],
  attachedPoints: [],
  selectedIds: [],
  selectedVertexIndices: {},
  vertexEditMode: false,
  tool: 'select',
  isShiftPressed: false,
  isAltPressed: false,

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
    vertexEditMode: id !== null, // Directly enter vertex edit mode when selecting
  }),
  selectVertices: (indices) => set({ selectedVertexIndices: indices }),
  deleteShape: (id) => set((state) => ({
    shapes: state.shapes.filter((s) => s.id !== id),
    selectedIds: state.selectedIds.filter((sid) => sid !== id),
    selectedVertexIndices: { ...state.selectedVertexIndices, [id]: [] },
    // Also remove attached points for this shape
    attachedPoints: state.attachedPoints.filter((p) => p.shapeId !== id),
  })),
  addAttachedPoint: (point) => set((state) => ({
    attachedPoints: [...state.attachedPoints, { ...point, id: uuidv4() }]
  })),
  removeAttachedPoint: (id) => set((state) => ({
    attachedPoints: state.attachedPoints.filter((p) => p.id !== id)
  })),
  setShiftPressed: (pressed) => set({ isShiftPressed: pressed }),
  setAltPressed: (pressed) => set({ isAltPressed: pressed }),
}));
