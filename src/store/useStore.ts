import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type ShapeType = 'rectangle' | 'circle' | 'segment' | 'line' | 'triangle' | 'polygon' | 'angle' | 'arc';

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
  /** For arc shapes: start angle in degrees */
  startAngle?: number;
  /** For arc shapes: sweep angle in degrees (can be negative for clockwise) */
  sweepAngle?: number;
  /** Group ID - shapes with same groupId move and select together */
  groupId?: string;
  /** For arc shapes: attachment info for center point */
  centerAttachment?: {
    targetShapeId: string;
    attachType: 'vertex' | 'midpoint' | 'circumcenter' | 'incenter' | 'centroid' | 'orthocenter' | 'intersection';
    targetIndex: number;
    /** For intersection attachments: the other shape involved (arc or edge-containing shape) */
    secondaryShapeId?: string;
    /** For intersection attachments: which intersection point (0 or 1, since line-arc can have 2 intersections) */
    intersectionIndex?: number;
  };
}

export type ToolType = 'select' | 'rectangle' | 'circle' | 'segment' | 'line' | 'triangle' | 'polygon' | 'angle' | 'compass' | 'eraser' | 'trim' | 'point' | 'zoom';

/** Viewport state for zoom/pan */
export interface ViewportState {
  scale: number;
  x: number;
  y: number;
}

/** Drag state for multi-selection event broadcasting */
export interface DragState {
  /** Whether a drag is in progress */
  isDragging: boolean;
  /** ID of the shape that initiated the drag */
  initiatorId: string | null;
  /** Starting position when drag began */
  startPoint: { x: number; y: number } | null;
  /** Current drag position */
  currentPoint: { x: number; y: number } | null;
  /** Starting positions of all selected shapes when drag began */
  startPositions: Map<string, { x: number; y: number }>;
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
  /** Drag state for multi-selection event broadcasting */
  dragState: DragState;
  
  setTool: (tool: ToolType) => void;
  setVertexEditMode: (enabled: boolean) => void;
  addShape: (shape: Omit<Shape, 'id'>) => void;
  updateShape: (id: string, attrs: Partial<Shape>) => void;
  /** Update multiple shapes at once (for multi-selection move) */
  updateShapes: (updates: Array<{ id: string; attrs: Partial<Shape> }>) => void;
  /** Move all selected shapes by a delta */
  moveSelectedShapes: (deltaX: number, deltaY: number) => void;
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
  /** Start dragging - records starting positions of all selected shapes */
  startDrag: (initiatorId: string, startPoint: { x: number; y: number }) => void;
  /** Update drag position - shapes will read this and move themselves */
  updateDrag: (currentPoint: { x: number; y: number }) => void;
  /** End dragging */
  endDrag: () => void;
}

const DEFAULT_VIEWPORT: ViewportState = { scale: 1, x: 0, y: 0 };
const DEFAULT_DRAG_STATE: DragState = {
  isDragging: false,
  initiatorId: null,
  startPoint: null,
  currentPoint: null,
  startPositions: new Map(),
};

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
  dragState: DEFAULT_DRAG_STATE,

  setTool: (tool) => set({ tool, selectedIds: [], selectedVertexIndices: {}, vertexEditMode: false }),
  setVertexEditMode: (enabled) => set({ vertexEditMode: enabled }),
  addShape: (shape) => set((state) => ({ 
    shapes: [...state.shapes, { ...shape, id: uuidv4() }] 
  })),
  updateShape: (id, attrs) => set((state) => ({
    shapes: state.shapes.map((s) => (s.id === id ? { ...s, ...attrs } : s))
  })),
  updateShapes: (updates) => set((state) => {
    const updateMap = new Map(updates.map(u => [u.id, u.attrs]));
    return {
      shapes: state.shapes.map((s) => {
        const attrs = updateMap.get(s.id);
        return attrs ? { ...s, ...attrs } : s;
      })
    };
  }),
  moveSelectedShapes: (deltaX, deltaY) => set((state) => ({
    shapes: state.shapes.map((s) => 
      state.selectedIds.includes(s.id) 
        ? { ...s, x: s.x + deltaX, y: s.y + deltaY }
        : s
    )
  })),
  selectShape: (id) => set((state) => {
    if (id === null) {
      return { selectedIds: [], selectedVertexIndices: {}, vertexEditMode: false };
    }
    
    const ids = Array.isArray(id) ? id : [id];
    
    // Expand selection to include all shapes with the same groupId
    const groupIds = new Set<string>();
    ids.forEach(shapeId => {
      const shape = state.shapes.find(s => s.id === shapeId);
      if (shape?.groupId) {
        groupIds.add(shape.groupId);
      }
    });
    
    // Add all shapes with matching groupIds to selection
    const expandedIds = new Set(ids);
    if (groupIds.size > 0) {
      state.shapes.forEach(s => {
        if (s.groupId && groupIds.has(s.groupId)) {
          expandedIds.add(s.id);
        }
      });
    }
    
    return {
      selectedIds: Array.from(expandedIds),
      selectedVertexIndices: {},
      vertexEditMode: true,
    };
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
  
  // Drag state management for multi-selection
  startDrag: (initiatorId, startPoint) => {
    const state = get();
    // Only track multi-selection drag
    if (state.selectedIds.length <= 1) {
      set({ dragState: DEFAULT_DRAG_STATE });
      return;
    }
    
    // Record starting positions of all selected shapes
    const startPositions = new Map<string, { x: number; y: number }>();
    state.selectedIds.forEach(id => {
      const shape = state.shapes.find(s => s.id === id);
      if (shape) {
        startPositions.set(id, { x: shape.x, y: shape.y });
      }
    });
    
    set({
      dragState: {
        isDragging: true,
        initiatorId,
        startPoint,
        currentPoint: startPoint,
        startPositions,
      }
    });
  },
  
  updateDrag: (currentPoint) => {
    set((state) => ({
      dragState: {
        ...state.dragState,
        currentPoint,
      }
    }));
  },
  
  endDrag: () => {
    set({ dragState: DEFAULT_DRAG_STATE });
  },
}));
