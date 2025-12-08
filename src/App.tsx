import { useEffect, useState } from 'react';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { Properties } from './components/Properties';
import { useStore } from './store/useStore';

function App() {
  console.log('App rendering...');
  const setShiftPressed = useStore((state) => state.setShiftPressed);
  const deleteShape = useStore((state) => state.deleteShape);
  const selectedIds = useStore((state) => state.selectedIds);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftPressed(true);
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
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setShiftPressed, deleteShape, selectedIds]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-gray-50">
      {isMounted && <div className="fixed top-0 right-0 bg-green-500 text-white p-2 z-50">React Mounted</div>}
      <Toolbar />
      <Properties />
      <Canvas />
    </div>
  );
}

export default App;
