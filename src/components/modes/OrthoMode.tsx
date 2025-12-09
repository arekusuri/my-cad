import React from 'react';
import { Line } from 'react-konva';

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

