import React from 'react';
import { Line, Rect } from 'react-konva';
import type { TriangleDrawState } from './TriangleDrawing';

interface TrianglePreviewProps {
    drawState: TriangleDrawState | null;
    previewPoint: { x: number; y: number } | null;
}

/**
 * Component to render the triangle preview during drawing.
 * Shows dashed lines and point markers.
 */
export const TrianglePreview: React.FC<TrianglePreviewProps> = ({ drawState, previewPoint }) => {
    if (!drawState || !previewPoint) return null;

    return (
        <>
            {/* Line from p1 to current point (or p2 if set) */}
            <Line
                points={[
                    drawState.p1.x,
                    drawState.p1.y,
                    drawState.p2?.x ?? previewPoint.x,
                    drawState.p2?.y ?? previewPoint.y,
                ]}
                stroke="#3b82f6"
                strokeWidth={1}
                dash={[5, 5]}
                listening={false}
            />
            {/* If p2 is set, show the full triangle preview */}
            {drawState.p2 && (
                <>
                    <Line
                        points={[
                            drawState.p2.x,
                            drawState.p2.y,
                            previewPoint.x,
                            previewPoint.y,
                        ]}
                        stroke="#3b82f6"
                        strokeWidth={1}
                        dash={[5, 5]}
                        listening={false}
                    />
                    <Line
                        points={[
                            previewPoint.x,
                            previewPoint.y,
                            drawState.p1.x,
                            drawState.p1.y,
                        ]}
                        stroke="#3b82f6"
                        strokeWidth={1}
                        dash={[5, 5]}
                        listening={false}
                    />
                </>
            )}
            {/* Point markers */}
            <Rect
                x={drawState.p1.x - 3}
                y={drawState.p1.y - 3}
                width={6}
                height={6}
                fill="#3b82f6"
                listening={false}
            />
            {drawState.p2 && (
                <Rect
                    x={drawState.p2.x - 3}
                    y={drawState.p2.y - 3}
                    width={6}
                    height={6}
                    fill="#3b82f6"
                    listening={false}
                />
            )}
        </>
    );
};

