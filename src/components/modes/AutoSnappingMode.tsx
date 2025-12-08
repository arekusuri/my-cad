import React from 'react';
import { Circle as KonvaCircle, RegularPolygon } from 'react-konva';
import { useStore, type Shape } from '../../store/useStore';
import { getShapeVertices, getShapeMidpoints, type Point } from '../../utils/geometry';
import { constrainLineToOrtho } from './OrthoMode';

export interface SnapPoint {
    shapeId: string;
    index: number; // For vertices, this is index into vertices array. For midpoints, index into midpoints array
    x: number;
    y: number;
    type: 'vertex' | 'midpoint';
}

interface SelectModeProps {
    hoveredSnapPoint: SnapPoint | null;
}

export const SelectModeVertexHighlight: React.FC<SelectModeProps> = ({ hoveredSnapPoint }) => {
    if (!hoveredSnapPoint) return null;
    
    if (hoveredSnapPoint.type === 'midpoint') {
        return (
             <RegularPolygon
                x={hoveredSnapPoint.x}
                y={hoveredSnapPoint.y}
                sides={3}
                radius={8}
                stroke="blue"
                strokeWidth={2}
                fill="transparent"
                listening={false}
                rotation={0}
             />
        );
    }

    return (
        <KonvaCircle
            x={hoveredSnapPoint.x}
            y={hoveredSnapPoint.y}
            radius={6}
            stroke="red"
            strokeWidth={2}
            fill="transparent"
            listening={false}
        />
    );
};

// Helper logic for vertex/midpoint finding/snapping
export const findClosestSnapPoint = (
    pos: { x: number; y: number },
    shapes: Shape[],
    threshold: number = 10
): SnapPoint | null => {
    let closest: SnapPoint | null = null;
    let minDist = threshold;

    shapes.forEach(shape => {
        // Check vertices
        const vertices = getShapeVertices(shape);
        vertices.forEach((v, i) => {
            const d = Math.sqrt(Math.pow(v.x - pos.x, 2) + Math.pow(v.y - pos.y, 2));
            if (d < minDist) {
                minDist = d;
                closest = { shapeId: shape.id, index: i, x: v.x, y: v.y, type: 'vertex' };
            }
        });

        // Check midpoints
        const midpoints = getShapeMidpoints(shape);
        midpoints.forEach((m, i) => {
            const d = Math.sqrt(Math.pow(m.x - pos.x, 2) + Math.pow(m.y - pos.y, 2));
            if (d < minDist) {
                minDist = d;
                closest = { shapeId: shape.id, index: i, x: m.x, y: m.y, type: 'midpoint' };
            }
        });
    });
    return closest;
};

export const handleVertexDrag = (
    draggingVertex: { shapeId: string; index: number },
    newX: number,
    newY: number,
    shapes: Shape[],
    updateShape: (id: string, attrs: Partial<Shape>) => void,
    isOrthoMode: boolean = false
) => {
    const shape = shapes.find(s => s.id === draggingVertex.shapeId);
    if (!shape) return;

    if (shape.type === 'line' || shape.type === 'polygon') {
        const points = [...(shape.points || [])];
        const idx = draggingVertex.index;
        if (idx * 2 + 1 < points.length) {
            // Points are relative to shape.x, shape.y
            let relX = newX - shape.x;
            let relY = newY - shape.y;
            
            // For lines with ortho mode: make the line horizontal or vertical
            if (isOrthoMode && shape.type === 'line' && points.length === 4) {
                // Line has 2 points: [x1, y1, x2, y2]
                // If dragging point 0 (start), constrain relative to point 1 (end)
                // If dragging point 1 (end), constrain relative to point 0 (start)
                const otherIndex = idx === 0 ? 1 : 0;
                const otherX = points[otherIndex * 2];
                const otherY = points[otherIndex * 2 + 1];
                
                const constrained = constrainLineToOrtho(otherX, otherY, relX, relY);
                relX = constrained.endX;
                relY = constrained.endY;
            }
            
            points[idx * 2] = relX;
            points[idx * 2 + 1] = relY;
            updateShape(shape.id, { points });
        }
    } else if (shape.type === 'rect') {
        // Simple resize logic for unrotated rects
        if (shape.rotation === 0) {
            const idx = draggingVertex.index;
            let { x, y, width = 0, height = 0 } = shape;
            const currentRight = x + width;
            const currentBottom = y + height;
            
            if (idx === 0) { // TL
                width = currentRight - newX;
                height = currentBottom - newY;
                x = newX;
                y = newY;
            } else if (idx === 1) { // TR
                width = newX - x;
                height = currentBottom - newY;
                y = newY;
            } else if (idx === 2) { // BR
                width = newX - x;
                height = newY - y;
            } else if (idx === 3) { // BL
                width = currentRight - newX;
                height = newY - y;
                x = newX;
            }
            updateShape(shape.id, { x, y, width, height });
        }
    } else if (shape.type === 'circle') {
        const idx = draggingVertex.index;
        if (idx === 0) { // Center
            updateShape(shape.id, { x: newX, y: newY });
        } else if (idx === 1) { // Rim (radius)
            const dx = newX - shape.x;
            const dy = newY - shape.y;
            const newRadius = Math.sqrt(dx * dx + dy * dy);
            updateShape(shape.id, { radius: newRadius });
        }
    } else if (shape.type === 'triangle') {
        let points = shape.points ? [...shape.points] : [];
                 
        if (points.length === 0 && shape.radius) {
            // Initialize points from regular polygon geometry
            const r = shape.radius;
            // Initial angles for regular triangle
            for (let i = 0; i < 3; i++) {
                const angle = (i * 2 * Math.PI / 3) - Math.PI / 2;
                points.push(r * Math.cos(angle), r * Math.sin(angle));
            }
        }
        
        if (points.length >= 6) {
            const idx = draggingVertex.index;
            // Transform mouse absolute pos back to local space
            const rad = - (shape.rotation * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            
            const relX = newX - shape.x;
            const relY = newY - shape.y;
            
            const localX = relX * cos - relY * sin;
            const localY = relX * sin + relY * cos;
            
            points[idx * 2] = localX;
            points[idx * 2 + 1] = localY;
            
            updateShape(shape.id, { points, radius: undefined }); // Switch to points mode
        }
    }
};

