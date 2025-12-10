import { useRef, useMemo, useCallback, useSyncExternalStore } from 'react';
import { useStore } from '../../store/useStore';
import type { DrawingTool, DrawingContext, DrawingMouseEvent, SnapPointInfo } from './DrawingTool';
import { CircleDrawing } from '../shapes/circle/CircleDrawing';
import { RectDrawing } from '../shapes/rect/RectDrawing';
import { SegmentDrawing } from '../shapes/segment/SegmentDrawing';
import { PolygonDrawing } from '../shapes/polygon/PolygonDrawing';
import { TriangleDrawing, type TriangleDrawState } from '../shapes/triangle/TriangleDrawing';
import { type Point, findLineIntersections } from '../../utils/geometry';

interface UseDrawingToolsProps {
    snapToGrid: (val: number) => number;
    findSnapPoint: (x: number, y: number, excludeShapeId?: string | null) => Point | null;
    findSnapPointInfo: (x: number, y: number, excludeShapeId?: string | null) => SnapPointInfo | null;
}

// Store for triggering React re-renders when tool state changes
let listeners: Set<() => void> = new Set();
let version = 0;

function notifyListeners() {
    version++;
    listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot() {
    return version;
}

/**
 * Hook to manage drawing tools based on the current tool selection.
 * Returns handlers that delegate to the appropriate tool.
 */
export function useDrawingTools({ snapToGrid, findSnapPoint, findSnapPointInfo }: UseDrawingToolsProps) {
    const tool = useStore((state) => state.tool);
    const addShape = useStore((state) => state.addShape);
    const updateShape = useStore((state) => state.updateShape);
    const deleteShape = useStore((state) => state.deleteShape);
    const addSegmentAttachment = useStore((state) => state.addSegmentAttachment);
    
    // Create tool instances (persistent across renders)
    const toolsRef = useRef<Record<string, DrawingTool>>({
        circle: new CircleDrawing(),
        rect: new RectDrawing(),
        segment: new SegmentDrawing(),
        polygon: new PolygonDrawing(),
        triangle: new TriangleDrawing(),
    });
    
    // Subscribe to tool state changes for re-rendering
    useSyncExternalStore(subscribe, getSnapshot);
    
    // Get the active drawing tool (or null if current tool is not a drawing tool)
    const activeTool = useMemo(() => {
        return toolsRef.current[tool] || null;
    }, [tool]);
    
    // Create drawing context
    const createContext = useCallback((): DrawingContext => {
        return {
            snapToGrid,
            findSnapPoint,
            findSnapPointInfo,
            findLineIntersections: (lineStart: Point, lineEnd: Point, excludeShapeId?: string | null) => {
                const shapes = useStore.getState().shapes;
                return findLineIntersections(lineStart, lineEnd, shapes, excludeShapeId);
            },
            addShape,
            updateShape,
            deleteShape,
            getShapes: () => useStore.getState().shapes,
            addSegmentAttachment,
        };
    }, [snapToGrid, findSnapPoint, findSnapPointInfo, addShape, updateShape, deleteShape, addSegmentAttachment]);
    
    // Handle mouse down
    const handleMouseDown = useCallback((e: DrawingMouseEvent) => {
        if (!activeTool) return { handled: false };
        const ctx = createContext();
        const result = activeTool.handleMouseDown(e, ctx);
        if (result.handled) {
            notifyListeners(); // Trigger re-render for preview updates
        }
        return result;
    }, [activeTool, createContext]);
    
    // Handle mouse move
    const handleMouseMove = useCallback((e: DrawingMouseEvent) => {
        if (!activeTool) return { handled: false };
        const ctx = createContext();
        const result = activeTool.handleMouseMove(e, ctx);
        if (result.handled) {
            notifyListeners(); // Trigger re-render for preview updates
        }
        return result;
    }, [activeTool, createContext]);
    
    // Handle mouse up
    const handleMouseUp = useCallback((e: DrawingMouseEvent) => {
        if (!activeTool) return { handled: false };
        const ctx = createContext();
        const result = activeTool.handleMouseUp(e, ctx);
        if (result.handled) {
            notifyListeners(); // Trigger re-render for preview updates
        }
        return result;
    }, [activeTool, createContext]);
    
    // Cancel current drawing
    const cancel = useCallback(() => {
        if (activeTool) {
            activeTool.cancel();
            notifyListeners();
        }
    }, [activeTool]);
    
    // Get triangle preview data (only when triangle tool is active)
    const getTrianglePreview = useCallback((): { drawState: TriangleDrawState | null; previewPoint: { x: number; y: number } | null } => {
        const triangleTool = toolsRef.current['triangle'] as TriangleDrawing;
        return triangleTool.getPreviewData();
    }, []);
    
    // Get segment start point (for perpendicular foot calculation)
    const getSegmentStartPoint = useCallback((): { x: number; y: number } | null => {
        const segmentTool = toolsRef.current['segment'] as SegmentDrawing;
        return segmentTool.getStartPoint();
    }, []);
    
    return {
        /** The currently active drawing tool (null if tool is not a shape tool) */
        activeTool,
        /** Whether a drawing tool is currently active and drawing */
        isDrawing: activeTool?.isDrawing || false,
        /** Handle mouse down event */
        handleMouseDown,
        /** Handle mouse move event */
        handleMouseMove,
        /** Handle mouse up event */
        handleMouseUp,
        /** Cancel current drawing operation */
        cancel,
        /** Get triangle preview data for rendering */
        getTrianglePreview,
        /** Get segment start point (for perpendicular snap) */
        getSegmentStartPoint,
    };
}
