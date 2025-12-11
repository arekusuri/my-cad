import React, { useState, useCallback, useRef, useEffect } from 'react';

interface CompassRulerProps {
  radius: number;
  onRadiusChange: (radius: number) => void;
  isDrawing: boolean;
}

const MIN_RADIUS = 10;
const MAX_RADIUS = 400;
const RULER_WIDTH = 500;
const RULER_HEIGHT = 120;
const COMPASS_PIVOT_Y = 25;

/**
 * Compass ruler UI component for setting the compass radius.
 * Shows a ruler with a compass graphic that can be adjusted by dragging.
 */
export const CompassRuler: React.FC<CompassRulerProps> = ({ 
  radius, 
  onRadiusChange,
  isDrawing 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [inputValue, setInputValue] = useState(Math.round(radius).toString());
  const rulerRef = useRef<HTMLDivElement>(null);

  // Update input when radius changes externally
  useEffect(() => {
    if (!isDragging) {
      setInputValue(Math.round(radius).toString());
    }
  }, [radius, isDragging]);

  // Calculate compass leg positions based on radius
  // Scale the visual spread to fit within ruler
  const visualSpread = Math.min(radius * 0.6, (RULER_WIDTH - 40) / 2);
  const pivotX = RULER_WIDTH / 2;
  const leftLegX = pivotX - visualSpread;
  const rightLegX = pivotX + visualSpread;
  
  // Leg length (from pivot to tip)
  const legLength = 55;
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !rulerRef.current) return;
    
    const rect = rulerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    // Calculate distance from center and convert to radius
    const distFromCenter = Math.abs(mouseX - RULER_WIDTH / 2);
    const newRadius = Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, distFromCenter / 0.6));
    
    onRadiusChange(Math.round(newRadius));
    setInputValue(Math.round(newRadius).toString());
  }, [isDragging, onRadiusChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const value = parseInt(inputValue, 10);
    if (!isNaN(value)) {
      const clampedValue = Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, value));
      onRadiusChange(clampedValue);
      setInputValue(clampedValue.toString());
    } else {
      setInputValue(Math.round(radius).toString());
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

  // Generate ruler ticks
  const ticks = [];
  const tickSpacing = 25;
  for (let i = 0; i <= RULER_WIDTH; i += tickSpacing) {
    const isMajor = i % (tickSpacing * 4) === 0;
    const value = Math.round((i - RULER_WIDTH / 2) / 0.6);
    ticks.push(
      <div
        key={i}
        className="absolute bottom-0"
        style={{ left: i }}
      >
        <div 
          className={`w-px ${isMajor ? 'bg-amber-700 h-3' : 'bg-amber-500 h-2'}`}
        />
        {isMajor && i !== 0 && i !== RULER_WIDTH && (
          <span className="absolute -translate-x-1/2 text-[9px] text-amber-700 font-medium" style={{ bottom: -14 }}>
            {Math.abs(value)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20">
      {/* Instructions */}
      <div className="text-center mb-2 text-sm text-gray-600 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm">
        {isDrawing 
          ? '🎯 Click start → Click end → Repeat. Right-click or Esc to finish'
          : '📐 Drag compass to set radius, then click canvas to place center'
        }
      </div>
      
      {/* Ruler container */}
      <div 
        ref={rulerRef}
        className="relative rounded-xl shadow-xl border-2 border-amber-300 overflow-hidden select-none"
        style={{ 
          width: RULER_WIDTH, 
          height: RULER_HEIGHT,
          background: 'linear-gradient(180deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)',
        }}
      >
        {/* Wood grain texture */}
        <div className="absolute inset-0 opacity-20" 
          style={{
            backgroundImage: `
              repeating-linear-gradient(90deg, transparent 0px, transparent 3px, rgba(180, 120, 60, 0.3) 3px, rgba(180, 120, 60, 0.3) 4px),
              repeating-linear-gradient(0deg, transparent 0px, transparent 8px, rgba(180, 120, 60, 0.1) 8px, rgba(180, 120, 60, 0.1) 9px)
            `,
          }}
        />
        
        {/* Compass graphic */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={RULER_WIDTH}
          height={RULER_HEIGHT}
        >
          {/* Compass body shadow */}
          <ellipse
            cx={pivotX}
            cy={COMPASS_PIVOT_Y + 3}
            rx={12}
            ry={4}
            fill="rgba(0,0,0,0.15)"
          />
          
          {/* Left leg */}
          <line
            x1={pivotX - 2}
            y1={COMPASS_PIVOT_Y + 5}
            x2={leftLegX}
            y2={COMPASS_PIVOT_Y + legLength}
            stroke="#374151"
            strokeWidth={4}
            strokeLinecap="round"
          />
          <line
            x1={pivotX - 2}
            y1={COMPASS_PIVOT_Y + 5}
            x2={leftLegX}
            y2={COMPASS_PIVOT_Y + legLength}
            stroke="#6b7280"
            strokeWidth={2}
            strokeLinecap="round"
          />
          
          {/* Left leg pencil tip */}
          <polygon
            points={`${leftLegX},${COMPASS_PIVOT_Y + legLength} ${leftLegX - 5},${COMPASS_PIVOT_Y + legLength + 14} ${leftLegX + 5},${COMPASS_PIVOT_Y + legLength + 14}`}
            fill="#fbbf24"
            stroke="#b45309"
            strokeWidth={1}
          />
          <polygon
            points={`${leftLegX},${COMPASS_PIVOT_Y + legLength + 10} ${leftLegX - 2},${COMPASS_PIVOT_Y + legLength + 18} ${leftLegX + 2},${COMPASS_PIVOT_Y + legLength + 18}`}
            fill="#1f2937"
          />
          
          {/* Right leg */}
          <line
            x1={pivotX + 2}
            y1={COMPASS_PIVOT_Y + 5}
            x2={rightLegX}
            y2={COMPASS_PIVOT_Y + legLength}
            stroke="#374151"
            strokeWidth={4}
            strokeLinecap="round"
          />
          <line
            x1={pivotX + 2}
            y1={COMPASS_PIVOT_Y + 5}
            x2={rightLegX}
            y2={COMPASS_PIVOT_Y + legLength}
            stroke="#6b7280"
            strokeWidth={2}
            strokeLinecap="round"
          />
          
          {/* Right leg needle tip */}
          <line
            x1={rightLegX}
            y1={COMPASS_PIVOT_Y + legLength}
            x2={rightLegX}
            y2={COMPASS_PIVOT_Y + legLength + 18}
            stroke="#9ca3af"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <circle
            cx={rightLegX}
            cy={COMPASS_PIVOT_Y + legLength + 18}
            r={2}
            fill="#6b7280"
          />
          
          {/* Compass pivot/hinge */}
          <circle
            cx={pivotX}
            cy={COMPASS_PIVOT_Y}
            r={10}
            fill="url(#metalGradient)"
            stroke="#374151"
            strokeWidth={2}
          />
          <circle
            cx={pivotX}
            cy={COMPASS_PIVOT_Y}
            r={4}
            fill="#1f2937"
          />
          
          {/* Metal gradient for pivot */}
          <defs>
            <radialGradient id="metalGradient" cx="30%" cy="30%">
              <stop offset="0%" stopColor="#e5e7eb" />
              <stop offset="50%" stopColor="#9ca3af" />
              <stop offset="100%" stopColor="#6b7280" />
            </radialGradient>
          </defs>
          
          {/* Radius arc indicator */}
          <path
            d={`M ${leftLegX} ${COMPASS_PIVOT_Y + legLength + 10} A ${visualSpread} ${visualSpread} 0 0 1 ${rightLegX} ${COMPASS_PIVOT_Y + legLength + 10}`}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="6 3"
            opacity={0.7}
          />
        </svg>
        
        {/* Drag handles (invisible but clickable) */}
        <div
          className="absolute cursor-ew-resize"
          style={{
            left: leftLegX - 15,
            top: COMPASS_PIVOT_Y + legLength - 10,
            width: 30,
            height: 40,
          }}
          onMouseDown={handleMouseDown}
        />
        <div
          className="absolute cursor-ew-resize"
          style={{
            left: rightLegX - 15,
            top: COMPASS_PIVOT_Y + legLength - 10,
            width: 30,
            height: 40,
          }}
          onMouseDown={handleMouseDown}
        />
        
        {/* Center drag area */}
        <div
          className="absolute cursor-ew-resize"
          style={{
            left: leftLegX,
            top: 0,
            width: rightLegX - leftLegX,
            height: RULER_HEIGHT - 25,
          }}
          onMouseDown={handleMouseDown}
        />
        
        {/* Ruler scale at bottom */}
        <div className="absolute bottom-5 left-0 right-0 h-4 border-t-2 border-amber-600">
          {ticks}
        </div>
        
        {/* Radius input */}
        <div className="absolute top-2 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm border border-amber-300">
          <span className="text-xs text-amber-800 font-medium">r =</span>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="w-12 px-1 py-0.5 text-sm font-mono text-center bg-transparent border-b border-amber-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        
        {/* Drag hint */}
        {!isDragging && (
          <div className="absolute top-2 left-3 text-[10px] text-amber-700/70 flex items-center gap-1">
            <span>↔</span>
            <span>Drag to adjust</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Store for compass radius (persists across tool switches)
let globalCompassRadius = 100;

export function getCompassRadius(): number {
  return globalCompassRadius;
}

export function setCompassRadius(radius: number): void {
  globalCompassRadius = radius;
}

