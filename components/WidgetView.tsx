
import React from 'react';
import { RoadInfo } from '../services/geminiService';
import { Coordinates } from '../types';

interface WidgetViewProps {
  gpsData: {
    speed: number;
    bearing: number;
    accuracy: number;
    coords: Coordinates | null;
  };
  gpsSignalLevel: 'lost' | 'low' | 'medium' | 'high';
  roadInfo: Partial<RoadInfo>;
  displayLimit: number;
  isCritical: boolean;
  isSpeeding: boolean;
  isApproaching: boolean;
  widgetPos: { x: number; y: number };
  scale: number;
  opacity: number;
  clickThrough: boolean;
  isLocked: boolean;
  showPolice: boolean;
  handleTouchStart: (e: React.TouchEvent | React.MouseEvent) => void;
  handleTouchMove: (e: React.TouchEvent | React.MouseEvent) => void;
  handleTouchEnd: () => void;
  setShowSettings: (show: boolean) => void;
  setViewMode: (mode: 'full' | 'widget') => void;
}

const WidgetView: React.FC<WidgetViewProps> = ({
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
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  setShowSettings,
  setViewMode
}) => {
  return (
    <div
      className="w-full h-[100dvh] bg-transparent overflow-hidden touch-none"
      onMouseMove={handleTouchMove}
      onTouchMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onTouchEnd={handleTouchEnd}
    >
      <div
        style={{
          transform: `translate(${widgetPos.x}px, ${widgetPos.y}px) scale(${scale})`,
          opacity: opacity,
          touchAction: 'none'
        }}
        className={`absolute origin-top-left flex gap-3 p-2 pr-4 rounded-[2.5rem] shadow-2xl backdrop-blur-xl border-4 transition-colors cursor-move ${
          isCritical ? 'bg-red-900/90 border-red-500' :
          isSpeeding ? 'bg-red-900/80 border-red-800' :
          isApproaching ? 'bg-amber-900/80 border-amber-600' :
          'bg-slate-900/90 border-slate-700'
        } ${clickThrough ? 'pointer-events-none' : ''}`}
        onMouseDown={handleTouchStart}
        onTouchStart={handleTouchStart}
      >
         {/* Widget Speed */}
         <div className="flex flex-col items-center justify-center w-24 h-24 bg-black/40 rounded-full border border-white/10 relative">
            <span className="text-5xl font-black text-white leading-none tracking-tighter">{gpsData.speed}</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">MPH</span>
            {/* GPS Dot for Widget */}
            <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${gpsSignalLevel === 'high' ? 'bg-emerald-500' : gpsSignalLevel === 'medium' ? 'bg-amber-500' : 'bg-red-500'} ${gpsSignalLevel === 'lost' ? 'animate-ping' : ''}`} />
         </div>

         {/* Widget Info */}
         <div className="flex flex-col justify-center gap-1 min-w-[100px]">
            <div className="flex items-center justify-between mb-1">
               <div className="bg-white text-black px-2 py-0.5 rounded font-black text-xs">LIMIT {displayLimit}</div>
               <div className={`flex gap-2 ${clickThrough ? 'pointer-events-auto' : ''}`}>
                  {/* Controls embedded in widget */}
                  <button
                    onClick={() => setShowSettings(true)}
                    aria-label="Open Settings"
                    title="Settings"
                    className="min-w-[44px] min-h-[44px] p-1.5 bg-white/10 rounded-full hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 flex items-center justify-center"
                    onMouseDown={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
                  >
                     <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  </button>
                  <button
                    onClick={() => setViewMode('full')}
                    aria-label="Switch to Full Dashboard"
                    title="Full Mode"
                    className="min-w-[44px] min-h-[44px] p-1.5 bg-white/10 rounded-full hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 flex items-center justify-center"
                    onMouseDown={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
                  >
                     <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
                  </button>
               </div>
            </div>
            <div className="text-[10px] font-bold text-slate-300 truncate max-w-[120px]">{roadInfo.roadName}</div>
            {showPolice && roadInfo.policeDistrict && <div className="text-[9px] font-mono text-indigo-300">{roadInfo.policeDistrict}</div>}
            {isLocked && <div className="text-[8px] text-red-400 font-black uppercase tracking-widest mt-1">LOCKED</div>}
            {clickThrough && <div className="text-[8px] text-blue-400 font-black uppercase tracking-widest mt-1">CLICK-THRU</div>}
         </div>
      </div>
    </div>
  );
};

export default React.memo(WidgetView);
