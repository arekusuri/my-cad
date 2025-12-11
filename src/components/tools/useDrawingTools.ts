import React, { useRef, useMemo, useCallback, useSyncExternalStore } from 'react';
import { useStore } from '../../store/useStore';
import type { DrawingTool, DrawingContext, DrawingMouseEvent, SnapPointInfo } from './DrawingTool';
import { CircleDrawing } from '../shapes/circle/CircleDrawing';
import { RectangleDrawing } from '../shapes/rectangle/RectangleDrawing';
import { SegmentDrawing, LineDrawing } from '../shapes/segment';
import { PolygonDrawing } from '../shapes/polygon/PolygonDrawing';
import { TriangleDrawing } from '../shapes/triangle/TriangleDrawing';
import { TrianglePreview } from '../shapes/triangle/TrianglePreview';
import { AngleDrawing } from '../shapes/angle/AngleDrawing';
import { AnglePreview } from '../shapes/angle/AnglePreview';
import { CompassDrawing } from '../shapes/arc/CompassDrawing';
import { CompassPreview } from '../shapes/arc/CompassPreview';
import { FreehandDrawing } from '../shapes/freehand/FreehandDrawing';
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
        freehand: new FreehandDrawing(),
    });
    
    // Preview renderers for each tool (registered at init time)
    const previewsRef = useRef<Record<string, () => React.ReactNode>>({
        triangle: () => React.createElement(TrianglePreview, {
            getPreviewData: () => (toolsRef.current['triangle'] as TriangleDrawing).getPreviewData()
        }),
        angle: () => React.createElement(AnglePreview, {
            getPreviewData: () => (toolsRef.current['angle'] as AngleDrawing).getPreviewData()
        }),
        compass: () => React.createElement(CompassPreview, {
            getPreviewData: () => (toolsRef.current['compass'] as CompassDrawing).getPreviewData()
        }),
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
    
    // Get segment start point (for perpendicular foot calculation)
    const getSegmentStartPoint = useCallback((): { x: number; y: number } | null => {
        const segmentTool = toolsRef.current['segment'] as SegmentDrawing;
        return segmentTool.getStartPoint();
    }, []);
    
    // Render the preview for a tool type (uses pre-registered preview)
    const renderPreview = useCallback((toolType: string): React.ReactNode => {
        const previewFn = previewsRef.current[toolType];
        return previewFn ? previewFn() : null;
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
        /** Render the preview for a tool instance */
        renderPreview,
        /** Get segment start point (for perpendicular snap) */
        getSegmentStartPoint,
    };
}
