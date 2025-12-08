import React, { useState, useRef } from 'react';
import { Stage, Layer, Line, Rect } from 'react-konva';
import { useStore, type Shape } from '../store/useStore';
import { ShapeObj } from './ShapeObj';
import Konva from 'konva';
import { getLineIntersection, distance, getRectLines, isShapeInRect, doesShapeIntersectRect, getShapeVertices, getShapeMidpoints, type Point } from '../utils/geometry';
import { SelectModeVertexHighlight, findClosestSnapPoint, handleVertexDrag, type SnapPoint } from './modes/AutoSnappingMode';
import { constrainToSquare, constrainLineToOrtho, constrainToAxis } from './modes/OrthoMode';

const GRID_SIZE = 20;

export const Canvas: React.FC = () => {
  const { shapes, selectedIds, tool, addShape, updateShape, selectShape, deleteShape, selectVertices, setVertexEditMode } = useStore();
  const [isDrawing, setIsDrawing] = useState(false);
  const drawingShapeId = useRef<string | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const [hoveredSnapPoint, setHoveredSnapPoint] = useState<SnapPoint | null>(null);
  const [draggingVertex, setDraggingVertex] = useState<{ shapeId: string; index: number; startX: number; startY: number } | null>(null);
  
  // Snap function
  const snapToGrid = (val: number) => Math.round(val / GRID_SIZE) * GRID_SIZE;

  // Find snap point (vertex of other shapes)
  const findSnapPoint = (x: number, y: number, excludeShapeId?: string | null): Point | null => {
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
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only allow left click for drawing/selecting
    if (e.evt.button !== 0) return;

    // Check if we are clicking a highlighted vertex to drag
    if (tool === 'select' && hoveredSnapPoint && hoveredSnapPoint.type === 'vertex') {
        setDraggingVertex({ 
            shapeId: hoveredSnapPoint.shapeId, 
            index: hoveredSnapPoint.index,
            startX: hoveredSnapPoint.x,
            startY: hoveredSnapPoint.y
        });
        return;
    }

    // If clicking on stage (empty area)
    const clickedOnEmpty = e.target === e.target.getStage();
    
    if (clickedOnEmpty) {
      selectShape(null);
      
      if (tool === 'select') {
        const stage = e.target.getStage();
        const pos = stage?.getPointerPosition();
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

    if (tool !== 'rect' && tool !== 'circle' && tool !== 'line' && tool !== 'polygon' && tool !== 'triangle') return;

    // Start drawing
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;

    // Check for Alt key to enable snapping
    const isSnappingEnabled = e.evt.altKey;

    let x = pos.x;
    let y = pos.y;

    if (isSnappingEnabled) {
        x = snapToGrid(pos.x);
        y = snapToGrid(pos.y);

        // Check for vertex/midpoint snap for start point
        const vertexSnap = findSnapPoint(pos.x, pos.y);
        if (vertexSnap) {
            x = vertexSnap.x;
            y = vertexSnap.y;
        }
    }

    if (tool === 'polygon') {
      if (isDrawing && drawingShapeId.current) {
        // Continue drawing polygon
        const shape = useStore.getState().shapes.find(s => s.id === drawingShapeId.current);
        if (shape && shape.points) {
           const startX = shape.points[0];
           const startY = shape.points[1];
           
           const relativeX = x - shape.x;
           const relativeY = y - shape.y;

           // Check if clicked near start point to close
           if (shape.points.length >= 6 && Math.abs(relativeX - startX) < 10 && Math.abs(relativeY - startY) < 10) {
               // Close shape: remove the last moving point
               const newPoints = shape.points.slice(0, -2);
               updateShape(shape.id, { points: newPoints });
               setIsDrawing(false);
               drawingShapeId.current = null;
           } else {
               // Add new point (duplicate last point which is being moved)
               updateShape(shape.id, {
                   points: [...shape.points, relativeX, relativeY]
               });
           }
        }
        return;
      }
    }
    
    const newShapeBase = {
        x,
        y,
        stroke: 'black',
        rotation: 0,
    };

    if (tool === 'rect') {
      addShape({
        ...newShapeBase,
        type: 'rect',
        width: 0,
        height: 0,
      });
    } else if (tool === 'circle') {
      addShape({
        ...newShapeBase,
        type: 'circle',
        radius: 0,
      });
    } else if (tool === 'line') {
      addShape({
        ...newShapeBase,
        type: 'line',
        x, 
        y, 
        points: [0, 0, 0, 0], // Points relative to origin
      });
    } else if (tool === 'triangle') {
      addShape({
        ...newShapeBase,
        type: 'triangle',
        radius: 0,
      });
    }

    // Get the ID of the newly added shape
    const currentShapes = useStore.getState().shapes;
    const newShape = currentShapes[currentShapes.length - 1];
    if (newShape) {
        drawingShapeId.current = newShape.id;
        setIsDrawing(true);
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
        
        // Apply ortho constraint first (relative to start position)
        if (isOrthoEnabled) {
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

        handleVertexDrag(draggingVertex, newX, newY, shapes, updateShape);
             
         // Update the visual highlight position to follow the mouse
         setHoveredSnapPoint({
             shapeId: draggingVertex.shapeId,
             index: draggingVertex.index,
             x: newX,
             y: newY,
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

    // 2. Snap Point Highlight (Select Mode OR Drawing Mode)
    // In drawing mode (line, rect, etc), we still want to highlight vertices/midpoints to show snap targets
    if (isSnappingEnabled && ((tool === 'select' && !isDrawing) || (tool !== 'select' && !isDrawing))) {
        const closest = findClosestSnapPoint(pos, shapes);
        setHoveredSnapPoint(closest);
    } else {
        setHoveredSnapPoint(null);
    }

    // 3. Drawing Logic
    if (!isDrawing || !drawingShapeId.current) return;

    const currentShapes = useStore.getState().shapes;
    const shape = currentShapes.find(s => s.id === drawingShapeId.current);
    if (!shape) return;

    const currentX = pos.x; 
    const currentY = pos.y;
    
    // Snap logic: Check for vertex snap first
    let snapX = currentX;
    let snapY = currentY;
    
    if (isSnappingEnabled) {
        const vertexSnap = findSnapPoint(currentX, currentY, shape.id); // Don't snap to self
        if (vertexSnap) {
            snapX = vertexSnap.x;
            snapY = vertexSnap.y;
        } else {
            snapX = snapToGrid(currentX);
            snapY = snapToGrid(currentY);
        }
    }

    const isShift = e.evt.shiftKey;

    if (shape.type === 'rect') {
      let width = snapX - shape.x;
      let height = snapY - shape.y;

      if (isShift) {
        // Constrain to square using ortho mode
        const constrained = constrainToSquare(width, height);
        width = constrained.width;
        height = constrained.height;
      }

      updateShape(shape.id, {
        width,
        height,
      });
    } else if (shape.type === 'circle' || shape.type === 'triangle') {
      // For circle/triangle, constrain to axis means radius is measured along X or Y only
      if (isShift) {
          const constrained = constrainToAxis({ x: shape.x, y: shape.y }, { x: snapX, y: snapY });
          snapX = constrained.x;
          snapY = constrained.y;
      }
      
      const dx = snapX - shape.x;
      const dy = snapY - shape.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      
      updateShape(shape.id, {
        radius,
      });
    } else if (shape.type === 'line') {
      // Logic for Ortho mode
      let endX = snapX - shape.x;
      let endY = snapY - shape.y;

      if (isShift) {
          // Use ortho mode to constrain to H/V
          const constrained = constrainLineToOrtho(0, 0, endX, endY);
          endX = constrained.endX;
          endY = constrained.endY;
      } else {
          // Auto-snap to vertical/horizontal if close
          const angle = Math.atan2(endY, endX) * 180 / Math.PI;
          const absAngle = Math.abs(angle);
          const threshold = 5; // degrees

          // Horizontal: 0 or 180 (which is +/- 180)
          if (absAngle < threshold || Math.abs(absAngle - 180) < threshold) {
              endY = 0;
          }
          // Vertical: 90 or -90
          else if (Math.abs(absAngle - 90) < threshold) {
              endX = 0;
          }
      }

      updateShape(shape.id, {
        points: [0, 0, endX, endY],
      });
    } else if (shape.type === 'polygon') {
       let relativeX = snapX - shape.x;
       let relativeY = snapY - shape.y;
       
       // Apply ortho constraint for polygon drawing
       if (isShift && shape.points && shape.points.length >= 2) {
           // Get the previous point
           const prevX = shape.points[shape.points.length - 4] ?? 0;
           const prevY = shape.points[shape.points.length - 3] ?? 0;
           const constrained = constrainLineToOrtho(prevX, prevY, relativeX, relativeY);
           relativeX = constrained.endX;
           relativeY = constrained.endY;
       }
       
       const newPoints = [...(shape.points || [])];
       // Update last point
       if (newPoints.length >= 2) {
           newPoints[newPoints.length - 2] = relativeX;
           newPoints[newPoints.length - 1] = relativeY;
           updateShape(shape.id, { points: newPoints });
       }
    }
  };

  const handleMouseUp = () => {
    setDraggingVertex(null); // Stop dragging vertex

    if (isDrawing && drawingShapeId.current) {
        const shape = useStore.getState().shapes.find(s => s.id === drawingShapeId.current);
        if (shape) {
            // Check if shape is too small
            if (shape.type === 'line') {
                const points = shape.points || [0,0,0,0];
                if (Math.abs(points[2] - points[0]) < 1 && Math.abs(points[3] - points[1]) < 1) {
                    deleteShape(shape.id);
                }
            } else if (shape.type === 'rect') {
                if (Math.abs(shape.width || 0) < 1 || Math.abs(shape.height || 0) < 1) {
                    deleteShape(shape.id);
                }
            } else if (shape.type === 'circle' || shape.type === 'triangle') {
                if ((shape.radius || 0) < 1) {
                    deleteShape(shape.id);
                }
            }
        }
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
                if (!shape || (shape.type !== 'line' && shape.type !== 'polygon') || !shape.points) return;

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

    if (tool === 'polygon' && isDrawing) return; // Don't stop drawing polygon on mouse up

    setIsDrawing(false);
    drawingShapeId.current = null;
  };

  const handleContextMenu = (e: Konva.KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault(); // Prevent default browser context menu
      
      // If right-clicking on empty area, switch to select tool
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
          useStore.getState().setTool('select');
          return;
      }
      
      if (tool === 'polygon' && isDrawing && drawingShapeId.current) {
          const shape = useStore.getState().shapes.find(s => s.id === drawingShapeId.current);
          if (shape && shape.points) {
               // Remove the last moving point
               // Ensure we have enough points to form a polygon (at least 3 points: 6 coords)
               // But usually polygon tools allow lines too. 
               // If points < 6 (3 pts), and we remove 1, we have 2 pts (line). That's fine.
               
               if (shape.points.length >= 4) {
                   const newPoints = shape.points.slice(0, -2);
                   updateShape(shape.id, { points: newPoints });
               } else {
                   // Not enough points to keep, maybe delete? 
                   // If only start point + moving point, and we cancel moving point -> just start point.
                   // A single point is useless. Delete shape.
                   deleteShape(shape.id);
               }
               setIsDrawing(false);
               drawingShapeId.current = null;
          }
      }
  };

  const handleDblClick = () => {
       if (tool === 'polygon' && isDrawing && drawingShapeId.current) {
          const shape = useStore.getState().shapes.find(s => s.id === drawingShapeId.current);
          if (shape && shape.points) {
               // Double click means: Click (Add P), Click (Add P_dup), DblClick.
               // We also have the "moving point" appended after last click.
               // So we have [..., P, P_dup, Moving].
               // We want [..., P].
               // So we need to remove the last 2 points (4 coords).
               
               if (shape.points.length >= 6) { // Need at least start + end + moving
                   const newPoints = shape.points.slice(0, -4);
                   updateShape(shape.id, { points: newPoints });
                   setIsDrawing(false);
                   drawingShapeId.current = null;
               } else {
                   // If we don't have enough points, just delete
                   deleteShape(shape.id);
                   setIsDrawing(false);
                   drawingShapeId.current = null;
               }
          }
       }
  };

  const handleTrim = (targetId: string, clickX: number, clickY: number) => {
      const targetShape = shapes.find(s => s.id === targetId);
      if (!targetShape || targetShape.type !== 'line') {
          // Can only trim lines for now
          return;
      }

      const p1 = { x: targetShape.x + (targetShape.points?.[0] || 0), y: targetShape.y + (targetShape.points?.[1] || 0) };
      const p2 = { x: targetShape.x + (targetShape.points?.[2] || 0), y: targetShape.y + (targetShape.points?.[3] || 0) };

      // Find all intersections with other shapes
      const intersections: { t: number, point: { x: number, y: number } }[] = [];

      shapes.forEach(other => {
          if (other.id === targetId) return;

          const otherLines: { p1: { x: number, y: number }, p2: { x: number, y: number } }[] = [];

          if (other.type === 'line') {
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
          } else if (other.type === 'polygon') {
              const points = other.points || [];
              for (let i = 0; i < points.length; i += 2) {
                  const p1 = { x: other.x + points[i], y: other.y + points[i+1] };
                  const nextIndex = (i + 2) % points.length;
                  const p2 = { x: other.x + points[nextIndex], y: other.y + points[nextIndex+1] };
                  otherLines.push({ p1, p2 });
              }
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

      const linesToCreate: Shape[] = [];
      
      if (removeIndex > 0) {
          const startPt = p1;
          const endPt = intersections[removeIndex - 1].point; 
          
          linesToCreate.push({
              id: '', 
              type: 'line',
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
          
          linesToCreate.push({
              id: '',
              type: 'line',
              x: startPt.x,
              y: startPt.y,
              points: [0, 0, endPt.x - startPt.x, endPt.y - startPt.y],
              stroke: targetShape.stroke,
              rotation: 0
          });
      }

      deleteShape(targetId);
      linesToCreate.forEach(l => addShape(l));
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

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
      onDblClick={handleDblClick}
      className={`bg-gray-50 ${tool === 'trim' || tool === 'eraser' ? 'cursor-cell' : 'cursor-crosshair'}`}
    >
      <Layer>
        {renderGrid()}
        {shapes.map((shape) => (
          <ShapeObj
            key={shape.id}
            shape={shape}
            isSelected={selectedIds.includes(shape.id)}
            onSelect={() => {
              if (selectedIds.includes(shape.id)) {
                if (tool === 'select') {
                    setVertexEditMode(true);
                }
              } else {
                selectShape(shape.id);
              }
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
        <SelectModeVertexHighlight hoveredSnapPoint={hoveredSnapPoint} />
      </Layer>
    </Stage>
  );
};
