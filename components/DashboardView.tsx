import React from 'react';
import { useApp } from '../contexts/AppProvider';
import RoadBadge from './RoadBadge';
import SignalBars from './SignalBars';
import { WidgetIcon, SettingsIcon } from './Icons';
import PathForecast from './PathForecast';

const DashboardView: React.FC = () => {
  const {
    gpsData,
    gpsSignalLevel,
    roadInfo,
    isCached,
    gpsError,
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
  } = useApp();

  // Theme logic mapping directly to Tailwind classes
  const themeClass = isCritical ? 'bg-red-600'
                   : isSpeeding ? 'bg-red-950'
                   : isApproaching ? 'bg-amber-950/60'
                   : 'bg-slate-950';

  return (
    <div className={`flex flex-col h-[100dvh] w-full transition-colors duration-700 p-6 text-white overflow-hidden select-none dashboard-container ${themeClass}`}>

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
            {gpsError && gpsError.includes('Quota') && <span className="text-[8px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-black uppercase tracking-widest animate-pulse">OFFLINE</span>}
            {gpsSignalLevel === 'lost' && <span className="text-[8px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-black uppercase tracking-widest animate-pulse">GPS LOST</span>}
          </div>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isUpdating ? 'bg-blue-400 animate-ping' : gpsError && gpsError.includes('Quota') ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                {isUpdating ? 'Gemini Syncing...' : gpsError ? gpsError : 'Local Engine'}
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
               <WidgetIcon className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              aria-label="Open Settings"
              title="Settings"
              className="min-w-[44px] min-h-[44px] p-3 bg-white/5 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 flex items-center justify-center"
            >
              <SettingsIcon className="w-5 h-5 text-white" />
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

        <PathForecast roadInfo={roadInfo} displayLimit={displayLimit} />
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

export default DashboardView;
