import { useRef, useMemo, useCallback, useSyncExternalStore } from 'react';
import { useStore } from '../../store/useStore';
import type { DrawingTool, DrawingContext, DrawingMouseEvent, SnapPointInfo } from './DrawingTool';
import { CircleDrawing } from '../shapes/circle/CircleDrawing';
import { RectangleDrawing } from '../shapes/rectangle/RectangleDrawing';
import { SegmentDrawing, LineDrawing } from '../shapes/segment';
import { PolygonDrawing } from '../shapes/polygon/PolygonDrawing';
import { TriangleDrawing, type TriangleDrawState } from '../shapes/triangle/TriangleDrawing';
import { AngleDrawing, type AngleDrawState } from '../shapes/angle/AngleDrawing';
import { CompassDrawing, type CompassDrawState } from '../shapes/arc/CompassDrawing';
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
        rectangle: new RectangleDrawing(),
        segment: new SegmentDrawing(),
        line: new LineDrawing(),
        polygon: new PolygonDrawing(),
        triangle: new TriangleDrawing(),
        angle: new AngleDrawing(),
        compass: new CompassDrawing(),
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
    
    // Get angle preview data (only when angle tool is active)
    const getAnglePreview = useCallback((): { drawState: AngleDrawState | null; previewPoint: { x: number; y: number } | null } => {
        const angleTool = toolsRef.current['angle'] as AngleDrawing;
        return angleTool.getPreviewData();
    }, []);
    
    // Get compass preview data (only when compass tool is active)
    const getCompassPreview = useCallback((): { drawState: CompassDrawState | null; previewPoint: { x: number; y: number } | null } => {
        const compassTool = toolsRef.current['compass'] as CompassDrawing;
        return compassTool.getPreviewData();
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
        /** Get angle preview data for rendering */
        getAnglePreview,
        /** Get compass preview data for rendering */
        getCompassPreview,
        /** Get segment start point (for perpendicular snap) */
        getSegmentStartPoint,
    };
}
