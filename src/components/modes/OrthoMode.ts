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

