import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Circle as KonvaCircle, RegularPolygon, Rect, Line } from 'react-konva';
import { type Shape } from '../../store/useStore';
import { getShapeVertices, getShapeMidpoints, getShapeEdges, getLineArcIntersections, getArcArcIntersections } from '../../utils/geometry';
import { getShapeSpecialSnapPoints } from '../../utils/shapeSnapPoints';
import { constrainLineToOrtho } from './OrthoMode';
import { calculatePerpendicularFoot } from '../shapes/segment/PerpendicularFoot';

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
    type: 'vertex' | 'midpoint' | 'circumcenter' | 'incenter' | 'centroid' | 'orthocenter' | 'perpendicular' | 'intersection';
    /** For perpendicular on extension: the edge endpoint to draw extension line from */
    extensionFrom?: { x: number; y: number };
}

interface SnapPointHighlightProps {
    hoveredSnapPoint: SnapPoint | null;
    viewportScale?: number;
}

/**
 * Visual highlight for snap points (vertices and midpoints).
 * Shows a red circle for vertices, blue triangle for midpoints, green square for perpendicular foot.
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
    
    // Perpendicular foot - green square, with optional extension line
    if (hoveredSnapPoint.type === 'perpendicular') {
        const size = 10 / viewportScale;
        return (
            <>
                {/* Extension line (dashed) if foot is on extension */}
                {hoveredSnapPoint.extensionFrom && (
                    <Line
                        points={[
                            hoveredSnapPoint.extensionFrom.x,
                            hoveredSnapPoint.extensionFrom.y,
                            hoveredSnapPoint.x,
                            hoveredSnapPoint.y
                        ]}
                        stroke="#22c55e"
                        strokeWidth={1 / viewportScale}
                        dash={[6 / viewportScale, 4 / viewportScale]}
                        listening={false}
                    />
                )}
                {/* Square marker */}
                <Rect
                    x={hoveredSnapPoint.x - size / 2}
                    y={hoveredSnapPoint.y - size / 2}
                    width={size}
                    height={size}
                    stroke="#22c55e"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    listening={false}
                />
            </>
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
    
    // Intersection point (arc-edge intersection) - orange X marker
    if (hoveredSnapPoint.type === 'intersection') {
        const size = 6 / viewportScale;
        return (
            <>
                <Line
                    points={[
                        hoveredSnapPoint.x - size, hoveredSnapPoint.y - size,
                        hoveredSnapPoint.x + size, hoveredSnapPoint.y + size
                    ]}
                    stroke="#f97316"
                    strokeWidth={strokeWidth}
                    listening={false}
                />
                <Line
                    points={[
                        hoveredSnapPoint.x - size, hoveredSnapPoint.y + size,
                        hoveredSnapPoint.x + size, hoveredSnapPoint.y - size
                    ]}
                    stroke="#f97316"
                    strokeWidth={strokeWidth}
                    listening={false}
                />
            </>
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
    threshold: number = 10,
    options?: { 
        includePerpendicularFeet?: boolean;
        /** Reference point for perpendicular calculation (e.g., segment start point) */
        perpendicularReferencePoint?: { x: number; y: number };
    }
): SnapPoint | null => {
    let closest: SnapPoint | null = null;
    let minDist = threshold;
    const includePerpendicularFeet = options?.includePerpendicularFeet ?? false;
    // Use reference point for perpendicular calculation, default to mouse pos
    const perpRefPoint = options?.perpendicularReferencePoint ?? pos;

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

        // Check perpendicular feet on triangle edges (only when enabled)
        if (includePerpendicularFeet && shape.type === 'triangle' && vertices.length === 3) {
            // For each edge, calculate perpendicular foot from the REFERENCE point (segment start)
            for (let i = 0; i < 3; i++) {
                const edgeStart = vertices[i];
                const edgeEnd = vertices[(i + 1) % 3];
                
                // Calculate perpendicular foot from reference point to edge
                const { foot, isOnEdge } = calculatePerpendicularFoot(perpRefPoint, edgeStart, edgeEnd);
                
                // Check distance from MOUSE position to the foot (for snapping detection)
                const d = Math.sqrt(Math.pow(foot.x - pos.x, 2) + Math.pow(foot.y - pos.y, 2));
                if (d < minDist) {
                    minDist = d;
                    
                    // If foot is on extension, determine which endpoint to draw extension from
                    let extensionFrom: { x: number; y: number } | undefined;
                    if (!isOnEdge) {
                        // Calculate t parameter to determine which end
                        const dx = edgeEnd.x - edgeStart.x;
                        const dy = edgeEnd.y - edgeStart.y;
                        const lenSq = dx * dx + dy * dy;
                        if (lenSq > 0.0001) {
                            const t = ((foot.x - edgeStart.x) * dx + (foot.y - edgeStart.y) * dy) / lenSq;
                            if (t < 0) {
                                // Foot is before edgeStart
                                extensionFrom = edgeStart;
                            } else {
                                // Foot is after edgeEnd
                                extensionFrom = edgeEnd;
                            }
                        }
                    }
                    
                    closest = { 
                        shapeId: shape.id, 
                        index: i, 
                        x: foot.x, 
                        y: foot.y, 
                        type: 'perpendicular',
                        extensionFrom
                    };
                }
            }
        }
    });
    
    // Check for intersections between arcs and edges from other shapes
    const arcs = shapes.filter(s => s.type === 'arc' && s.radius !== undefined && 
        s.startAngle !== undefined && s.sweepAngle !== undefined);
    
    shapes.forEach(shape => {
        const edges = getShapeEdges(shape);
        edges.forEach(([p1, p2]) => {
            arcs.forEach(arc => {
                // Don't check arc against itself
                if (arc.id === shape.id) return;
                
                const arcIntersections = getLineArcIntersections(
                    p1, p2,
                    { x: arc.x, y: arc.y },
                    arc.radius!,
                    arc.startAngle!,
                    arc.sweepAngle!
                );
                
                arcIntersections.forEach((intersection, i) => {
                    const d = Math.sqrt(Math.pow(intersection.x - pos.x, 2) + Math.pow(intersection.y - pos.y, 2));
                    if (d < minDist) {
                        minDist = d;
                        closest = { 
                            shapeId: arc.id, 
                            index: i, 
                            x: intersection.x, 
                            y: intersection.y, 
                            type: 'intersection' 
                        };
                    }
                });
            });
        });
    });
    
    // Check for arc-arc intersections
    for (let i = 0; i < arcs.length; i++) {
        const arc1 = arcs[i];
        for (let j = i + 1; j < arcs.length; j++) {
            const arc2 = arcs[j];
            
            const arcArcIntersections = getArcArcIntersections(
                { x: arc1.x, y: arc1.y }, arc1.radius!, arc1.startAngle!, arc1.sweepAngle!,
                { x: arc2.x, y: arc2.y }, arc2.radius!, arc2.startAngle!, arc2.sweepAngle!
            );
            
            arcArcIntersections.forEach((intersection, idx) => {
                const d = Math.sqrt(Math.pow(intersection.x - pos.x, 2) + Math.pow(intersection.y - pos.y, 2));
                if (d < minDist) {
                    minDist = d;
                    closest = { 
                        shapeId: arc1.id, 
                        index: idx, 
                        x: intersection.x, 
                        y: intersection.y, 
                        type: 'intersection' 
                    };
                }
            });
        }
    }
    
    return closest;
};

/**
 * Simple helper that returns just coordinates for snap point.
 * Wrapper around findClosestSnapPoint for simpler use cases.
 */
export const findSnapPointCoords = (
    pos: { x: number; y: number },
    shapes: Shape[],
    threshold: number = 10,
    excludeShapeId?: string | null
): { x: number; y: number } | null => {
    // Filter out excluded shape
    const filteredShapes = excludeShapeId 
        ? shapes.filter(s => s.id !== excludeShapeId)
        : shapes;
    
    const snapPoint = findClosestSnapPoint(pos, filteredShapes, threshold);
    return snapPoint ? { x: snapPoint.x, y: snapPoint.y } : null;
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
    } else if (shape.type === 'rectangle') {
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
