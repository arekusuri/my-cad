import React, { useState, useCallback, useEffect } from 'react';
import { Stage, Layer, Circle as KonvaCircle, Line } from 'react-konva';
import { useStore, type Shape, type AttachedPoint } from '../store/useStore';
import { ShapeObj } from './ShapeObj';
import Konva from 'konva';
import { getShapeVertices, getShapeMidpoints, type Point } from '../utils/geometry';
import { getShapeSpecialSnapPoints } from '../utils/shapeSnapPoints';
import { registerAllShapeSnapPoints } from '../utils/shapeSnapPointsSetup';
import { SnapPointHighlight, useVertexDrag, type SnapPoint } from './modes/AutoSnappingMode';
import { OrthoAxesOverlay } from './modes/OrthoMode.tsx';
import { useZoomMode, ZoomBoxOverlay } from './modes/ZoomMode';
import { useSelectionMode, SelectionBoxOverlay } from './modes/SelectionMode';
import { useDrawingTools } from './tools/useDrawingTools';
import type { SnapPointInfo } from './tools/DrawingTool';
import { TrianglePreview, getTriangleAttachedPoints, updateTriangleAttachedSegments, calculatePerpendicularFoot, getPerpendicularExtension, type EdgeExtensionInfo } from './shapes/triangle';
import { getPolygonAttachedPoints, updatePolygonAttachedSegments } from './shapes/polygon';
import { Grid } from './Grid';
import { handleTrim } from './tools/Trim';
import { toolManager } from './tools/ToolManager';
import type { ToolContext, ToolEvent } from './tools/ToolInterface';

// Register all shape special snap point providers
registerAllShapeSnapPoints();

const GRID_SIZE = 20;

