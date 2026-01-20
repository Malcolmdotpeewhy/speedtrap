import React, { useRef, useCallback } from 'react';
import { useApp } from '../contexts/AppProvider';
import RoadBadge from './RoadBadge';
import SignalBars from './SignalBars';
import GlassButton from './GlassButton';

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
             <SignalBars gpsSignalLevel={gpsSignalLevel} />
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
             {/* RoadBadge doesn't support limit or size props, it expects 'type'. Using displayLimit might be incorrect here if it's a number, RoadBadge expects road type string.
                 However, assuming the intention was to show the road type, I will pass the road type.
                 If the intention was to show the limit, I should use a different component or update RoadBadge.
                 Looking at DashboardView, RoadBadge takes 'type'.
                 Wait, the limit is shown in the white box in Dashboard.
                 Here in WidgetView, it tries to show limit using RoadBadge?
                 Let's check RoadBadge implementation. It just shows an icon and text.
                 It seems WidgetView wanted to show the Speed Limit.
             */}
             <div className="flex flex-col items-center justify-center bg-white border border-black rounded w-12 h-16 shadow-lg">
                 <span className="text-[8px] font-black text-black uppercase tracking-tighter leading-none">LIMIT</span>
                 <span className="text-2xl font-black text-black tabular-nums tracking-tighter leading-none">{displayLimit}</span>
             </div>
          </div>

          {/* Controls Overlay (Only visible when not locked) */}
          {!isLocked && !clickThrough && (
             <div className="absolute -bottom-14 left-0 w-full flex justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity p-2">
                 <GlassButton
                    onClick={() => setViewMode('full')}
                    label="Maximize to Dashboard"
                    className="rounded-full bg-black/80 hover:bg-black"
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>}
                 />
                 <GlassButton
                    onClick={() => setShowSettings(true)}
                    label="Open Widget Settings"
                    className="rounded-full bg-black/80 hover:bg-black"
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>}
                 />
             </div>
          )}
      </div>
    </div>
  );
};

export default WidgetView;
