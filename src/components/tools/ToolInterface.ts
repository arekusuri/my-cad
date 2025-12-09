import type { Shape, AttachedPoint, ToolType } from '../../store/useStore';
import type { SnapPoint } from '../modes/AutoSnappingMode';

export interface ToolEvent {
  pos: { x: number; y: number };
  screenPos: { x: number; y: number };
  shiftKey: boolean;
  altKey: boolean;
  button: number;
  /** The raw event target for checking if clicked on stage */
  target: unknown;
  /** Get the stage from target */
  getStage: () => unknown;
}

export interface ToolResult {
  handled: boolean;
}

/** Vertex being dragged */
export interface DraggingVertex {
  shapeId: string;
  index: number;
  startX: number;
  startY: number;
}

export interface ToolContext {
  tool: ToolType;
  shapes: Shape[];
  selectedIds: string[];
  attachedPoints: AttachedPoint[];
  hoveredSnapPoint: SnapPoint | null;
  draggingVertex: DraggingVertex | null;
  
  // Actions
  updateShape: (id: string, attrs: Partial<Shape>) => void;
  addShape: (shape: Omit<Shape, 'id'>) => void;
  deleteShape: (id: string) => void;
  selectShape: (id: string | string[] | null) => void;
  addAttachedPoint: (point: Omit<AttachedPoint, 'id'>) => void;
  snapToGrid: (val: number) => number;
  setHoveredSnapPoint: (point: SnapPoint | null) => void;
  
  // Selection box handlers
  startSelectionBox: (x: number, y: number) => void;
  updateSelectionBox: (x: number, y: number) => boolean;
  completeSelectionBox: () => boolean;
  
  // Vertex drag handlers
  startDrag: (snapPoint: SnapPoint, shapes: Shape[]) => void;
  endDrag: () => void;
  
  // Zoom handlers
  startZoomBox: (x: number, y: number) => void;
  updateZoomBox: (x: number, y: number) => boolean;
  completeZoomBox: () => boolean;
  
  // Drawing tools delegation
  drawingTools: {
    handleMouseDown: (event: { x: number; y: number; shiftKey: boolean; altKey: boolean; button: number }) => { handled: boolean };
    handleMouseMove: (event: { x: number; y: number; shiftKey: boolean; altKey: boolean; button: number }) => { handled: boolean };
    handleMouseUp: (event: { x: number; y: number; shiftKey: boolean; altKey: boolean; button: number }) => { handled: boolean };
  };
}

/**
 * Base interface for all tools.
 * Each tool should implement this interface.
 */
export interface Tool {
  /** Tool type(s) this handler is for */
  readonly toolTypes: readonly ToolType[];
  
  /** CSS cursor class for this tool */
  readonly cursorClass: string;
  
  /** Handle mouse down event. Return { handled: true } to stop event propagation */
  handleMouseDown(event: ToolEvent, context: ToolContext): ToolResult;
  
  /** Handle mouse move event. Return { handled: true } to stop event propagation */
  handleMouseMove(event: ToolEvent, context: ToolContext): ToolResult;
  
  /** Handle mouse up event. Return { handled: true } to stop event propagation */
  handleMouseUp(event: ToolEvent, context: ToolContext): ToolResult;
}

/**
 * No-op result for tools that don't handle an event
 */
export const NOT_HANDLED: ToolResult = { handled: false };

/**
 * Result for tools that handled an event
 */
export const HANDLED: ToolResult = { handled: true };

