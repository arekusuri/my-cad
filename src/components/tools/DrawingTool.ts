import { useStore, type Shape, type SegmentAttachment } from '../../store/useStore';
import type { Point } from '../../utils/geometry';
import { findLineIntersections } from '../../utils/geometry';

/** Full snap point info including the shape and point type */
export interface SnapPointInfo {
    x: number;
    y: number;
    shapeId: string;
    type: 'vertex' | 'midpoint' | 'circumcenter' | 'incenter' | 'centroid' | 'orthocenter' | 'perpendicular' | 'intersection';
    index: number;
    /** For intersection attachments: the secondary shape involved (edge-containing shape) */
    secondaryShapeId?: string;
    /** For intersection attachments: which intersection point (0 or 1) */
    intersectionIndex?: number;
}

/**
 * Context passed to drawing tools with canvas utilities
 */
export interface DrawingContext {
    /** Snap value to grid */
    snapToGrid: (val: number) => number;
    /** Find snap point on other shapes (vertices/midpoints) - returns just coordinates */
    findSnapPoint: (x: number, y: number, excludeShapeId?: string | null) => Point | null;
    /** Find snap point with full info (shape id, type, index) */
    findSnapPointInfo: (x: number, y: number, excludeShapeId?: string | null) => SnapPointInfo | null;
    /** Find intersection points between a line and all shape edges */
    findLineIntersections: (lineStart: Point, lineEnd: Point, excludeShapeId?: string | null) => Point[];
    /** Add shape to store */
    addShape: (shape: Omit<Shape, 'id'>) => void;
    /** Update existing shape */
    updateShape: (id: string, attrs: Partial<Shape>) => void;
    /** Delete shape */
    deleteShape: (id: string) => void;
    /** Get current shapes */
    getShapes: () => Shape[];
    /** Add segment attachment */
    addSegmentAttachment: (attachment: Omit<SegmentAttachment, 'id'>) => void;
}

/**
 * Mouse event info passed to drawing tools
 */
export interface DrawingMouseEvent {
    x: number;
    y: number;
    shiftKey: boolean;
    altKey: boolean;
    button: number;
}

/**
 * Result from drawing tool handlers
 */
export interface DrawingResult {
    /** If true, event was handled and canvas should not process further */
    handled: boolean;
    /** If true, drawing is complete */
    finished?: boolean;
}

/**
 * Interface for drawing tools
 * Each shape type implements this to handle its own drawing logic
 */
export interface DrawingTool {
    /** Tool name for identification */
    readonly name: string;
    
    /** Whether this tool is currently drawing */
    isDrawing: boolean;
    
    /** Handle mouse down - start drawing or place point */
    handleMouseDown(e: DrawingMouseEvent, ctx: DrawingContext): DrawingResult;
    
    /** Handle mouse move - update preview/size */
    handleMouseMove(e: DrawingMouseEvent, ctx: DrawingContext): DrawingResult;
    
    /** Handle mouse up - finish drawing */
    handleMouseUp(e: DrawingMouseEvent, ctx: DrawingContext): DrawingResult;
    
    /** Cancel current drawing operation */
    cancel(): void;
    
    /** Get preview data for rendering (tool-specific) */
    getPreviewData(): unknown;
}

/**
 * Base class for drag-based drawing tools (rect, circle, polygon)
 * These tools work by: click->drag->release
 */
export abstract class DragDrawingTool implements DrawingTool {
    abstract readonly name: string;
    
    protected startX: number = 0;
    protected startY: number = 0;
    protected currentShapeId: string | null = null;
    isDrawing: boolean = false;
    
