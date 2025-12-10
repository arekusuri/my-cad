import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type ShapeType = 'rectangle' | 'circle' | 'segment' | 'line' | 'triangle' | 'polygon';

export interface AttachedPoint {
  id: string;
  shapeId: string;
  /** Type of attachment point: vertex, midpoint, or special shape points like circumcenter */
  attachType: 'vertex' | 'midpoint' | 'circumcenter' | 'incenter' | 'centroid' | 'orthocenter';
  /** Index of the vertex or edge (for midpoint, it's the edge between vertex[index] and vertex[index+1]) */
  index: number;
}

/** Tracks segment endpoint attachment to another shape's vertex/midpoint */
export interface SegmentAttachment {
  id: string;
  /** The segment being attached */
  segmentId: string;
  /** Which endpoint: 0 = start, 1 = end */
  endpoint: 0 | 1;
  /** The shape this endpoint is attached to */
  targetShapeId: string;
  /** Type of attachment point */
  attachType: 'vertex' | 'midpoint' | 'circumcenter' | 'incenter' | 'centroid' | 'orthocenter' | 'perpendicular';
  /** Index of the vertex or midpoint on target shape */
  targetIndex: number;
}

export type LineType = 'solid' | 'dashed' | 'dotted' | 'dashdot';

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
  showCircumcenter?: boolean;
  showOrthocenter?: boolean;
  showCentroid?: boolean;
  lineType?: LineType;
}

export type ToolType = 'select' | 'rectangle' | 'circle' | 'segment' | 'line' | 'triangle' | 'polygon' | 'eraser' | 'trim' | 'point' | 'zoom';

/** Viewport state for zoom/pan */
export interface ViewportState {
  scale: number;
  x: number;
  y: number;
}

interface StoreState {
  shapes: Shape[];
  attachedPoints: AttachedPoint[];
  segmentAttachments: SegmentAttachment[];
  selectedIds: string[];
  selectedVertexIndices: Record<string, number[]>; // shapeId -> array of vertex indices
  vertexEditMode: boolean;
  tool: ToolType;
  isShiftPressed: boolean;
  isAltPressed: boolean;
  /** Current viewport (zoom/pan state) */
  viewport: ViewportState;
  /** Whether we are currently zoomed in (not at default view) */
  isZoomed: boolean;
  
  setTool: (tool: ToolType) => void;
  setVertexEditMode: (enabled: boolean) => void;
  addShape: (shape: Omit<Shape, 'id'>) => void;
  updateShape: (id: string, attrs: Partial<Shape>) => void;
  selectShape: (id: string | string[] | null) => void;
  selectVertices: (indices: Record<string, number[]>) => void;
  deleteShape: (id: string) => void;
  addAttachedPoint: (point: Omit<AttachedPoint, 'id'>) => void;
  removeAttachedPoint: (id: string) => void;
  addSegmentAttachment: (attachment: Omit<SegmentAttachment, 'id'>) => void;
  removeSegmentAttachment: (id: string) => void;
  getSegmentAttachments: (segmentId: string) => SegmentAttachment[];
  setShiftPressed: (pressed: boolean) => void;
  setAltPressed: (pressed: boolean) => void;
  /** Set viewport (zoom to specific area) */
  setViewport: (viewport: ViewportState) => void;
  /** Reset viewport to default (show whole grid) */
  resetViewport: () => void;
}

const DEFAULT_VIEWPORT: ViewportState = { scale: 1, x: 0, y: 0 };

export const useStore = create<StoreState>((set, get) => ({
  shapes: [],
  attachedPoints: [],
  segmentAttachments: [],
  selectedIds: [],
  selectedVertexIndices: {},
  vertexEditMode: false,
  tool: 'select',
  isShiftPressed: false,
  isAltPressed: false,
  viewport: DEFAULT_VIEWPORT,
  isZoomed: false,

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
    // Remove segment attachments where this shape is the segment or target
    segmentAttachments: state.segmentAttachments.filter(
      (a) => a.segmentId !== id && a.targetShapeId !== id
    ),
  })),
  addAttachedPoint: (point) => set((state) => ({
    attachedPoints: [...state.attachedPoints, { ...point, id: uuidv4() }]
  })),
  removeAttachedPoint: (id) => set((state) => ({
    attachedPoints: state.attachedPoints.filter((p) => p.id !== id)
  })),
  addSegmentAttachment: (attachment) => set((state) => ({
    segmentAttachments: [...state.segmentAttachments, { ...attachment, id: uuidv4() }]
  })),
  removeSegmentAttachment: (id) => set((state) => ({
    segmentAttachments: state.segmentAttachments.filter((a) => a.id !== id)
  })),
  getSegmentAttachments: (segmentId) => {
    return get().segmentAttachments.filter((a) => a.segmentId === segmentId);
  },
  setShiftPressed: (pressed) => set({ isShiftPressed: pressed }),
  setAltPressed: (pressed) => set({ isAltPressed: pressed }),
  setViewport: (viewport) => set({ viewport, isZoomed: true }),
  resetViewport: () => set({ viewport: DEFAULT_VIEWPORT, isZoomed: false, tool: 'select' }),
}));
