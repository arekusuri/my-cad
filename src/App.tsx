import { useEffect, useState, useCallback } from 'react';
import { Canvas } from './Canvas';
import { Toolbar } from './components/lib/Toolbar';
import { Properties } from './components/lib/Properties';
import { CompassRuler, setCompassRadius, getCompassRadius } from './components/lib/CompassRuler';
import { useStore } from './store/useStore';

function App() {
  const setShiftPressed = useStore((state) => state.setShiftPressed);
  const setAltPressed = useStore((state) => state.setAltPressed);
  const deleteShape = useStore((state) => state.deleteShape);
  const selectedIds = useStore((state) => state.selectedIds);
  const tool = useStore((state) => state.tool);
  
  // Compass radius state (synced with global)
  const [compassRadius, setLocalCompassRadius] = useState(getCompassRadius());
  
  const handleRadiusChange = useCallback((radius: number) => {
    setLocalCompassRadius(radius);
    setCompassRadius(radius);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftPressed(true);
      }
      if (e.key === 'Alt') {
        setAltPressed(true);
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
          const activeTag = document.activeElement?.tagName.toLowerCase();
          if (activeTag !== 'input' && activeTag !== 'textarea') {
              selectedIds.forEach(id => deleteShape(id));
          }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftPressed(false);
      }
      if (e.key === 'Alt') {
        setAltPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setShiftPressed, setAltPressed, deleteShape, selectedIds]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-gray-50">
      <Toolbar />
      <Properties />
      <Canvas />
      {/* Compass ruler - show when compass tool is selected */}
      {tool === 'compass' && (
        <CompassRuler 
          radius={compassRadius}
          onRadiusChange={handleRadiusChange}
          isDrawing={false}
        />
      )}
    </div>
  );
}

export default App;