    handleMouseDown(e: DrawingMouseEvent, ctx: DrawingContext): DrawingResult {
        if (e.button !== 0) return { handled: false };
        
        let x = e.x;
        let y = e.y;
        
        // Apply snapping if Alt is pressed
        if (e.altKey) {
            const vertexSnap = ctx.findSnapPoint(x, y);
            if (vertexSnap) {
                x = vertexSnap.x;
                y = vertexSnap.y;
            } else {
                x = ctx.snapToGrid(x);
                y = ctx.snapToGrid(y);
            }
        }
        
        this.startX = x;
        this.startY = y;
        
        // Create initial shape
        const shape = this.createInitialShape(x, y);
        ctx.addShape(shape);
        
        // Get the ID of newly added shape
        const shapes = ctx.getShapes();
        const newShape = shapes[shapes.length - 1];
        if (newShape) {
            this.currentShapeId = newShape.id;
            this.isDrawing = true;
        }
        
        return { handled: true };
    }
    
    handleMouseMove(e: DrawingMouseEvent, ctx: DrawingContext): DrawingResult {
        if (!this.isDrawing || !this.currentShapeId) {
            return { handled: false };
        }
        
        let x = e.x;
        let y = e.y;
        
        // Apply snapping if Alt is pressed
        if (e.altKey) {
            const vertexSnap = ctx.findSnapPoint(x, y, this.currentShapeId);
            if (vertexSnap) {
                x = vertexSnap.x;
                y = vertexSnap.y;
            } else {
                x = ctx.snapToGrid(x);
                y = ctx.snapToGrid(y);
            }
        }
        
        // Calculate and apply shape update
        const updates = this.calculateShapeUpdate(x, y, e.shiftKey);
        ctx.updateShape(this.currentShapeId, updates);
        
        return { handled: true };
    }
    
    handleMouseUp(_e: DrawingMouseEvent, ctx: DrawingContext): DrawingResult {
        if (!this.isDrawing || !this.currentShapeId) {
            return { handled: false };
        }
        
        // Check if shape is too small and should be deleted
        const shapes = ctx.getShapes();
        const shape = shapes.find(s => s.id === this.currentShapeId);
        
        if (shape && this.isShapeTooSmall(shape)) {
            ctx.deleteShape(shape.id);
        }
        
        this.finish();
        return { handled: true, finished: true };
    }
    
    cancel(): void {
        if (this.currentShapeId) {
            // Shape should be deleted by the caller if needed
            this.currentShapeId = null;
        }
        this.finish();
    }
    
    protected finish(): void {
        this.isDrawing = false;
        this.currentShapeId = null;
    }
    
    getPreviewData(): { shapeId: string | null } {
        return { shapeId: this.currentShapeId };
    }
    
    /** Create the initial shape at the given position */
    protected abstract createInitialShape(x: number, y: number): Omit<Shape, 'id'>;
    
    /** Calculate shape updates based on current mouse position */
    protected abstract calculateShapeUpdate(x: number, y: number, isShiftPressed: boolean): Partial<Shape>;
    
    /** Check if shape is too small to keep */
    protected abstract isShapeTooSmall(shape: Shape): boolean;
}

/**
 * Helper to create drawing context from store
 */
export function createDrawingContext(
    snapToGrid: (val: number) => number,
    findSnapPoint: (x: number, y: number, excludeShapeId?: string | null) => Point | null,
    findSnapPointInfo?: (x: number, y: number, excludeShapeId?: string | null) => SnapPointInfo | null
): DrawingContext {
    const store = useStore.getState();
    return {
        snapToGrid,
        findSnapPoint,
        findSnapPointInfo: findSnapPointInfo || (() => null),
        findLineIntersections: (lineStart: Point, lineEnd: Point, excludeShapeId?: string | null) => {
            const shapes = useStore.getState().shapes;
            return findLineIntersections(lineStart, lineEnd, shapes, excludeShapeId);
        },
        addShape: store.addShape,
        updateShape: store.updateShape,
        deleteShape: store.deleteShape,
        getShapes: () => useStore.getState().shapes,
        addSegmentAttachment: store.addSegmentAttachment,
    };
}
