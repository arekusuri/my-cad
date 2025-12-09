/**
 * Registration file for all shape special snap point providers.
 * Import and call registerAllShapeSnapPoints() at app startup.
 */
import { registerTriangleSpecialSnapPoints } from '../components/shapes/triangle';

let registered = false;

/**
 * Register all shape special snap point providers.
 * Safe to call multiple times - will only register once.
 */
export function registerAllShapeSnapPoints(): void {
    if (registered) return;
    
    registerTriangleSpecialSnapPoints();
    // Add more shape registrations here as needed:
    // registerPolygonSpecialSnapPoints();
    // registerCircleSpecialSnapPoints();
    
    registered = true;
}

