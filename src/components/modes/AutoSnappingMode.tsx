import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Circle as KonvaCircle, RegularPolygon } from 'react-konva';
import { type Shape } from '../../store/useStore';
import { getShapeVertices, getShapeMidpoints } from '../../utils/geometry';
import { getShapeSpecialSnapPoints } from '../../utils/shapeSnapPoints';
import { constrainLineToOrtho } from './OrthoMode';

export interface DraggingVertex {
    shapeId: string;
    index: number;
    startX: number;
    startY: number;
}

/**
 * Hook to manage vertex dragging with Escape key cancellation.
 * Stores original shape state and restores it if Escape is pressed.
 */
export const useVertexDrag = (
    updateShape: (id: string, attrs: Partial<Shape>) => void
) => {
    const [draggingVertex, setDraggingVertex] = useState<DraggingVertex | null>(null);
    const originalShapeRef = useRef<Shape | null>(null);

    // Handle Escape key to cancel drag and restore shape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && draggingVertex && originalShapeRef.current) {
                updateShape(originalShapeRef.current.id, originalShapeRef.current);
                setDraggingVertex(null);
                originalShapeRef.current = null;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [draggingVertex, updateShape]);

    const startDrag = useCallback((snapPoint: SnapPoint, shapes: Shape[]) => {
        const shapeToStore = shapes.find(s => s.id === snapPoint.shapeId);
        if (shapeToStore) {
            originalShapeRef.current = { ...shapeToStore };
        }
        setDraggingVertex({
            shapeId: snapPoint.shapeId,
            index: snapPoint.index,
            startX: snapPoint.x,
            startY: snapPoint.y,
        });
    }, []);

    const endDrag = useCallback(() => {
        setDraggingVertex(null);
        originalShapeRef.current = null;
    }, []);

    const cancelDrag = useCallback(() => {
        if (draggingVertex && originalShapeRef.current) {
            updateShape(originalShapeRef.current.id, originalShapeRef.current);
        }
        setDraggingVertex(null);
        originalShapeRef.current = null;
    }, [draggingVertex, updateShape]);

    return {
        draggingVertex,
        startDrag,
        endDrag,
        cancelDrag,
    };
};

export interface SnapPoint {
    shapeId: string;
    index: number;
    x: number;
    y: number;
    type: 'vertex' | 'midpoint' | 'circumcenter' | 'incenter' | 'centroid' | 'orthocenter';
}

interface SnapPointHighlightProps {
    hoveredSnapPoint: SnapPoint | null;
    viewportScale?: number;
}

/**
 * Visual highlight for snap points (vertices and midpoints).
 * Shows a red circle for vertices, blue triangle for midpoints.
 */
export const SnapPointHighlight: React.FC<SnapPointHighlightProps> = ({ hoveredSnapPoint, viewportScale = 1 }) => {
    if (!hoveredSnapPoint) return null;
    
    const strokeWidth = 2 / viewportScale;
    
    if (hoveredSnapPoint.type === 'midpoint') {
        return (
            <RegularPolygon
                x={hoveredSnapPoint.x}
                y={hoveredSnapPoint.y}
                sides={3}
                radius={8 / viewportScale}
                stroke="blue"
                strokeWidth={strokeWidth}
                fill="transparent"
                listening={false}
                rotation={0}
            />
        );
    }
    
    // Special snap points (circumcenter, incenter, centroid, orthocenter) - purple circle
    if (hoveredSnapPoint.type === 'circumcenter' || 
        hoveredSnapPoint.type === 'incenter' || 
        hoveredSnapPoint.type === 'centroid' || 
        hoveredSnapPoint.type === 'orthocenter') {
        return (
            <KonvaCircle
                x={hoveredSnapPoint.x}
                y={hoveredSnapPoint.y}
                radius={5 / viewportScale}
                stroke="purple"
                strokeWidth={strokeWidth}
                fill="transparent"
                listening={false}
            />
        );
    }

    // Default: vertex - red circle
    return (
        <KonvaCircle
            x={hoveredSnapPoint.x}
            y={hoveredSnapPoint.y}
            radius={6 / viewportScale}
            stroke="red"
            strokeWidth={strokeWidth}
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

        // Check special snap points (circumcenter, etc.) via shape-specific providers
        const specialPoints = getShapeSpecialSnapPoints(shape);
        specialPoints.forEach(sp => {
            const d = Math.sqrt(Math.pow(sp.point.x - pos.x, 2) + Math.pow(sp.point.y - pos.y, 2));
            if (d < minDist) {
                minDist = d;
                closest = { shapeId: shape.id, index: sp.index, x: sp.point.x, y: sp.point.y, type: sp.type };
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

    if (shape.type === 'segment') {
        const points = [...(shape.points || [])];
        const idx = draggingVertex.index;
        if (idx * 2 + 1 < points.length) {
            // Points are relative to shape.x, shape.y
            let relX = newX - shape.x;
            let relY = newY - shape.y;
            
            // For segments with ortho mode: make the segment horizontal or vertical
            if (isOrthoMode && points.length === 4) {
                // Segment has 2 points: [x1, y1, x2, y2]
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
        const points = shape.points ? [...shape.points] : [];
                 
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
    } else if (shape.type === 'polygon') {
        const POLYGON_SIDES = 6;
        const points = shape.points ? [...shape.points] : [];
                 
        if (points.length === 0 && shape.radius) {
            // Initialize points from regular polygon geometry (hexagon)
            const r = shape.radius;
            for (let i = 0; i < POLYGON_SIDES; i++) {
                const angle = (i * 2 * Math.PI / POLYGON_SIDES) - Math.PI / 2;
                points.push(r * Math.cos(angle), r * Math.sin(angle));
            }
        }
        
        if (points.length >= POLYGON_SIDES * 2) {
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
