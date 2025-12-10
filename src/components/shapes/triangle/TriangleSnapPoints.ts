import type { Shape } from '../../../store/useStore';
import { registerSpecialSnapPointsProvider, type SpecialSnapPoint } from '../../../utils/shapeSnapPoints';
import { getCircumcenterPoint } from './TriangleCircumcenter';
import { getOrthocenter } from './TrianglePerpendicularFoot';

/**
 * Get special snap points for a triangle shape.
 * Currently supports: circumcenter (when showCircumcenter is enabled), orthocenter (when showOrthocenter is enabled)
 */
export function getTriangleSpecialSnapPoints(shape: Shape): SpecialSnapPoint[] {
    const points: SpecialSnapPoint[] = [];
    
    if (shape.type !== 'triangle') return points;
    
    // Circumcenter (外心) - only when enabled
    if (shape.showCircumcenter) {
        const circumcenter = getCircumcenterPoint(shape);
        if (circumcenter) {
            points.push({
                point: circumcenter,
                type: 'circumcenter',
                index: 0
            });
        }
    }
    
    // Orthocenter (垂心) - only when enabled
    if (shape.showOrthocenter) {
        const orthocenter = getOrthocenter(shape);
        if (orthocenter) {
            points.push({
                point: orthocenter,
                type: 'orthocenter',
                index: 0
            });
        }
    }
    
    // Future: Add incenter, centroid here
    
    return points;
}

/**
 * Register the triangle special snap points provider
 */
export function registerTriangleSpecialSnapPoints(): void {
    registerSpecialSnapPointsProvider('triangle', getTriangleSpecialSnapPoints);
}

