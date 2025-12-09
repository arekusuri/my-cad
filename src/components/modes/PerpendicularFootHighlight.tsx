import React from 'react';
import { Rect } from 'react-konva';
import type { Point } from '../../utils/geometry';

interface PerpendicularFootHighlightProps {
    perpendicularFeet: Point[];
    viewportScale?: number;
}

/**
 * Visual highlight for perpendicular feet (垂足).
 * Shows small orange squares at points where a perpendicular can be drawn to an edge.
 */
export const PerpendicularFootHighlight: React.FC<PerpendicularFootHighlightProps> = ({ 
    perpendicularFeet, 
    viewportScale = 1 
}) => {
    if (perpendicularFeet.length === 0) return null;

    const size = 8 / viewportScale;
    const strokeWidth = 2 / viewportScale;

    return (
        <>
            {perpendicularFeet.map((point, i) => (
                <Rect
                    key={`perpfoot-${i}`}
                    x={point.x}
                    y={point.y}
                    width={size}
                    height={size}
                    offsetX={size / 2}
                    offsetY={size / 2}
                    stroke="#f97316"
                    strokeWidth={strokeWidth}
                    fill="rgba(249, 115, 22, 0.3)"
                    listening={false}
                />
            ))}
        </>
    );
};

