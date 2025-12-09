import type { Shape } from '../store/useStore';
import type { Point } from './geometry';

/**
 * Special snap point with type information for attachments
 */
export interface SpecialSnapPoint {
    point: Point;
    type: 'circumcenter' | 'incenter' | 'centroid' | 'orthocenter';
    index: number;
}

/**
 * Interface for getting special snap points from a shape.
 * Each shape type can implement this to provide shape-specific snap points.
 */
export type SpecialSnapPointsProvider = (shape: Shape) => SpecialSnapPoint[];

/**
 * Registry of special snap point providers by shape type
 */
const specialSnapPointProviders: Map<string, SpecialSnapPointsProvider> = new Map();

/**
 * Register a special snap points provider for a shape type
 */
export function registerSpecialSnapPointsProvider(
    shapeType: string, 
    provider: SpecialSnapPointsProvider
): void {
    specialSnapPointProviders.set(shapeType, provider);
}

/**
 * Get special snap points for a shape using registered providers
 */
export function getShapeSpecialSnapPoints(shape: Shape): SpecialSnapPoint[] {
    const provider = specialSnapPointProviders.get(shape.type);
    if (provider) {
        return provider(shape);
    }
    return [];
}

