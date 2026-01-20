import React, { useRef, useCallback } from 'react';
import { useApp } from '../contexts/AppProvider';
import RoadBadge from './RoadBadge';
import SignalBars from './SignalBars';

// 44x44px touch targets enforced.
// Focus rings enforced.

const WidgetView: React.FC = () => {
  const {
    gpsData,
    gpsSignalLevel,
    roadInfo,
    displayLimit,
    isCritical,
    isSpeeding,
    isApproaching,
    widgetPos,
    scale,
    opacity,
    clickThrough,
    isLocked,
    showPolice,
    setViewMode,
    setShowSettings,
    setWidgetPos
  } = useApp();

  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const lastTouchMoveTime = useRef(0);

  // --- Drag Handling (Re-implemented locally or using context actions if they existed, but context has setWidgetPos) ---
  // Since drag logic relies on event objects, we'll keep the handlers here but update the state via context.

  const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (isLocked || clickThrough) return;
    isDragging.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    dragOffset.current = { x: clientX - widgetPos.x, y: clientY - widgetPos.y };
  }, [isLocked, clickThrough, widgetPos.x, widgetPos.y]);

  const handleTouchMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging.current || isLocked || clickThrough) return;

    const now = Date.now();
    if (now - lastTouchMoveTime.current < 16) return;
    lastTouchMoveTime.current = now;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    let newX = clientX - dragOffset.current.x;
    let newY = clientY - dragOffset.current.y;

    const maxX = window.innerWidth - 50;
    const maxY = window.innerHeight - 50;
    newX = Math.max(-50, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    setWidgetPos({ x: newX, y: newY });
  }, [isLocked, clickThrough, setWidgetPos]);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  const borderColor = isCritical ? 'border-red-600' : isSpeeding ? 'border-red-500' : isApproaching ? 'border-amber-400' : 'border-slate-600/50';
  const shadowColor = isCritical ? 'shadow-[0_0_20px_rgba(220,38,38,0.5)]' : isSpeeding ? 'shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'shadow-xl';

  return (
    <div
      className="fixed z-50 transition-transform duration-75 select-none touch-none"
      style={{
          left: `${widgetPos.x}px`,
          top: `${widgetPos.y}px`,
          opacity: opacity,
          transform: `scale(${scale})`,
          pointerEvents: clickThrough ? 'none' : 'auto'
      }}
      onTouchStart={handleTouchStart}
      onMouseDown={handleTouchStart}
      onTouchMove={handleTouchMove}
      onMouseMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      <div className={`relative bg-slate-900/90 backdrop-blur-md rounded-[2.5rem] p-4 flex items-center gap-4 border-2 transition-all duration-300 ${borderColor} ${shadowColor} w-64`}>

          {/* Signal Indicator (Small) */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-black/50 px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1.5 backdrop-blur-md">
             <SignalBars level={gpsSignalLevel} />
             {showPolice && roadInfo.policeDistrict && (
                 <span className="text-[8px] font-black text-blue-200 bg-blue-900/50 px-1 rounded">{roadInfo.policeDistrict}</span>
             )}
          </div>

          {/* Current Speed */}
          <div className="flex-1 text-center">
            <div className={`text-6xl font-black tracking-tighter tabular-nums leading-none ${isSpeeding ? 'text-red-50' : 'text-white'}`}>
                {Math.round(gpsData.speed)}
            </div>
            <div className="text-[10px] font-bold text-slate-400 tracking-[0.3em]">MPH</div>
          </div>

          {/* Divider */}
          <div className="w-[1px] h-12 bg-white/10"></div>

          {/* Limit */}
          <div className="flex-1 flex justify-center">
             <RoadBadge limit={displayLimit} size="small" />
          </div>

          {/* Controls Overlay (Only visible when not locked) */}
          {!isLocked && !clickThrough && (
             <div className="absolute -bottom-14 left-0 w-full flex justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity p-2">
                 <button
                    onClick={() => setViewMode('full')}
                    className="p-3 bg-black/80 rounded-full text-white hover:bg-black border border-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-blue-400"
                    aria-label="Maximize to Dashboard"
                 >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
                 </button>
                 <button
                    onClick={() => setShowSettings(true)}
                    className="p-3 bg-black/80 rounded-full text-white hover:bg-black border border-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-blue-400"
                    aria-label="Open Widget Settings"
                 >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
                 </button>
             </div>
          )}
      </div>
    </div>
  );
};

export default WidgetView;
