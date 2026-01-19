
import React from 'react';
import { RoadInfo } from '../services/geminiService';
import RoadBadge from './RoadBadge';
import SignalBars from './SignalBars';
import { Coordinates } from '../types';

interface DashboardViewProps {
  gpsData: {
    speed: number;
    bearing: number;
    accuracy: number;
    coords: Coordinates | null;
  };
  gpsSignalLevel: 'lost' | 'low' | 'medium' | 'high';
  roadInfo: Partial<RoadInfo>;
  isCached: boolean;
  error: string | null;
  isUpdating: boolean;
  loggingEnabled: boolean;
  showPolice: boolean;
  showContext: boolean;
  displayLimit: number;
  isCritical: boolean;
  isSpeeding: boolean;
  isApproaching: boolean;
  setViewMode: (mode: 'full' | 'widget') => void;
  setShowSettings: (show: boolean) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  gpsData,
  gpsSignalLevel,
  roadInfo,
  isCached,
  error,
  isUpdating,
  loggingEnabled,
  showPolice,
  showContext,
  displayLimit,
  isCritical,
  isSpeeding,
  isApproaching,
  setViewMode,
  setShowSettings
}) => {
  const themeClass = isCritical ? 'theme-critical' : isSpeeding ? 'theme-speeding' : isApproaching ? 'theme-approaching' : 'theme-normal';

  return (
    <div className={`flex flex-col h-[100dvh] w-full transition-all duration-700 p-6 text-white overflow-hidden select-none dashboard-container ${themeClass}`}>

      <div className="flex justify-between items-start z-20">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black italic tracking-tighter text-white">DRIVE<span className="text-blue-500">PRO</span></h1>
            {isCached && (
              <span className="flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest transition-all duration-500">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Cached
              </span>
            )}
            {error && error.includes('Quota') && <span className="text-[8px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-black uppercase tracking-widest animate-pulse">OFFLINE</span>}
            {gpsSignalLevel === 'lost' && <span className="text-[8px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-black uppercase tracking-widest animate-pulse">GPS LOST</span>}
          </div>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isUpdating ? 'bg-blue-400 animate-ping' : error && error.includes('Quota') ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                {isUpdating ? 'Gemini Syncing...' : error ? error : 'Local Engine'}
                </span>
            </div>

            <div className="flex items-center gap-2 pl-4 border-l border-white/10">
                <SignalBars gpsSignalLevel={gpsSignalLevel} />
                <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${gpsData.accuracy > 50 ? 'text-red-400' : 'text-slate-400'}`}>
                    ±{Math.round(gpsData.accuracy)}m
                </span>
            </div>

            {loggingEnabled && (
               <div className="flex items-center gap-1 ml-2 bg-red-500/10 border border-red-500/30 px-1.5 py-0.5 rounded animate-pulse">
                 <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                 <span className="text-[8px] font-black text-red-400 uppercase tracking-wider">REC</span>
               </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
            <button
              onClick={() => setViewMode('widget')}
              aria-label="Switch to Widget Mode"
              title="Widget Mode"
              className="min-w-[44px] min-h-[44px] p-3 bg-white/5 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 flex items-center justify-center"
            >
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              aria-label="Open Settings"
              title="Settings"
              className="min-w-[44px] min-h-[44px] p-3 bg-white/5 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 flex items-center justify-center"
            >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
            </button>
        </div>
      </div>

      <div className={`mt-8 bg-black/40 backdrop-blur-2xl border rounded-[2rem] p-6 shadow-2xl relative overflow-hidden transition-colors duration-700 ${isCached ? 'border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'border-white/5'}`}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <RoadBadge type={roadInfo.roadType || 'Scanning'} />

            {showPolice && roadInfo.policeDistrict && (
              <div className="flex items-center gap-1.5 bg-indigo-900/40 border border-indigo-500/30 px-2.5 py-1 rounded-full text-indigo-200">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M12 1L3 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-9-4z" opacity="0.4"/>
                   <path d="M12 8.5l2.5 1.5-1 3 2.5.5-2.5 1.5.5 3-2.5-2-2.5 2 .5-3-2.5-1.5 2.5-.5-1-3 2.5-1.5z" />
                </svg>
                <span className="text-[10px] font-black uppercase tracking-wider leading-none pt-[1px]">{roadInfo.policeDistrict}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-slate-700 rounded-sm rotate-45" style={{ transform: `rotate(${gpsData.bearing}deg)` }} />
            <span className="text-[9px] font-mono text-slate-500 uppercase">{Math.round(gpsData.bearing)}° HEAD</span>
          </div>
        </div>

        <h2 className="text-2xl font-black truncate leading-tight tracking-tight mb-2">{roadInfo.roadName}</h2>

        <div className="flex items-center gap-2 mt-1 mb-2">
          <span className="text-[9px] font-mono text-blue-400/80 uppercase tracking-widest font-bold">Engine: {roadInfo.confidence || 'Detecting'}</span>
          <div className="flex-1 h-[1px] bg-white/5" />
        </div>

        {showContext && (
          <p className="text-[11px] font-bold text-slate-300 leading-snug italic opacity-80 border-l-2 border-blue-500 pl-2">
            {roadInfo.context}
          </p>
        )}

        <div className="mt-6">
          <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
            <span>Current</span>
            <span>Path Forecast (5mi)</span>
          </div>
          <div className="relative h-2 w-full bg-slate-800 rounded-full overflow-hidden flex items-center mt-3">
            <div className="absolute left-0 w-1 h-full bg-blue-500 z-10 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>

            {(!roadInfo.futureSegments || roadInfo.futureSegments.length === 0) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] animate-pulse">Scanning path for speed changes...</span>
              </div>
            )}

            {roadInfo.futureSegments?.map((seg, idx) => {
              const leftPos = Math.min((seg.distanceMiles / 5) * 100, 95);
              const limitDiff = seg.limit - (displayLimit || 0);
              let bgColor = 'bg-slate-700';
              let borderColor = 'border-slate-500';
              let Icon = null;

              if (limitDiff > 0) {
                bgColor = 'bg-emerald-500';
                borderColor = 'border-emerald-300';
                Icon = (
                  <div className="absolute -top-7 flex flex-col items-center">
                   <svg className="w-4 h-4 text-emerald-400 drop-shadow-md mb-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L4.5 10H9V18H15V10H19.5L12 2Z" />
                   </svg>
                  </div>
                );
              } else if (limitDiff < 0) {
                bgColor = 'bg-rose-500';
                borderColor = 'border-rose-300';
                Icon = (
                  <div className="absolute -top-7 flex flex-col items-center">
                   <svg className="w-4 h-4 text-rose-400 drop-shadow-md mb-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 22L19.5 14H15V6H9V14H4.5L12 22Z" />
                   </svg>
                  </div>
                );
              } else {
                 bgColor = 'bg-blue-500';
                 borderColor = 'border-blue-300';
                 Icon = (
                    <div className="w-1 h-1 bg-white rounded-full absolute -top-3" />
                 );
              }

              return (
                <div
                  key={idx}
                  className={`absolute h-4 w-4 rounded-full border-2 ${borderColor} z-20 flex items-center justify-center transition-all ${bgColor} shadow-lg`}
                  style={{ left: `${leftPos}%` }}
                >
                  {Icon}
                  <span className="absolute top-5 text-[9px] font-black text-white bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-md whitespace-nowrap border border-white/10">
                    {seg.limit} <span className="text-[7px] text-slate-300">MPH</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className={`relative w-[340px] h-[340px] rounded-full border-[16px] flex flex-col items-center justify-center transition-all duration-500 ${
          isCritical ? 'border-white scale-105' :
          isSpeeding ? 'border-red-500' :
          isApproaching ? 'border-amber-500 scale-[0.98]' :
          'border-slate-800'
        }`}>
          <span className={`text-[140px] font-black tracking-tighter tabular-nums leading-none transition-all duration-300 ${
            isApproaching ? 'text-amber-400 scale-95' : 'text-white'
          }`}>
            {gpsData.speed}
          </span>
          <span className="text-xl font-black uppercase tracking-[0.5em] text-slate-500">MPH</span>
        </div>

        <div className={`absolute -bottom-10 bg-white rounded-2xl border-[10px] w-36 h-48 flex flex-col items-center justify-center shadow-2xl transition-all duration-500 ${
          isCritical ? 'border-red-600 scale-110' :
          isSpeeding ? 'border-red-600' :
          isApproaching ? 'border-amber-400 animate-pulse shadow-[0_0_40px_rgba(251,191,36,0.5)]' :
          'border-black'
        }`}>
          <span className="text-black font-black text-[12px] uppercase tracking-tighter mb-2 text-center">SPEED<br/>LIMIT</span>
          <span className="text-8xl font-black text-black tabular-nums tracking-tighter">{displayLimit}</span>
        </div>
      </div>

      <div className="mt-12 flex justify-between items-center opacity-30 text-[9px] font-mono">
        <div>LOC: {gpsData.coords?.latitude.toFixed(4)}, {gpsData.coords?.longitude.toFixed(4)}</div>
        <div className="text-right uppercase">Predictive Engine v5.4 • DB Cache Hybrid</div>
      </div>
    </div>
  );
};

export default React.memo(DashboardView);
