import type { Shape } from '../../store/useStore';
import Konva from 'konva';

/**
 * Common props interface for all shape components.
 * All shape components (SegmentShape, CircleShape, TriangleShape, etc.) 
 * receive these props from Canvas via the registry.
 * 
 * Multi-selection drag is handled by each shape reading the global dragState
 * from the store and updating itself accordingly.
 */
export interface BaseShapeProps {
  /** The shape data */
  shape: Shape;
  /** Whether this shape is currently selected */
  isSelected: boolean;
  /** Callback to select this shape */
  onSelect: () => void;
  /** Callback to update shape attributes */
  onChange: (newAttrs: Partial<Shape>) => void;
  /** Callback for trim tool interaction */
  onTrim: (e: Konva.KonvaEventObject<MouseEvent> | Konva.KonvaEventObject<TouchEvent>) => void;
}

