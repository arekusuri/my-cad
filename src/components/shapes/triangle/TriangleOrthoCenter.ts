import type { Shape } from '../../../store/useStore';
import type { Point } from '../../../utils/geometry';
import { getShapeVertices } from '../../../utils/geometry';
import { calculatePerpendicularFoot } from '../segment/PerpendicularFoot';

/**
 * Perpendicular foot (垂足) - the point where a perpendicular from a vertex meets the opposite edge.
 * Also known as the foot of the altitude.
 */
export interface PerpendicularFoot {
  /** The vertex index (0, 1, or 2) from which the perpendicular is drawn */
  vertexIndex: number;
  /** The vertex point */
  vertex: Point;
  /** The foot point on the opposite edge */
  foot: Point;
  /** Whether the foot lies within the edge (true) or on the extension (false) */
  isOnEdge: boolean;
}

/**
 * Get the perpendicular foot from a vertex to the opposite edge.
 * 
 * For vertex index:
 * - 0 (A): perpendicular to edge BC (vertices 1-2)
 * - 1 (B): perpendicular to edge CA (vertices 2-0)
 * - 2 (C): perpendicular to edge AB (vertices 0-1)
 * 
 * @param shape The triangle shape
 * @param vertexIndex The index of the vertex (0, 1, or 2)
 * @returns The perpendicular foot data, or null if invalid
 */
export function getPerpendicularFoot(
  shape: Shape,
  vertexIndex: number
): PerpendicularFoot | null {
  if (shape.type !== 'triangle') return null;
  
  const vertices = getShapeVertices(shape);
  if (vertices.length !== 3) return null;
  
  if (vertexIndex < 0 || vertexIndex > 2) return null;
  
  const vertex = vertices[vertexIndex];
  
  // Get the opposite edge endpoints
  // For vertex i, opposite edge is from vertex (i+1)%3 to vertex (i+2)%3
  const edgeStart = vertices[(vertexIndex + 1) % 3];
  const edgeEnd = vertices[(vertexIndex + 2) % 3];
  
  const { foot, isOnEdge } = calculatePerpendicularFoot(vertex, edgeStart, edgeEnd);
  
  return {
    vertexIndex,
    vertex,
    foot,
    isOnEdge
  };
}

/**
 * Get all three perpendicular feet (altitudes) of a triangle.
 * 
 * @param shape The triangle shape
 * @returns Array of perpendicular foot data for each vertex
 */
export function getAllPerpendicularFeet(shape: Shape): PerpendicularFoot[] {
  if (shape.type !== 'triangle') return [];
  
  const feet: PerpendicularFoot[] = [];
  
  for (let i = 0; i < 3; i++) {
    const foot = getPerpendicularFoot(shape, i);
    if (foot) {
      feet.push(foot);
    }
  }
  
  return feet;
}

/**
 * Get the orthocenter (垂心) of a triangle.
 * The orthocenter is the intersection point of all three altitudes.
 * 
 * @param shape The triangle shape
 * @returns The orthocenter point, or null if invalid
 */
export function getOrthocenter(shape: Shape): Point | null {
  if (shape.type !== 'triangle') return null;
  
  const vertices = getShapeVertices(shape);
  if (vertices.length !== 3) return null;
  
  const [A, B, C] = vertices;
  
  // Get two altitude lines and find their intersection
  // Altitude from A perpendicular to BC
  // Altitude from B perpendicular to CA
  
  // Direction of BC
  const bcX = C.x - B.x;
  const bcY = C.y - B.y;
  
  // Direction of CA
  const caX = A.x - C.x;
  const caY = A.y - C.y;
  
  // Altitude from A is perpendicular to BC, so direction is (-bcY, bcX)
  // Line: A + t * (-bcY, bcX)
  
  // Altitude from B is perpendicular to CA, so direction is (-caY, caX)
  // Line: B + s * (-caY, caX)
  
  // Solve for intersection:
  // A.x - t*bcY = B.x - s*caY
  // A.y + t*bcX = B.y + s*caX
  
  // Rearranging:
  // -bcY * t + caY * s = B.x - A.x
  // bcX * t - caX * s = B.y - A.y
  
  const det = (-bcY) * (-caX) - (caY) * (bcX);
  
  if (Math.abs(det) < 0.0001) {
    // Degenerate triangle (collinear points)
    return null;
  }
  
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  
  const t = ((-caX) * dx - (caY) * dy) / det;
  
  return {
    x: A.x - t * bcY,
    y: A.y + t * bcX
  };
}

/**
 * Calculate the distance from a vertex to its perpendicular foot (altitude length).
 * 
 * @param shape The triangle shape
 * @param vertexIndex The index of the vertex (0, 1, or 2)
 * @returns The altitude length, or null if invalid
 */
export function getAltitudeLength(shape: Shape, vertexIndex: number): number | null {
  const perpFoot = getPerpendicularFoot(shape, vertexIndex);
  if (!perpFoot) return null;
  
  const dx = perpFoot.foot.x - perpFoot.vertex.x;
  const dy = perpFoot.foot.y - perpFoot.vertex.y;
  
  return Math.sqrt(dx * dx + dy * dy);
}

