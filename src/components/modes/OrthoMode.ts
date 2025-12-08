/**
 * Ortho Mode Utilities
 * 
 * When enabled (typically via Shift key), constrains movement/drawing to:
 * - Horizontal axis (X)
 * - Vertical axis (Y)
 * - Square constraints for rectangles
 */

export interface Point {
    x: number;
    y: number;
}

/**
 * Constrains a point to move only along X or Y axis relative to an origin.
 * Chooses the axis based on which direction has greater magnitude.
 * 
 * @param origin - The starting/reference point
 * @param current - The current mouse position
 * @returns The constrained point (locked to X or Y axis)
 */
export function constrainToAxis(origin: Point, current: Point): Point {
    const dx = current.x - origin.x;
    const dy = current.y - origin.y;

    if (Math.abs(dx) > Math.abs(dy)) {
        // Lock to horizontal (X axis)
        return { x: current.x, y: origin.y };
    } else {
        // Lock to vertical (Y axis)
        return { x: origin.x, y: current.y };
    }
}

/**
 * Constrains width/height to form a square (equal sides).
 * Preserves the sign (direction) of each dimension.
 * 
 * @param width - The current width
 * @param height - The current height
 * @returns Object with constrained width and height (equal absolute values)
 */
export function constrainToSquare(width: number, height: number): { width: number; height: number } {
    const side = Math.max(Math.abs(width), Math.abs(height));
    return {
        width: width > 0 ? side : -side,
        height: height > 0 ? side : -side
    };
}

/**
 * Constrains a line endpoint to be perfectly horizontal or vertical.
 * 
 * @param startX - Line start X (usually 0 for relative coords)
 * @param startY - Line start Y (usually 0 for relative coords)
 * @param endX - Current end X position
 * @param endY - Current end Y position
 * @returns Constrained endpoint { endX, endY }
 */
export function constrainLineToOrtho(
    startX: number,
    startY: number,
    endX: number,
    endY: number
): { endX: number; endY: number } {
    const dx = endX - startX;
    const dy = endY - startY;

    if (Math.abs(dx) > Math.abs(dy)) {
        // Lock to horizontal
        return { endX, endY: startY };
    } else {
        // Lock to vertical
        return { endX: startX, endY };
    }
}

/**
 * Apply ortho constraint to a delta movement.
 * Useful for dragging objects - constrains the movement vector.
 * 
 * @param deltaX - Movement in X direction
 * @param deltaY - Movement in Y direction
 * @returns Constrained delta { deltaX, deltaY }
 */
export function constrainMovement(deltaX: number, deltaY: number): { deltaX: number; deltaY: number } {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        return { deltaX, deltaY: 0 };
    } else {
        return { deltaX: 0, deltaY };
    }
}

/**
 * Constrains a vertex position to form a right angle (90°) with its neighbors.
 * The vertex being dragged is the corner of the angle.
 * 
 * @param prevPoint - The previous vertex (before the dragged one)
 * @param currentPoint - The current mouse/drag position
 * @param nextPoint - The next vertex (after the dragged one)
 * @returns The constrained position that creates a 90° angle
 */
export function constrainToRightAngle(
    prevPoint: Point,
    currentPoint: Point,
    nextPoint: Point
): Point {
    // Vector from prev to current (edge 1)
    const v1x = currentPoint.x - prevPoint.x;
    const v1y = currentPoint.y - prevPoint.y;
    
    // Vector from current to next (edge 2)
    const v2x = nextPoint.x - currentPoint.x;
    const v2y = nextPoint.y - currentPoint.y;
    
    // Length of vectors
    const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
    const len2 = Math.sqrt(v2x * v2x + v2y * v2y);
    
    if (len1 < 0.001 || len2 < 0.001) {
        return currentPoint; // Can't constrain if vectors are too short
    }
    
    // Strategy: Project the current point onto the line that would make a right angle
    // We have two options:
    // 1. Keep edge 1 direction fixed, adjust current to make edge 2 perpendicular
    // 2. Keep edge 2 direction fixed, adjust current to make edge 1 perpendicular
    
    // We'll pick the one that's closest to the current position
    
    // Option 1: Keep direction from prev to current, find point where edge 2 is perpendicular
    // The perpendicular to v1 at currentPoint should pass through nextPoint
    // Perpendicular direction to v1: (-v1y, v1x) normalized
    const perp1x = -v1y / len1;
    const perp1y = v1x / len1;
    
    // Project nextPoint onto line through currentPoint with direction perp1
    // currentPoint + t * perp1 = closest point to nextPoint on perp line
    // t = dot(nextPoint - currentPoint, perp1)
    const t1 = (nextPoint.x - currentPoint.x) * perp1x + (nextPoint.y - currentPoint.y) * perp1y;
    const option1 = {
        x: currentPoint.x + t1 * perp1x - (nextPoint.x - currentPoint.x - t1 * perp1x),
        y: currentPoint.y + t1 * perp1y - (nextPoint.y - currentPoint.y - t1 * perp1y)
    };
    
    // Actually, let's use a simpler approach:
    // Find the point on the line from prev through current that makes a 90° with next
    
    // Direction from prev to current (normalized)
    const dir1x = v1x / len1;
    const dir1y = v1y / len1;
    
    // We want to find point P on the ray from prev in direction dir1
    // such that (P - prev) · (next - P) = 0 (perpendicular)
    // Let P = prev + t * dir1
    // (t * dir1) · (next - prev - t * dir1) = 0
    // t * (dir1 · (next - prev)) - t² * (dir1 · dir1) = 0
    // t * (dir1 · (next - prev)) = t²
    // t = dir1 · (next - prev)
    
    const dpx = nextPoint.x - prevPoint.x;
    const dpy = nextPoint.y - prevPoint.y;
    const t_opt1 = dir1x * dpx + dir1y * dpy;
    
    const candidate1: Point = {
        x: prevPoint.x + t_opt1 * dir1x,
        y: prevPoint.y + t_opt1 * dir1y
    };
    
    // Option 2: Keep direction from current to next, find where edge 1 is perpendicular
    // Direction from next backwards
    const dir2x = -v2x / len2;
    const dir2y = -v2y / len2;
    
    // Find point P on ray from next in direction dir2
    // such that (prev - P) · (P - next) = 0
    // Let P = next + t * dir2
    // (prev - next - t * dir2) · (t * dir2) = 0
    // t * ((prev - next) · dir2) - t² = 0
    // t = (prev - next) · dir2
    
    const dnx = prevPoint.x - nextPoint.x;
    const dny = prevPoint.y - nextPoint.y;
    const t_opt2 = dir2x * dnx + dir2y * dny;
    
    const candidate2: Point = {
        x: nextPoint.x + t_opt2 * dir2x,
        y: nextPoint.y + t_opt2 * dir2y
    };
    
    // Choose the candidate closest to currentPoint
    const dist1 = Math.sqrt(
        Math.pow(candidate1.x - currentPoint.x, 2) + 
        Math.pow(candidate1.y - currentPoint.y, 2)
    );
    const dist2 = Math.sqrt(
        Math.pow(candidate2.x - currentPoint.x, 2) + 
        Math.pow(candidate2.y - currentPoint.y, 2)
    );
    
    return dist1 <= dist2 ? candidate1 : candidate2;
}

