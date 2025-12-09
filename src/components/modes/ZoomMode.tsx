import React, { useState, useCallback } from 'react';
import { Rect } from 'react-konva';
import { useStore, type ViewportState } from '../../store/useStore';
import type { Point } from '../../utils/geometry';

export interface ZoomBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface UseZoomModeProps {
  /** Called when zoom is applied to switch tool back to select */
  onZoomComplete?: () => void;
}

/**
 * Hook to manage zoom functionality including coordinate transformation and zoom selection.
 */
export function useZoomMode({ onZoomComplete }: UseZoomModeProps = {}) {
  const viewport = useStore((state) => state.viewport);
  const setViewport = useStore((state) => state.setViewport);
  const tool = useStore((state) => state.tool);
  
  const [zoomBox, setZoomBox] = useState<ZoomBox | null>(null);

  /**
   * Convert screen coordinates to world coordinates (accounting for zoom/pan)
   */
  const screenToWorld = useCallback((screenX: number, screenY: number): Point => {
    return {
      x: (screenX - viewport.x) / viewport.scale,
      y: (screenY - viewport.y) / viewport.scale,
    };
  }, [viewport]);

  /**
   * Convert world coordinates to screen coordinates
   */
  const worldToScreen = useCallback((worldX: number, worldY: number): Point => {
    return {
      x: worldX * viewport.scale + viewport.x,
      y: worldY * viewport.scale + viewport.y,
    };
  }, [viewport]);

  /**
   * Start zoom selection box
   */
  const startZoomBox = useCallback((screenX: number, screenY: number) => {
    setZoomBox({
      startX: screenX,
      startY: screenY,
      currentX: screenX,
      currentY: screenY,
    });
  }, []);

  /**
   * Update zoom selection box as mouse moves
   */
  const updateZoomBox = useCallback((screenX: number, screenY: number) => {
    setZoomBox(prev => prev ? ({ ...prev, currentX: screenX, currentY: screenY }) : null);
  }, []);

  /**
   * Complete zoom selection and apply viewport transformation
   */
  const completeZoomBox = useCallback(() => {
    if (!zoomBox) return false;

    const { startX, startY, currentX, currentY } = zoomBox;
    const boxWidth = Math.abs(currentX - startX);
    const boxHeight = Math.abs(currentY - startY);
    
    // Only zoom if box is large enough
    if (boxWidth > 10 && boxHeight > 10) {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      // Calculate the world coordinates of the zoom box corners
      const worldTopLeft = screenToWorld(Math.min(startX, currentX), Math.min(startY, currentY));
      const worldBottomRight = screenToWorld(Math.max(startX, currentX), Math.max(startY, currentY));
      
      const worldWidth = worldBottomRight.x - worldTopLeft.x;
      const worldHeight = worldBottomRight.y - worldTopLeft.y;
      
      // Calculate scale to fit the selected area
      const scaleX = screenWidth / worldWidth;
      const scaleY = screenHeight / worldHeight;
      const newScale = Math.min(scaleX, scaleY) * 0.9; // 90% to add some padding
      
      // Calculate center of selected area in world coords
      const centerX = (worldTopLeft.x + worldBottomRight.x) / 2;
      const centerY = (worldTopLeft.y + worldBottomRight.y) / 2;
      
      // Calculate new viewport position to center the selection
      const newX = screenWidth / 2 - centerX * newScale;
      const newY = screenHeight / 2 - centerY * newScale;
      
      setViewport({ scale: newScale, x: newX, y: newY });
      onZoomComplete?.();
    }
    
    setZoomBox(null);
    return true;
  }, [zoomBox, screenToWorld, setViewport, onZoomComplete]);

  /**
   * Cancel zoom selection
   */
  const cancelZoomBox = useCallback(() => {
    setZoomBox(null);
  }, []);

  /**
   * Check if zoom tool is active
   */
  const isZoomToolActive = tool === 'zoom';

  return {
    viewport,
    zoomBox,
    isZoomToolActive,
    screenToWorld,
    worldToScreen,
    startZoomBox,
    updateZoomBox,
    completeZoomBox,
    cancelZoomBox,
  };
}

interface ZoomBoxOverlayProps {
  zoomBox: ZoomBox | null;
}

/**
 * Visual overlay for zoom selection box.
 * Render this in a separate UI Layer (without viewport transformation).
 */
export const ZoomBoxOverlay: React.FC<ZoomBoxOverlayProps> = ({ zoomBox }) => {
  if (!zoomBox) return null;

  return (
    <Rect
      x={Math.min(zoomBox.startX, zoomBox.currentX)}
      y={Math.min(zoomBox.startY, zoomBox.currentY)}
      width={Math.abs(zoomBox.currentX - zoomBox.startX)}
      height={Math.abs(zoomBox.currentY - zoomBox.startY)}
      fill="rgba(59, 130, 246, 0.1)"
      stroke="#3b82f6"
      strokeWidth={2}
      dash={[8, 4]}
      listening={false}
    />
  );
};

/**
 * Calculate viewport-adjusted stroke width to maintain consistent visual appearance
 */
export function getScaledStrokeWidth(baseWidth: number, viewportScale: number): number {
  return baseWidth / viewportScale;
}

/**
 * Calculate viewport-adjusted size (radius, etc.) to maintain consistent visual appearance
 */
export function getScaledSize(baseSize: number, viewportScale: number): number {
  return baseSize / viewportScale;
}

