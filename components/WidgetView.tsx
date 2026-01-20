import React, { useRef, useCallback, useState } from 'react';
import { useApp } from '../contexts/AppProvider';
import SignalBars from './SignalBars';
import GlassButton from './GlassButton';
import { Menu, Maximize2, Settings } from 'lucide-react';

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

  const [menuOpen, setMenuOpen] = useState(false);

  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const lastTouchMoveTime = useRef(0);

  const handleDragStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (isLocked || clickThrough) return;
    isDragging.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    dragOffset.current = { x: clientX - widgetPos.x, y: clientY - widgetPos.y };
  }, [isLocked, clickThrough, widgetPos.x, widgetPos.y]);

  const handleDragMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
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

  const handleDragEnd = useCallback(() => {
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
    >
      <div className={`relative bg-slate-900/95 backdrop-blur-xl rounded-[2.5rem] p-4 flex flex-col items-center border-2 transition-all duration-300 ${borderColor} ${shadowColor} min-w-[280px]`}>

          {/* Drag Handle (Top) */}
          {!isLocked && !clickThrough && (
            <div
                className="w-full h-6 flex items-center justify-center cursor-move absolute top-0 left-0 rounded-t-[2.5rem]"
                onTouchStart={handleDragStart}
                onMouseDown={handleDragStart}
                onTouchMove={handleDragMove}
                onMouseMove={handleDragMove}
                onTouchEnd={handleDragEnd}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                aria-label="Drag Handle"
            >
                <div className="w-12 h-1 bg-white/20 rounded-full" />
            </div>
          )}

          {/* Status Bar */}
          <div className="flex items-center justify-between w-full mb-2 mt-2 px-2">
             <div className="flex items-center gap-1.5">
                <SignalBars gpsSignalLevel={gpsSignalLevel} />
                {showPolice && roadInfo.policeDistrict && (
                    <span className="text-[9px] font-black text-blue-200 bg-blue-900/50 px-1.5 py-0.5 rounded tracking-wider">{roadInfo.policeDistrict}</span>
                )}
             </div>

             {!isLocked && !clickThrough && (
                 <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 active:bg-blue-500/20 text-white transition-colors touch-target-min"
                    aria-label="Toggle Widget Menu"
                 >
                    <Menu size={16} />
                 </button>
             )}
          </div>

          <div className="flex items-center justify-between w-full gap-4">
              {/* Current Speed */}
              <div className="flex-1 text-center pl-2">
                <div className={`text-7xl font-black tracking-tighter tabular-nums leading-none ${isSpeeding ? 'text-red-50' : 'text-white'}`}>
                    {Math.round(gpsData.speed)}
                </div>
                <div className="text-[11px] font-bold text-slate-400 tracking-[0.3em] uppercase">MPH</div>
              </div>

              {/* Divider */}
              <div className="w-[1px] h-16 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

              {/* Limit */}
              <div className="flex-1 flex justify-center pr-2">
                 <div className="stark-limit-sign w-16 h-20 rounded-lg">
                     <span className="text-[9px] font-black text-black uppercase tracking-tighter leading-none mb-0.5">LIMIT</span>
                     <span className="text-4xl font-black text-black tabular-nums tracking-tighter leading-none">{displayLimit}</span>
                 </div>
              </div>
          </div>

          {/* Collapsible Menu */}
          {menuOpen && !isLocked && !clickThrough && (
             <div className="w-full flex justify-center gap-3 mt-4 animate-in slide-in-from-top-2 fade-in duration-200 border-t border-white/5 pt-3">
                 <GlassButton
                    onClick={() => setViewMode('full')}
                    label="Maximize"
                    className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 h-10 min-h-[44px]"
                    icon={<Maximize2 size={18} />}
                 />
                 <GlassButton
                    onClick={() => setShowSettings(true)}
                    label="Settings"
                    className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 h-10 min-h-[44px]"
                    icon={<Settings size={18} />}
                 />
             </div>
          )}
      </div>
    </div>
  );
};

export default WidgetView;
