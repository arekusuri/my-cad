import React, { useState, useCallback, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle as KonvaCircle } from 'react-konva';
import { useStore, type Shape, type AttachedPoint } from '../store/useStore';
import { ShapeObj } from './ShapeObj';
import Konva from 'konva';
import { getLineIntersection, distance, getRectLines, isShapeInRect, doesShapeIntersectRect, getShapeVertices, getShapeMidpoints, type Point } from '../utils/geometry';
import { SnapPointHighlight, findClosestSnapPoint, handleVertexDrag, useVertexDrag, type SnapPoint } from './modes/AutoSnappingMode';
import { constrainLineToOrtho, constrainToAxis } from './modes/OrthoMode';
import { useDrawingTools } from './tools/useDrawingTools';
import type { SnapPointInfo } from './tools/DrawingTool';
import { TrianglePreview, getTriangleAttachedPoints, hasTriangleAttachedPointAt, updateTriangleAttachedSegments } from './shapes/triangle';
import { getPolygonAttachedPoints, hasPolygonAttachedPointAt, updatePolygonAttachedSegments } from './shapes/polygon';

const GRID_SIZE = 20;

export const Canvas: React.FC = () => {
  const { shapes, selectedIds, tool, addShape, updateShape, selectShape, deleteShape, selectVertices, attachedPoints, addAttachedPoint, segmentAttachments } = useStore();
  const isShiftPressed = useStore((state) => state.isShiftPressed);
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const [hoveredSnapPoint, setHoveredSnapPoint] = useState<SnapPoint | null>(null);
  
  // Vertex drag with Escape cancellation (encapsulated in AutoSnappingMode)
  const { draggingVertex, startDrag, endDrag } = useVertexDrag(updateShape);
  
  // Calculate selected shape center for ortho axes
  const getSelectedShapeCenter = (): { x: number; y: number } | null => {
    if (selectedIds.length === 0) return null;
    
    let totalX = 0;
    let totalY = 0;
    let count = 0;
    
    selectedIds.forEach(id => {
      const shape = shapes.find(s => s.id === id);
      if (shape) {
        totalX += shape.x;
        totalY += shape.y;
        count++;
      }
    });
    
    if (count === 0) return null;
    return { x: totalX / count, y: totalY / count };
  };

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
  const prevShapesRef = React.useRef<Record<string, { x: number; y: number; rotation: number }>>({});
  
  useEffect(() => {
    if (segmentAttachments.length === 0) return;
    
    // Check if any target shapes have moved
    const targetShapeIds = new Set(segmentAttachments.map(a => a.targetShapeId));
    let needsUpdate = false;
    
    for (const shapeId of targetShapeIds) {
      const shape = shapes.find(s => s.id === shapeId);
      if (!shape) continue;
      
      const prev = prevShapesRef.current[shapeId];
      if (!prev || prev.x !== shape.x || prev.y !== shape.y || prev.rotation !== shape.rotation) {
        needsUpdate = true;
        break;
      }
    }
    
    if (needsUpdate) {
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
      
      // Apply updates to segments
      Object.entries(allUpdates).forEach(([segmentId, attrs]) => {
        updateShape(segmentId, attrs);
      });
    }
    
    // Update prev shapes ref
    const newPrev: Record<string, { x: number; y: number; rotation: number }> = {};
    shapes.forEach(s => {
      newPrev[s.id] = { x: s.x, y: s.y, rotation: s.rotation };
    });
    prevShapesRef.current = newPrev;
  }, [shapes, segmentAttachments, updateShape]);

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only allow left click for drawing/selecting
    if (e.evt.button !== 0) return;

    // Get position
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;

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
        if (pos) {
            setSelectionBox({
                startX: pos.x,
                startY: pos.y,
                currentX: pos.x,
                currentY: pos.y
            });
        }
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
    const pos = stage?.getPointerPosition();
    if (!pos) return;

    // 1. Vertex Dragging (Select Mode)
    if (draggingVertex && tool === 'select') {
        const mouseX = pos.x;
        const mouseY = pos.y;
        
        const isSnappingEnabled = e.evt.altKey;
        const isOrthoEnabled = e.evt.shiftKey;
        
        let newX = mouseX;
        let newY = mouseY;
        
        // Check if we're dragging a segment vertex
        const draggedShape = shapes.find(s => s.id === draggingVertex.shapeId);
        const isSegmentVertex = draggedShape?.type === 'segment';
        
        // For segments with ortho: make segment H/V (handled in handleVertexDrag)
        // For other shapes: constrain movement to axis
        if (isOrthoEnabled && !isSegmentVertex) {
            const constrained = constrainToAxis(
                { x: draggingVertex.startX, y: draggingVertex.startY },
                { x: mouseX, y: mouseY }
            );
            newX = constrained.x;
            newY = constrained.y;
        }
        
        // Then apply grid snapping if enabled
        if (isSnappingEnabled) {
             newX = snapToGrid(newX);
             newY = snapToGrid(newY);
        }

        // Pass isOrthoEnabled for line H/V constraint
        handleVertexDrag(draggingVertex, newX, newY, shapes, updateShape, isOrthoEnabled);
        
        // Calculate actual highlight position (for segments with ortho, compute constrained position)
        let highlightX = newX;
        let highlightY = newY;
        if (isOrthoEnabled && isSegmentVertex && draggedShape?.points && draggedShape.points.length === 4) {
            const idx = draggingVertex.index;
            const otherIndex = idx === 0 ? 1 : 0;
            const otherAbsX = draggedShape.x + draggedShape.points[otherIndex * 2];
            const otherAbsY = draggedShape.y + draggedShape.points[otherIndex * 2 + 1];
            const constrained = constrainLineToOrtho(otherAbsX, otherAbsY, newX, newY);
            highlightX = constrained.endX;
            highlightY = constrained.endY;
        }
             
         // Update the visual highlight position to follow the mouse
         setHoveredSnapPoint({
             shapeId: draggingVertex.shapeId,
             index: draggingVertex.index,
             x: highlightX,
             y: highlightY,
             type: 'vertex'
         });
        return;
    }

    if (selectionBox) {
        setSelectionBox(prev => prev ? ({ ...prev, currentX: pos.x, currentY: pos.y }) : null);
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

    // Delegate to drawing tools
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (pos) {
      const drawingEvent = {
        x: pos.x,
        y: pos.y,
        shiftKey: e.evt.shiftKey,
        altKey: e.evt.altKey,
        button: e.evt.button,
      };
      drawingTools.handleMouseUp(drawingEvent);
    }

    if (selectionBox) {
        const { startX, startY, currentX, currentY } = selectionBox;
        const isWindowSelection = currentY > startY; // Down -> Window (Blue)
        
        const rect = {
            x: Math.min(startX, currentX),
            y: Math.min(startY, currentY),
            width: Math.abs(currentX - startX),
            height: Math.abs(currentY - startY)
        };

        if (rect.width > 2 && rect.height > 2) {
            // Check for vertex selection first if we have selected shapes
            const newSelectedVertices: Record<string, number[]> = {};
            let foundVertices = false;

            selectedIds.forEach(id => {
                const shape = shapes.find(s => s.id === id);
                if (!shape || shape.type !== 'segment' || !shape.points) return;

                const indices: number[] = [];
                const rad = (shape.rotation * Math.PI) / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);

                for (let i = 0; i < shape.points.length / 2; i++) {
                    const px = shape.points[i * 2];
                    const py = shape.points[i * 2 + 1];
                    const absX = shape.x + px * cos - py * sin;
                    const absY = shape.y + px * sin + py * cos;

                    // Check if point is inside selection rect
                    if (absX >= rect.x && absX <= rect.x + rect.width &&
                        absY >= rect.y && absY <= rect.y + rect.height) {
                        indices.push(i);
                    }
                }

                if (indices.length > 0) {
                    newSelectedVertices[id] = indices;
                    foundVertices = true;
                }
            });

            if (foundVertices) {
                selectVertices(newSelectedVertices);
            } else {
                // Normal shape selection
                const idsToSelect: string[] = [];
                shapes.forEach(shape => {
                    let match = false;
                    if (isWindowSelection) {
                        match = isShapeInRect(shape, rect);
                    } else {
                        match = doesShapeIntersectRect(shape, rect);
                    }
                    
                    if (match) {
                        idsToSelect.push(shape.id);
                    }
                });
                
                if (idsToSelect.length > 0) {
                        selectShape(idsToSelect);
                } else {
                        selectShape(null); // Deselect if nothing found
                }
            }
        }
        setSelectionBox(null);
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

  const handleTrim = (targetId: string, clickX: number, clickY: number) => {
      const targetShape = shapes.find(s => s.id === targetId);
      if (!targetShape || targetShape.type !== 'segment') {
          // Can only trim segments for now
          return;
      }

      const p1 = { x: targetShape.x + (targetShape.points?.[0] || 0), y: targetShape.y + (targetShape.points?.[1] || 0) };
      const p2 = { x: targetShape.x + (targetShape.points?.[2] || 0), y: targetShape.y + (targetShape.points?.[3] || 0) };

      // Find all intersections with other shapes
      const intersections: { t: number, point: { x: number, y: number } }[] = [];

      shapes.forEach(other => {
          if (other.id === targetId) return;

          const otherLines: { p1: { x: number, y: number }, p2: { x: number, y: number } }[] = [];

          if (other.type === 'segment') {
              otherLines.push({
                  p1: { x: other.x + (other.points?.[0] || 0), y: other.y + (other.points?.[1] || 0) },
                  p2: { x: other.x + (other.points?.[2] || 0), y: other.y + (other.points?.[3] || 0) }
              });
          } else if (other.type === 'rect') {
             // Convert rect to 4 lines
             const rectLines = getRectLines(other.x, other.y, other.width || 0, other.height || 0, other.rotation);
             rectLines.forEach(l => {
                 otherLines.push({ p1: l[0], p2: l[1] });
             });
          }
          // Circle intersection unimplemented for now

          otherLines.forEach(line => {
              const intersection = getLineIntersection(p1, p2, line.p1, line.p2);
              if (intersection) {
                  // Calculate t (0 to 1) along target line
                  // t = distance(p1, intersection) / distance(p1, p2)
                  const distTotal = distance(p1, p2);
                  const distInt = distance(p1, intersection);
                  const t = distInt / distTotal;
                  
                  intersections.push({ t, point: intersection });
              }
          });
      });

      // Sort intersections by t
      intersections.sort((a, b) => a.t - b.t);

      // Create segments (0 -> t1, t1 -> t2, ... tn -> 1)
      const ts = [0, ...intersections.map(i => i.t), 1];
      
      // Find which segment was clicked
      const lineLen = distance(p1, p2);
      if (lineLen === 0) return;
      
      const vx = p2.x - p1.x;
      const vy = p2.y - p1.y;
      
      const ux = clickX - p1.x;
      const uy = clickY - p1.y;

      const tClick = (ux * vx + uy * vy) / (lineLen * lineLen);

      let removeIndex = -1;
      for (let i = 0; i < ts.length - 1; i++) {
          if (tClick >= ts[i] && tClick <= ts[i+1]) {
              removeIndex = i;
              break;
          }
      }

      if (removeIndex === -1) return;

      if (intersections.length === 0) {
          deleteShape(targetId);
          return;
      }

      const segmentsToCreate: Shape[] = [];
      
      if (removeIndex > 0) {
          const startPt = p1;
          const endPt = intersections[removeIndex - 1].point; 
          
          segmentsToCreate.push({
              id: '', 
              type: 'segment',
              x: startPt.x,
              y: startPt.y,
              points: [0, 0, endPt.x - startPt.x, endPt.y - startPt.y],
              stroke: targetShape.stroke,
              rotation: 0
          });
      }

      if (removeIndex < ts.length - 2) {
          const startPt = intersections[removeIndex].point;
          const endPt = p2;
          
          segmentsToCreate.push({
              id: '',
              type: 'segment',
              x: startPt.x,
              y: startPt.y,
              points: [0, 0, endPt.x - startPt.x, endPt.y - startPt.y],
              stroke: targetShape.stroke,
              rotation: 0
          });
      }

      deleteShape(targetId);
      segmentsToCreate.forEach(l => addShape(l));
  };

  // Grid generation
  const renderGrid = () => {
    const lines = [];
    const width = window.innerWidth;
    const height = window.innerHeight;

    for (let i = 0; i < width / GRID_SIZE; i++) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i * GRID_SIZE, 0, i * GRID_SIZE, height]}
          stroke="#e5e7eb"
          strokeWidth={1}
        />
      );
    }
    for (let j = 0; j < height / GRID_SIZE; j++) {
      lines.push(
        <Line
          key={`h-${j}`}
          points={[0, j * GRID_SIZE, width, j * GRID_SIZE]}
          stroke="#e5e7eb"
          strokeWidth={1}
        />
      );
    }
    return lines;
  };

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

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
      onDblClick={handleDblClick}
      className={`bg-gray-50 ${tool === 'select' ? 'cursor-pointer' : tool === 'trim' || tool === 'eraser' ? 'cursor-cell' : tool === 'point' ? 'cursor-pointer' : 'cursor-crosshair'}`}
    >
      <Layer>
        {renderGrid()}
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
                const pos = stage?.getPointerPosition();
                if (pos) {
                   handleTrim(shape.id, pos.x, pos.y);
                }
            }}
          />
        ))}
        {selectionBox && (
            <Rect
                x={Math.min(selectionBox.startX, selectionBox.currentX)}
                y={Math.min(selectionBox.startY, selectionBox.currentY)}
                width={Math.abs(selectionBox.currentX - selectionBox.startX)}
                height={Math.abs(selectionBox.currentY - selectionBox.startY)}
                fill={selectionBox.currentY > selectionBox.startY ? 'rgba(0, 0, 255, 0.1)' : 'rgba(0, 255, 0, 0.1)'}
                stroke={selectionBox.currentY > selectionBox.startY ? 'blue' : 'green'}
                dash={[5, 5]}
            />
        )}
        {/* Ortho Mode Axes - show when shift is held and object is selected */}
        {isShiftPressed && selectedIds.length > 0 && tool === 'select' && (() => {
          const center = getSelectedShapeCenter();
          if (!center) return null;
          const screenWidth = window.innerWidth;
          const screenHeight = window.innerHeight;
          return (
            <>
              {/* Horizontal axis (X) - Red */}
              <Line
                points={[0, center.y, screenWidth, center.y]}
                stroke="rgba(255, 0, 0, 0.5)"
                strokeWidth={1}
                dash={[10, 5]}
                listening={false}
              />
              {/* Vertical axis (Y) - Green */}
              <Line
                points={[center.x, 0, center.x, screenHeight]}
                stroke="rgba(0, 200, 0, 0.5)"
                strokeWidth={1}
                dash={[10, 5]}
                listening={false}
              />
            </>
          );
        })()}
        <SnapPointHighlight hoveredSnapPoint={hoveredSnapPoint} />
        {/* Triangle tool preview */}
        <TrianglePreview drawState={trianglePreview.drawState} previewPoint={trianglePreview.previewPoint} />
        {/* Render attached points */}
        {attachedPointsToRender.map(({ point, position }) => (
          <KonvaCircle
            key={point.id}
            x={position.x}
            y={position.y}
            radius={5}
            fill="black"
            stroke="black"
            strokeWidth={1}
            listening={false}
          />
        ))}
      </Layer>
    </Stage>
  );
};
