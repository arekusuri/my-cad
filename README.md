# CAD - 2D Drawing Application

A lightweight 2D CAD (Computer-Aided Design) application built with React, TypeScript, and Konva.js. Create, edit, and manipulate geometric shapes with professional-grade drawing tools.

![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue) ![Vite](https://img.shields.io/badge/Vite-6.0-purple)

## Features

- 🎨 Multiple shape drawing tools
- ✏️ Vertex editing mode
- 📐 Ortho mode (constrained drawing)
- 🎯 Auto-snapping to vertices and midpoints
- 🔲 Window & Crossing selection modes
- ✂️ Trim and Eraser tools

---

## Tools

### Select Tool (`MousePointer2`)
The default tool for selecting and manipulating shapes.

| Action | Description |
|--------|-------------|
| **Click shape** | Select the shape and enter vertex edit mode |
| **Click + Drag shape** | Select AND move the shape in one motion |
| **Click empty area** | Deselect all |
| **Drag on empty area (↓ down)** | **Window selection** - selects shapes fully contained in the blue box |
| **Drag on empty area (↑ up)** | **Crossing selection** - selects shapes that intersect the green box |
| **Drag vertex handles** | Modify individual vertices to reshape |

#### Vertex Edit Mode
When a shape is selected, vertex handles appear immediately:
- Drag individual vertices to reshape
- Hold **Alt** while hovering to see snap targets
- Hold **Shift** while dragging to constrain to H/V axis

---

### Rectangle Tool (`Square`)
Draw rectangles by click-and-drag.

| Action | Description |
|--------|-------------|
| **Click + Drag** | Draw rectangle from corner to corner |
| **Shift + Drag** | Constrain to perfect square |
| **Alt + Click/Drag** | Snap to grid and shape vertices |

---

### Circle Tool (`Circle`)
Draw circles by click-and-drag.

| Action | Description |
|--------|-------------|
| **Click + Drag** | Draw circle with center at click point, radius by drag distance |
| **Shift + Drag** | Constrain radius to horizontal or vertical axis |
| **Alt + Click/Drag** | Snap to grid and shape vertices |

---

### Triangle Tool (`Triangle`)
Draw arbitrary triangles with 3 clicks.

| Action | Description |
|--------|-------------|
| **Click 1** | Place first vertex |
| **Click 2** | Place second vertex |
| **Click 3** | Place third vertex and complete triangle |
| **Shift + Click** | Constrain point placement to ortho (H/V) from previous point |
| **Alt + Click** | Snap to grid and shape vertices |
| **Escape** | Cancel drawing and switch to select tool |

*Preview lines show the triangle shape as you place points.*

---

### Polygon Tool (`Hexagon`)
Draw regular hexagons (6-sided polygons) by click-and-drag.

| Action | Description |
|--------|-------------|
| **Click + Drag** | Draw hexagon with center at click point, radius by drag distance |
| **Shift + Drag** | Constrain radius to horizontal or vertical axis |
| **Alt + Click/Drag** | Snap to grid and shape vertices |

---

### Segment Tool (`Minus`)
Draw line segments by click-and-drag.

| Action | Description |
|--------|-------------|
| **Click + Drag** | Draw line from start point to end point |
| **Shift + Drag** | Force horizontal or vertical line (ortho mode) |
| **Alt + Click/Drag** | Snap to grid and shape vertices |
| *Auto-snap* | Lines automatically snap to H/V when within 5° |

---

### Trim Tool (`Scissors`)
Trim line segments at intersection points with other shapes.

| Action | Description |
|--------|-------------|
| **Click on segment** | Removes the portion of the segment between intersections |

*Works with segments intersecting rectangles and other segments.*

---

### Eraser Tool (`Eraser`)
Delete shapes by clicking on them.

| Action | Description |
|--------|-------------|
| **Click on shape** | Immediately delete the shape |

---

## Modifier Keys

### Shift Key - Ortho Mode
Hold **Shift** to enable orthographic constraints:

| Context | Effect |
|---------|--------|
| Drawing rectangle | Constrains to perfect square |
| Drawing circle/polygon | Constrains radius to H or V axis |
| Drawing segment | Forces horizontal or vertical line |
| Drawing triangle | Constrains point placement to H/V from previous point |
| Moving selected shape | Constrains movement to H or V axis |
| Dragging vertex | Constrains to axis (or makes segment H/V) |
| Rotating shape | Snaps to 90° increments |

*Visual guide: When Shift is held with a selected shape, red (horizontal) and green (vertical) axis lines appear.*

### Alt Key - Snap Mode
Hold **Alt** to enable snapping and disable vertex editing:

| Context | Effect |
|---------|--------|
| Drawing shapes | Snap to 20px grid |
| Near vertices | Snap to shape vertices (red circle highlight) |
| Near midpoints | Snap to edge midpoints (blue triangle highlight) |
| Moving shapes | Snap to grid positions |
| Vertex handles | **Hidden** - prevents accidental shape changes |

*When Alt is held: snap targets are highlighted, but vertex handles are hidden so you can only select and move shapes - not change their geometry.*

---

## Selection Modes

### Window Selection (Blue Box)
- Drag **downward** from empty space
- Creates a **blue** dashed selection box
- Only selects shapes **fully contained** within the box

### Crossing Selection (Green Box)
- Drag **upward** from empty space
- Creates a **green** dashed selection box
- Selects shapes that **intersect or are contained** within the box

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Escape** | Cancel current operation / Switch to select tool |
| **Right-click** (on empty) | Switch to select tool |

---

## Architecture

The application follows a modular architecture with encapsulated drawing tools:

```
src/
├── components/
│   ├── Canvas.tsx          # Main canvas component
│   ├── Toolbar.tsx         # Tool selection UI
│   ├── ShapeObj.tsx        # Shape renderer dispatcher
│   ├── shapes/             # Individual shape components
│   │   ├── RectShape.tsx
│   │   ├── CircleShape.tsx
│   │   ├── TriangleShape.tsx
│   │   ├── PolygonShape.tsx
│   │   └── SegmentShape.tsx
│   ├── tools/              # Drawing tool implementations
│   │   ├── DrawingTool.ts      # Base interface & DragDrawingTool class
│   │   ├── CircleDrawing.ts
│   │   ├── RectDrawing.ts
│   │   ├── TriangleDrawing.ts
│   │   ├── PolygonDrawing.ts
│   │   ├── SegmentDrawing.ts
│   │   └── useDrawingTools.ts  # Tool management hook
│   └── modes/              # Drawing modes
│       ├── OrthoMode.ts        # Orthographic constraints
│       └── AutoSnappingMode.tsx # Vertex/midpoint snapping
├── store/
│   └── useStore.ts         # Zustand state management
└── utils/
    └── geometry.ts         # Geometric calculations
```

### Drawing Tool Pattern
Each shape tool implements the `DrawingTool` interface:
- **Drag-based tools** (rect, circle, segment, polygon) extend `DragDrawingTool`
- **Click-based tools** (triangle) implement `DrawingTool` directly

This encapsulation keeps shape-specific logic out of the Canvas component.

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd cad

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

---

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Konva.js** - 2D canvas library
- **react-konva** - React bindings for Konva
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

---

## License

MIT
