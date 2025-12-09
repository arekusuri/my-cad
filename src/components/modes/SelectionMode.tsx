import React, { useState, useCallback } from 'react';
import { Rect } from 'react-konva';
import { useStore, type Shape } from '../../store/useStore';
import { isShapeInRect, doesShapeIntersectRect } from '../../utils/geometry';

export interface SelectionBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface UseSelectionModeProps {
  shapes: Shape[];
  selectedIds: string[];
}

/**
 * Hook to manage selection box functionality for selecting shapes and vertices.
 */
export function useSelectionMode({ shapes, selectedIds }: UseSelectionModeProps) {
  const selectShape = useStore((state) => state.selectShape);
  const selectVertices = useStore((state) => state.selectVertices);
  
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);

  /**
   * Start selection box at the given world position
   */
  const startSelectionBox = useCallback((worldX: number, worldY: number) => {
    setSelectionBox({
      startX: worldX,
      startY: worldY,
      currentX: worldX,
      currentY: worldY,
    });
  }, []);

  /**
   * Update selection box as mouse moves (world coordinates)
   * Returns true if selection was active and updated, false otherwise
   */
  const updateSelectionBox = useCallback((worldX: number, worldY: number): boolean => {
    let handled = false;
    setSelectionBox(prev => {
      if (prev) {
        handled = true;
        return { ...prev, currentX: worldX, currentY: worldY };
      }
      return null;
    });
    return handled;
  }, []);

  /**
   * Complete selection - find shapes/vertices within the selection box
   * Returns true if selection was active and completed, false otherwise
   */
  const completeSelectionBox = useCallback((): boolean => {
    if (!selectionBox) return false;

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
    return true;
  }, [selectionBox, shapes, selectedIds, selectShape, selectVertices]);

  /**
   * Cancel selection box
   */
  const cancelSelectionBox = useCallback(() => {
    setSelectionBox(null);
  }, []);

  /**
   * Check if selection is active
   */
  const isSelecting = selectionBox !== null;

  return {
    selectionBox,
    isSelecting,
    startSelectionBox,
    updateSelectionBox,
    completeSelectionBox,
    cancelSelectionBox,
  };
}

interface SelectionBoxOverlayProps {
  selectionBox: SelectionBox | null;
  viewportScale?: number;
}

/**
 * Visual overlay for selection box.
 * Blue box for window selection (drag down), green for crossing selection (drag up).
 */
export const SelectionBoxOverlay: React.FC<SelectionBoxOverlayProps> = ({ 
  selectionBox, 
  viewportScale = 1 
}) => {
  if (!selectionBox) return null;

  const { startX, startY, currentX, currentY } = selectionBox;
  const isWindowSelection = currentY > startY;
  
  return (
    <Rect
      x={Math.min(startX, currentX)}
      y={Math.min(startY, currentY)}
      width={Math.abs(currentX - startX)}
      height={Math.abs(currentY - startY)}
      fill={isWindowSelection ? 'rgba(0, 0, 255, 0.1)' : 'rgba(0, 255, 0, 0.1)'}
      stroke={isWindowSelection ? 'blue' : 'green'}
      strokeWidth={1 / viewportScale}
      dash={[5 / viewportScale, 5 / viewportScale]}
    />
  );
};