export const Canvas: React.FC = () => {
  const { shapes, selectedIds, tool, addShape, updateShape, selectShape, deleteShape, attachedPoints, addAttachedPoint, segmentAttachments } = useStore();
  const isShiftPressed = useStore((state) => state.isShiftPressed);
  const setTool = useStore((state) => state.setTool);
  const [hoveredSnapPoint, setHoveredSnapPoint] = useState<SnapPoint | null>(null);
  
  // Zoom mode (encapsulated in ZoomMode)
  const { 
    viewport, 
    zoomBox,
    screenToWorld, 
    startZoomBox, 
    updateZoomBox, 
    completeZoomBox 
  } = useZoomMode({ onZoomComplete: () => setTool('select') });
  
  // Selection mode (encapsulated in SelectionMode)
  const {
    selectionBox,
    startSelectionBox,
    updateSelectionBox,
    completeSelectionBox,
  } = useSelectionMode({ shapes, selectedIds });
  
  // Vertex drag with Escape cancellation (encapsulated in AutoSnappingMode)
  const { draggingVertex, startDrag, endDrag } = useVertexDrag(updateShape);
  
  // Snap function
  const snapToGrid = useCallback((val: number) => Math.round(val / GRID_SIZE) * GRID_SIZE, []);

  // Find snap point (vertex of other shapes)
  const findSnapPoint = useCallback((x: number, y: number, excludeShapeId?: string | null): Point | null => {
      let closestPoint: Point | null = null;
      let minDist = 10; // Snap threshold

      shapes.forEach(shape => {
          if (excludeShapeId && shape.id === excludeShapeId) return;
          
          const vertices = getShapeVertices(shape);
          vertices.forEach(v => {
              const d = Math.sqrt(Math.pow(v.x - x, 2) + Math.pow(v.y - y, 2));
              if (d < minDist) {
                  minDist = d;
                  closestPoint = v;
              }
          });

          // Check midpoints
          const midpoints = getShapeMidpoints(shape);
          midpoints.forEach(m => {
              const d = Math.sqrt(Math.pow(m.x - x, 2) + Math.pow(m.y - y, 2));
              if (d < minDist) {
                  minDist = d;
                  closestPoint = m;
              }
          });

          // Check special snap points (circumcenter, etc.) via shape-specific providers
          const specialPoints = getShapeSpecialSnapPoints(shape);
          specialPoints.forEach(sp => {
              const d = Math.sqrt(Math.pow(sp.point.x - x, 2) + Math.pow(sp.point.y - y, 2));
              if (d < minDist) {
                  minDist = d;
                  closestPoint = sp.point;
              }
          });
      });

      return closestPoint;
  }, [shapes]);

  // Drawing tools (encapsulated - handles all shapes: circle, rect, segment, polygon, triangle)
  // Note: We need drawingTools first to get segment start point for perpendicular snapping
  const drawingToolsRef = React.useRef<ReturnType<typeof useDrawingTools> | null>(null);
  
  // Find snap point with full info (for creating attachments)
  // Uses segment's start point (if drawing) for perpendicular calculation
  const findSnapPointInfo = useCallback((x: number, y: number, excludeShapeId?: string | null): SnapPointInfo | null => {
      let closest: SnapPointInfo | null = null;
      let minDist = 10; // Snap threshold
      
      // Get segment start point for perpendicular calculation (if currently drawing a segment)
      const segmentStartPoint = drawingToolsRef.current?.getSegmentStartPoint() ?? null;

      shapes.forEach(shape => {
          if (excludeShapeId && shape.id === excludeShapeId) return;
          
          const vertices = getShapeVertices(shape);
          vertices.forEach((v, i) => {
              const d = Math.sqrt(Math.pow(v.x - x, 2) + Math.pow(v.y - y, 2));
              if (d < minDist) {
                  minDist = d;
                  closest = { x: v.x, y: v.y, shapeId: shape.id, type: 'vertex', index: i };
              }
          });

          // Check midpoints
          const midpoints = getShapeMidpoints(shape);
          midpoints.forEach((m, i) => {
              const d = Math.sqrt(Math.pow(m.x - x, 2) + Math.pow(m.y - y, 2));
              if (d < minDist) {
                  minDist = d;
                  closest = { x: m.x, y: m.y, shapeId: shape.id, type: 'midpoint', index: i };
              }
          });

          // Check special snap points (circumcenter, etc.) via shape-specific providers
          const specialPoints = getShapeSpecialSnapPoints(shape);
          specialPoints.forEach(sp => {
              const d = Math.sqrt(Math.pow(sp.point.x - x, 2) + Math.pow(sp.point.y - y, 2));
              if (d < minDist) {
                  minDist = d;
                  closest = { x: sp.point.x, y: sp.point.y, shapeId: shape.id, type: sp.type, index: sp.index };
              }
          });

          // Check perpendicular feet on triangle edges (or their extensions)
          // ONLY offer perpendicular snaps when we have a valid segment start point
          // This ensures consistency between snap preview and final attachment position
          if (shape.type === 'triangle' && vertices.length === 3 && segmentStartPoint) {
              for (let i = 0; i < 3; i++) {
                  const edgeStart = vertices[i];
                  const edgeEnd = vertices[(i + 1) % 3];
                  
                  // Calculate perpendicular foot from the segment's FIRST POINT
                  // Allow feet on edge extensions too (they will show dashed extension lines)
                  const { foot } = calculatePerpendicularFoot(segmentStartPoint, edgeStart, edgeEnd);
                  
                  // Check if mouse is near the calculated foot
                  const d = Math.sqrt(Math.pow(foot.x - x, 2) + Math.pow(foot.y - y, 2));
                  if (d < minDist) {
                      minDist = d;
                      closest = { x: foot.x, y: foot.y, shapeId: shape.id, type: 'perpendicular', index: i };
                  }
              }
          }
      });

      return closest;
  }, [shapes]);

  const drawingTools = useDrawingTools({ snapToGrid, findSnapPoint, findSnapPointInfo });
  
  // Update ref after render (for use in findSnapPointInfo callback)
  useEffect(() => {
    drawingToolsRef.current = drawingTools;
  });

  // Handle Escape key to cancel drawing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawingTools.isDrawing) {
        drawingTools.cancel();
        useStore.getState().setTool('select');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawingTools]);

  // Apply segment attachments when shapes move
  // Uses attachment logic from TriangleAttachment and PolygonAttachment
  const prevShapesRef = React.useRef<string>('');
  
  useEffect(() => {
    if (segmentAttachments.length === 0) return;
    
    // Create a signature of all target shapes' positions to detect changes
    const targetShapeIds = new Set(segmentAttachments.map(a => a.targetShapeId));
    const currentSignature = Array.from(targetShapeIds)
      .map(id => {
        const shape = shapes.find(s => s.id === id);
        if (!shape) return '';
        // Include x, y, rotation, and points for vertex-based shapes
        const pointsStr = shape.points ? shape.points.join(',') : '';
        return `${id}:${shape.x}:${shape.y}:${shape.rotation}:${pointsStr}`;
      })
      .join('|');
    
    // Only update if something changed
    if (currentSignature !== prevShapesRef.current) {
      // Collect all segment updates from triangles and polygons
      const allUpdates: Record<string, Partial<Shape>> = {};
      
      shapes.forEach(shape => {
        let updates: Record<string, Partial<Shape>> = {};
        if (shape.type === 'triangle') {
          updates = updateTriangleAttachedSegments(shape, shapes, segmentAttachments);
        } else if (shape.type === 'polygon') {
          updates = updatePolygonAttachedSegments(shape, shapes, segmentAttachments);
        }
        Object.assign(allUpdates, updates);
      });
      
      // Apply updates to segments (only if there are actual changes)
      Object.entries(allUpdates).forEach(([segmentId, attrs]) => {
        const segment = shapes.find(s => s.id === segmentId);
        if (segment) {
          // Only update if position actually changed
          const needsUpdate = 
            attrs.x !== segment.x || 
            attrs.y !== segment.y ||
            JSON.stringify(attrs.points) !== JSON.stringify(segment.points);
          if (needsUpdate) {
            updateShape(segmentId, attrs);
          }
        }
      });
      
      prevShapesRef.current = currentSignature;
    }
  }, [shapes, segmentAttachments, updateShape]);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only allow left click for drawing/selecting
    if (e.evt.button !== 0) return;

    // Get position (screen coordinates)
    const stage = e.target.getStage();
    const screenPos = stage?.getPointerPosition();
    if (!screenPos) return;
    
    // Convert to world coordinates for most operations
    const pos = screenToWorld(screenPos.x, screenPos.y);

    // Create tool context and event
    const toolContext: ToolContext = {
      tool,
      shapes,
      selectedIds,
      attachedPoints,
      hoveredSnapPoint,
      draggingVertex,
      updateShape,
      addShape,
      deleteShape,
      selectShape,
      addAttachedPoint,
      snapToGrid,
      setHoveredSnapPoint,
      startSelectionBox,
      updateSelectionBox,
      completeSelectionBox,
      startDrag,
      endDrag,
      startZoomBox,
      updateZoomBox,
      completeZoomBox,
      drawingTools
    };
    const toolEvent: ToolEvent = {
      pos,
      screenPos,
      shiftKey: e.evt.shiftKey,
      altKey: e.evt.altKey,
      button: e.evt.button,
      target: e.target,
      getStage: () => e.target.getStage()
    };

    // Dispatch to tool manager - it handles everything
    toolManager.handleMouseDown(toolEvent, toolContext);
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const screenPos = stage?.getPointerPosition();
    if (!screenPos) return;
    
    // Convert to world coordinates
    const pos = screenToWorld(screenPos.x, screenPos.y);

    // Create tool context and event
    const toolContext: ToolContext = {
      tool,
      shapes,
      selectedIds,
      attachedPoints,
      hoveredSnapPoint,
      draggingVertex,
      updateShape,
      addShape,
      deleteShape,
      selectShape,
      addAttachedPoint,
      snapToGrid,
      setHoveredSnapPoint,
      startSelectionBox,
      updateSelectionBox,
      completeSelectionBox,
      startDrag,
      endDrag,
      startZoomBox,
      updateZoomBox,
      completeZoomBox,
      drawingTools
    };
    const toolEvent: ToolEvent = {
      pos,
      screenPos,
      shiftKey: e.evt.shiftKey,
      altKey: e.evt.altKey,
      button: e.evt.button,
      target: e.target,
      getStage: () => e.target.getStage()
    };

    // Dispatch to tool manager - it handles everything
    toolManager.handleMouseMove(toolEvent, toolContext);
  };

  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Get position
    const stage = e.target.getStage();
    const screenPos = stage?.getPointerPosition();
    if (!screenPos) return;
    const pos = screenToWorld(screenPos.x, screenPos.y);

    // Create tool context and event
    const toolContext: ToolContext = {
      tool,
      shapes,
      selectedIds,
      attachedPoints,
      hoveredSnapPoint,
      draggingVertex,
      updateShape,
      addShape,
      deleteShape,
      selectShape,
      addAttachedPoint,
      snapToGrid,
      setHoveredSnapPoint,
      startSelectionBox,
      updateSelectionBox,
      completeSelectionBox,
      startDrag,
      endDrag,
      startZoomBox,
      updateZoomBox,
      completeZoomBox,
      drawingTools
    };
    const toolEvent: ToolEvent = {
      pos,
      screenPos,
      shiftKey: e.evt.shiftKey,
      altKey: e.evt.altKey,
      button: e.evt.button,
      target: e.target,
      getStage: () => e.target.getStage()
    };

    // Dispatch to tool manager - it handles everything
    toolManager.handleMouseUp(toolEvent, toolContext);
  };

  const handleContextMenu = (e: Konva.KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault(); // Prevent default browser context menu
      
      // If right-clicking on empty area, switch to select tool
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
          useStore.getState().setTool('select');
          return;
      }
  };

  const handleDblClick = () => {
      // No special double-click behavior needed
  };

  // handleTrim removed - using Trim tool

  // Get triangle preview data
  const trianglePreview = drawingTools.getTrianglePreview();

  // Calculate all attached point positions for rendering
  const getAttachedPointsToRender = useCallback(() => {
    const pointsToRender: Array<{ point: AttachedPoint; position: Point }> = [];
    
    shapes.forEach(shape => {
      if (shape.type === 'triangle') {
        const trianglePoints = getTriangleAttachedPoints(shape, attachedPoints);
        pointsToRender.push(...trianglePoints);
      } else if (shape.type === 'polygon') {
        const polygonPoints = getPolygonAttachedPoints(shape, attachedPoints);
        pointsToRender.push(...polygonPoints);
      }
    });
    
    return pointsToRender;
  }, [shapes, attachedPoints]);
  
  const attachedPointsToRender = getAttachedPointsToRender();

  // Calculate extension lines for perpendicular attachments
  const getExtensionLinesToRender = useCallback(() => {
    const extensions: EdgeExtensionInfo[] = [];
    
    segmentAttachments.forEach(attachment => {
      if (attachment.attachType !== 'perpendicular') return;
      
      const triangle = shapes.find(s => s.id === attachment.targetShapeId);
      const segment = shapes.find(s => s.id === attachment.segmentId);
      if (!triangle || !segment || segment.type !== 'segment' || !segment.points) return;
      
      // Get the reference point (the other endpoint of the segment)
      const otherEndpointIndex = attachment.endpoint === 0 ? 1 : 0;
      const referencePoint = {
        x: segment.x + segment.points[otherEndpointIndex * 2],
        y: segment.y + segment.points[otherEndpointIndex * 2 + 1]
      };
      
      const extension = getPerpendicularExtension(triangle, attachment.targetIndex, referencePoint);
      if (extension) {
        extensions.push(extension);
      }
    });
    
    return extensions;
  }, [shapes, segmentAttachments]);
  
  const extensionLinesToRender = getExtensionLinesToRender();

  // Get cursor style from tool manager
  const cursorClass = toolManager.getCursor(tool);

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
      onDblClick={handleDblClick}
      className={`bg-gray-50 ${cursorClass}`}
    >
      {/* Main layer with viewport transformation */}
      <Layer
        x={viewport.x}
        y={viewport.y}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
      >
        <Grid viewport={viewport} />
        {shapes.map((shape) => (
          <ShapeObj
            key={shape.id}
            shape={shape}
            isSelected={selectedIds.includes(shape.id)}
            onSelect={() => {
              selectShape(shape.id);
            }}
            onChange={(newAttrs) => updateShape(shape.id, newAttrs)}
            onTrim={(e) => {
                const stage = e.target.getStage();
                const screenPos = stage?.getPointerPosition();
                if (screenPos) {
                   const pos = screenToWorld(screenPos.x, screenPos.y);
                   handleTrim(shape.id, pos.x, pos.y, shapes, addShape, deleteShape);
                }
            }}
          />
        ))}
        <SelectionBoxOverlay selectionBox={selectionBox} viewportScale={viewport.scale} />
        {/* Ortho Mode Axes - show when shift is held and object is selected */}
        <OrthoAxesOverlay 
            isShiftPressed={isShiftPressed} 
            selectedIds={selectedIds} 
            tool={tool} 
            shapes={shapes} 
            viewportScale={viewport.scale} 
        />
        <SnapPointHighlight hoveredSnapPoint={hoveredSnapPoint} viewportScale={viewport.scale} />
        {/* Triangle tool preview */}
        <TrianglePreview drawState={trianglePreview.drawState} previewPoint={trianglePreview.previewPoint} />
        {/* Render attached points */}
        {attachedPointsToRender.map(({ point, position }) => (
          <KonvaCircle
            key={point.id}
            x={position.x}
            y={position.y}
            radius={5 / viewport.scale}
            fill="black"
            stroke="black"
            strokeWidth={1 / viewport.scale}
            listening={false}
          />
        ))}
        {/* Render edge extension lines (dashed) for perpendicular feet outside edges */}
        {extensionLinesToRender.map((ext, idx) => (
          <Line
            key={`ext-${idx}`}
            points={[ext.from.x, ext.from.y, ext.to.x, ext.to.y]}
            stroke="#666"
            strokeWidth={1 / viewport.scale}
            dash={[6 / viewport.scale, 4 / viewport.scale]}
            listening={false}
          />
        ))}
      </Layer>
      {/* UI Layer - no transformation (screen coordinates) */}
      <Layer>
        <ZoomBoxOverlay zoomBox={zoomBox} />
      </Layer>
    </Stage>
  );
};
