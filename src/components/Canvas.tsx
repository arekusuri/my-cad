import React, { useState, useCallback, useEffect } from 'react';
import { Stage, Layer, Circle as KonvaCircle } from 'react-konva';
import { useStore, type Shape, type AttachedPoint } from '../store/useStore';
import { ShapeObj } from './ShapeObj';
import Konva from 'konva';
import { getShapeVertices, getShapeMidpoints, type Point } from '../utils/geometry';
import { SnapPointHighlight, findClosestSnapPoint, useVertexDrag, type SnapPoint } from './modes/AutoSnappingMode';
import { OrthoAxesOverlay } from './modes/OrthoMode.tsx';
import { useZoomMode, ZoomBoxOverlay } from './modes/ZoomMode';
import { useSelectionMode, SelectionBoxOverlay } from './modes/SelectionMode';
import { useDrawingTools } from './tools/useDrawingTools';
import type { SnapPointInfo } from './tools/DrawingTool';
import { TrianglePreview, getTriangleAttachedPoints, hasTriangleAttachedPointAt, updateTriangleAttachedSegments } from './shapes/triangle';
import { getCircumcenterPoint } from './shapes/triangle/TriangleCircumcenter';
import { getPolygonAttachedPoints, hasPolygonAttachedPointAt, updatePolygonAttachedSegments } from './shapes/polygon';
import { Grid } from './Grid';
import { handleTrim } from './tools/Trim';
import { handleDraggingVertex } from './tools/SelectTool';

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
    isZoomToolActive,
    screenToWorld, 
    startZoomBox, 
    updateZoomBox, 
    completeZoomBox 
  } = useZoomMode({ onZoomComplete: () => setTool('select') });
  
  // Selection mode (encapsulated in SelectionMode)
  const {
    selectionBox,
    isSelecting,
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

          // Check circumcenter
          if (shape.type === 'triangle' && shape.showCircumcenter) {
              const circumcenter = getCircumcenterPoint(shape);
              if (circumcenter) {
                  const d = Math.sqrt(Math.pow(circumcenter.x - x, 2) + Math.pow(circumcenter.y - y, 2));
                  if (d < minDist) {
                      minDist = d;
                      closestPoint = circumcenter;
                  }
              }
          }
      });

      return closestPoint;
  }, [shapes]);

  // Find snap point with full info (for creating attachments)
  const findSnapPointInfo = useCallback((x: number, y: number, excludeShapeId?: string | null): SnapPointInfo | null => {
      let closest: SnapPointInfo | null = null;
      let minDist = 10; // Snap threshold

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

          // Check circumcenter
          if (shape.type === 'triangle' && shape.showCircumcenter) {
              const circumcenter = getCircumcenterPoint(shape);
              if (circumcenter) {
                  const d = Math.sqrt(Math.pow(circumcenter.x - x, 2) + Math.pow(circumcenter.y - y, 2));
                  if (d < minDist) {
                      minDist = d;
                      closest = { x: circumcenter.x, y: circumcenter.y, shapeId: shape.id, type: 'circumcenter', index: 0 };
                  }
              }
          }
      });

      return closest;
  }, [shapes]);

  // Drawing tools (encapsulated - handles all shapes: circle, rect, segment, polygon, triangle)
  const drawingTools = useDrawingTools({ snapToGrid, findSnapPoint, findSnapPointInfo });

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

    // Handle zoom tool - start zoom selection box (use screen coords)
    if (isZoomToolActive) {
      startZoomBox(screenPos.x, screenPos.y);
      return;
    }

    // Handle point tool - add attached point on snap points
    if (tool === 'point') {
        const snapPoint = findClosestSnapPoint(pos, shapes);
        if (snapPoint) {
            const targetShape = shapes.find(s => s.id === snapPoint.shapeId);
            // Only allow attaching to triangles and polygons
            if (targetShape && (targetShape.type === 'triangle' || targetShape.type === 'polygon')) {
                // Check if point already exists at this location
                const hasExisting = targetShape.type === 'triangle'
                    ? hasTriangleAttachedPointAt(snapPoint.shapeId, snapPoint.type, snapPoint.index, attachedPoints)
                    : hasPolygonAttachedPointAt(snapPoint.shapeId, snapPoint.type, snapPoint.index, attachedPoints);
                
                if (!hasExisting) {
                    addAttachedPoint({
                        shapeId: snapPoint.shapeId,
                        attachType: snapPoint.type,
                        index: snapPoint.index,
                    });
                }
            }
        }
        return;
    }

    // Check if we are clicking a highlighted vertex to drag (but not in Alt mode - Alt is for snapping only)
    if (tool === 'select' && hoveredSnapPoint && hoveredSnapPoint.type === 'vertex' && !e.evt.altKey) {
        startDrag(hoveredSnapPoint, shapes);
        return;
    }

    // If clicking on stage (empty area)
    const clickedOnEmpty = e.target === e.target.getStage();
    
    if (clickedOnEmpty) {
      selectShape(null);
      
      if (tool === 'select') {
        startSelectionBox(pos.x, pos.y);
      }
    }

    // Delegate to drawing tools (all shapes including triangle)
    const drawingEvent = {
      x: pos.x,
      y: pos.y,
      shiftKey: e.evt.shiftKey,
      altKey: e.evt.altKey,
      button: e.evt.button,
    };
    
    const result = drawingTools.handleMouseDown(drawingEvent);
    if (result.handled) {
      return;
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const screenPos = stage?.getPointerPosition();
    if (!screenPos) return;
    
    // Convert to world coordinates
    const pos = screenToWorld(screenPos.x, screenPos.y);

    // Handle zoom box dragging (use screen coords)
    if (zoomBox) {
      updateZoomBox(screenPos.x, screenPos.y);
      return;
    }

    // 1. Vertex Dragging (Select Mode)
    if (draggingVertex && tool === 'select') {
        const handled = handleDraggingVertex({
            draggingVertex,
            tool,
            e,
            pos,
            shapes,
            updateShape,
            snapToGrid,
            setHoveredSnapPoint
        });
        
        if (handled) return;
    }

    if (isSelecting) {
        updateSelectionBox(pos.x, pos.y);
        return;
    }

    // Check for Alt key for highlighting and snapping
    const isSnappingEnabled = e.evt.altKey;

    // Snap Point Highlight - show during select mode or while drawing with Alt key
    // Also always show during point tool mode
    if (isSnappingEnabled || tool === 'point') {
        const closest = findClosestSnapPoint(pos, shapes);
        setHoveredSnapPoint(closest);
    } else {
        setHoveredSnapPoint(null);
    }

    // Delegate to drawing tools (all shapes including triangle)
    const drawingEvent = {
      x: pos.x,
      y: pos.y,
      shiftKey: e.evt.shiftKey,
      altKey: e.evt.altKey,
      button: e.evt.button,
    };
    
    const result = drawingTools.handleMouseMove(drawingEvent);
    if (result.handled) {
      return;
    }
  };

  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    endDrag(); // Stop dragging vertex (clears saved shape)

    // Handle zoom box completion
    if (zoomBox) {
      completeZoomBox();
      return;
    }

    // Delegate to drawing tools
    const stage = e.target.getStage();
    const screenPos = stage?.getPointerPosition();
    if (screenPos) {
      const pos = screenToWorld(screenPos.x, screenPos.y);
      const drawingEvent = {
        x: pos.x,
        y: pos.y,
        shiftKey: e.evt.shiftKey,
        altKey: e.evt.altKey,
        button: e.evt.button,
      };
      drawingTools.handleMouseUp(drawingEvent);
    }

    if (isSelecting) {
        completeSelectionBox();
    }
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

  // Get cursor style based on tool
  const getCursorClass = () => {
    if (tool === 'select') return 'cursor-pointer';
    if (tool === 'trim' || tool === 'eraser') return 'cursor-cell';
    if (tool === 'point') return 'cursor-pointer';
    if (tool === 'zoom') return 'cursor-zoom-in';
    return 'cursor-crosshair';
  };

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
      onDblClick={handleDblClick}
      className={`bg-gray-50 ${getCursorClass()}`}
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
      </Layer>
      {/* UI Layer - no transformation (screen coordinates) */}
      <Layer>
        <ZoomBoxOverlay zoomBox={zoomBox} />
      </Layer>
    </Stage>
  );
};
