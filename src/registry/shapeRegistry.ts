import React from 'react';
import type { ShapeType, ToolType } from '../store/useStore';
import type { BaseShapeProps } from '../components/shapes/BaseShapeProps';
import type { DrawingTool } from '../components/tools/DrawingTool';

/**
 * Shape definition - connects toolbar, drawing tool, and shape component
 */
export interface ShapeDefinition {
  /** Shape type identifier */
  type: ShapeType;
  /** Tool type for toolbar (can be different from shape type, e.g., 'compass' creates 'arc') */
  toolType: ToolType;
  /** React component for rendering the shape */
  component: React.FC<BaseShapeProps>;
  /** Drawing tool for creating the shape */
  createDrawingTool: () => DrawingTool;
  /** Toolbar configuration */
  toolbar: {
    icon: React.FC<{ size?: number }>;
    label: string;
    /** Order in toolbar (lower = higher position) */
    order: number;
  };
}

/**
 * Non-drawing tool definition (select, eraser, trim, etc.)
 */
export interface ToolDefinition {
  type: ToolType;
  toolbar: {
    icon: React.FC<{ size?: number }>;
    label: string;
    order: number;
  };
}

// Registry storage
const shapeRegistry = new Map<ShapeType, ShapeDefinition>();
const toolRegistry = new Map<ToolType, ToolDefinition>();

/**
 * Register a shape type with its component, drawing tool, and toolbar config
 */
export function registerShape(definition: ShapeDefinition): void {
  shapeRegistry.set(definition.type, definition);
}

/**
 * Register a non-drawing tool (select, eraser, etc.)
 */
export function registerTool(definition: ToolDefinition): void {
  toolRegistry.set(definition.type, definition);
}

/**
 * Get the React component for a shape type
 */
export function getShapeComponent(type: ShapeType): React.FC<BaseShapeProps> | undefined {
  return shapeRegistry.get(type)?.component;
}

/**
 * Get a drawing tool instance for a tool type
 */
export function getDrawingTool(toolType: ToolType): DrawingTool | undefined {
  // Find shape definition by toolType
  for (const def of shapeRegistry.values()) {
    if (def.toolType === toolType) {
      return def.createDrawingTool();
    }
  }
  return undefined;
}

/**
 * Check if a tool type is a drawing tool
 */
export function isDrawingTool(toolType: ToolType): boolean {
  for (const def of shapeRegistry.values()) {
    if (def.toolType === toolType) {
      return true;
    }
  }
  return false;
}

/**
 * Get all toolbar items sorted by order
 */
export function getToolbarItems(): Array<{
  type: ToolType;
  icon: React.FC<{ size?: number }>;
  label: string;
  order: number;
  isDrawingTool: boolean;
}> {
  const items: Array<{
    type: ToolType;
    icon: React.FC<{ size?: number }>;
    label: string;
    order: number;
    isDrawingTool: boolean;
  }> = [];

  // Add shape drawing tools
  for (const def of shapeRegistry.values()) {
    items.push({
      type: def.toolType,
      icon: def.toolbar.icon,
      label: def.toolbar.label,
      order: def.toolbar.order,
      isDrawingTool: true,
    });
  }

  // Add non-drawing tools
  for (const def of toolRegistry.values()) {
    items.push({
      type: def.type,
      icon: def.toolbar.icon,
      label: def.toolbar.label,
      order: def.toolbar.order,
      isDrawingTool: false,
    });
  }

  // Sort by order
  return items.sort((a, b) => a.order - b.order);
}

/**
 * Get all registered shape types
 */
export function getRegisteredShapeTypes(): ShapeType[] {
  return Array.from(shapeRegistry.keys());
}

