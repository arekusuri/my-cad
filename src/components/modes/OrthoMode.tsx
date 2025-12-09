import React from 'react';
import { Line } from 'react-konva';
import type { Shape } from '../../store/useStore';

interface OrthoAxesProps {
    center: { x: number; y: number };
    screenWidth: number;
    screenHeight: number;
}

/**
 * Visual axes overlay for ortho mode.
 * Shows horizontal (red) and vertical (green) dashed lines through the center point.
 */
export const OrthoAxes: React.FC<OrthoAxesProps> = ({ center, screenWidth, screenHeight }) => {
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
};

interface OrthoAxesOverlayProps {
    isShiftPressed: boolean;
    selectedIds: string[];
    tool: string;
    shapes: Shape[];
    viewportScale: number;
}

export const OrthoAxesOverlay: React.FC<OrthoAxesOverlayProps> = ({ 
    isShiftPressed, 
    selectedIds, 
    tool, 
    shapes,
    viewportScale 
}) => {
    if (!isShiftPressed || selectedIds.length === 0 || tool !== 'select') {
        return null;
    }

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

    const center = getSelectedShapeCenter();
    if (!center) return null;

    return (
        <OrthoAxes 
            center={center} 
            screenWidth={window.innerWidth / viewportScale} 
            screenHeight={window.innerHeight / viewportScale} 
        />
    );
};

