import type { Shape } from '../store/useStore';
import { getLineIntersection, distance, getRectLines } from '../../utils/geometry';

/**
 * Handle trimming a segment by clicking on it.
 * 
 * @param targetId The ID of the shape being clicked to trim
 * @param clickX The x coordinate of the click
 * @param clickY The y coordinate of the click
 * @param shapes The list of all shapes in the scene
 * @param addShape Function to add a new shape
 * @param deleteShape Function to delete a shape
 */
export const handleTrim = (
    targetId: string, 
    clickX: number, 
    clickY: number, 
    shapes: Shape[], 
    addShape: (shape: Omit<Shape, 'id'>) => void, 
    deleteShape: (id: string) => void
) => {
    const targetShape = shapes.find(s => s.id === targetId);
    if (!targetShape || targetShape.type !== 'segment') {
        // Can only trim segments for now
        return;
    }

    const p1 = { x: targetShape.x + (targetShape.points?.[0] || 0), y: targetShape.y + (targetShape.points?.[1] || 0) };
    const p2 = { x: targetShape.x + (targetShape.points?.[2] || 0), y: targetShape.y + (targetShape.points?.[3] || 0) };

    // Find all intersections with other shapes
    const intersections: { t: number, point: { x: number, y: number } }[] = [];

    shapes.forEach(other => {
        if (other.id === targetId) return;

        const otherLines: { p1: { x: number, y: number }, p2: { x: number, y: number } }[] = [];

        if (other.type === 'segment') {
            otherLines.push({
                p1: { x: other.x + (other.points?.[0] || 0), y: other.y + (other.points?.[1] || 0) },
                p2: { x: other.x + (other.points?.[2] || 0), y: other.y + (other.points?.[3] || 0) }
            });
        } else if (other.type === 'rectangle') {
           // Convert rect to 4 lines
           const rectLines = getRectLines(other.x, other.y, other.width || 0, other.height || 0, other.rotation);
           rectLines.forEach(l => {
               otherLines.push({ p1: l[0], p2: l[1] });
           });
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

    const segmentsToCreate: Shape[] = [];
    
    if (removeIndex > 0) {
        const startPt = p1;
        const endPt = intersections[removeIndex - 1].point; 
        
        segmentsToCreate.push({
            id: '', 
            type: 'segment',
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
        
        segmentsToCreate.push({
            id: '',
            type: 'segment',
            x: startPt.x,
            y: startPt.y,
            points: [0, 0, endPt.x - startPt.x, endPt.y - startPt.y],
            stroke: targetShape.stroke,
            rotation: 0
        });
    }

    deleteShape(targetId);
    segmentsToCreate.forEach(l => addShape(l));
};

