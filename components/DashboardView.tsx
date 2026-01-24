import React from 'react';
import { useApp } from '../contexts/AppProvider';
import RoadBadge from './RoadBadge';
import { WidgetIcon, SettingsIcon } from './Icons';
import PathForecast from './PathForecast';
import SystemStatus from './SystemStatus';
import GlassButton from './GlassButton';

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
          <SystemStatus
            isCached={isCached}
            gpsError={gpsError}
            gpsSignalLevel={gpsSignalLevel}
            isUpdating={isUpdating}
            gpsAccuracy={gpsData.accuracy}
            loggingEnabled={loggingEnabled}
          />
        </div>
        <div className="flex gap-2">
          <GlassButton
            onClick={() => setViewMode('widget')}
            label="Switch to Widget Mode"
            icon={<WidgetIcon className="w-5 h-5 text-white" />}
          />
          <GlassButton
            onClick={() => setShowSettings(true)}
            label="Open Settings"
            icon={<SettingsIcon className="w-5 h-5 text-white" />}
          />
        </div>
      </div>

      <div className={`mt-8 stark-glass-panel rounded-[2rem] p-6 relative overflow-hidden transition-colors duration-700 ${isCached ? 'border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'border-white/5'}`}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <RoadBadge type={roadInfo.roadType || 'Scanning'} />

            {showPolice && roadInfo.policeDistrict && (
              <div className="flex items-center gap-1.5 bg-indigo-900/40 border border-indigo-500/30 px-2.5 py-1 rounded-full text-indigo-200">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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

        <h2 className="type-headline-large truncate mb-2">{roadInfo.roadName || 'Scanning Road...'}</h2>

        {showContext && (
          <p className="text-[14px] font-bold text-slate-300 leading-snug italic opacity-80 border-l-2 border-blue-500 pl-2 mt-2">
            {roadInfo.context}
          </p>
        )}

        <PathForecast roadInfo={roadInfo} displayLimit={displayLimit} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* Speed Ring */}
        <div className={`relative w-[340px] h-[340px] rounded-full border-[16px] flex flex-col items-center justify-center transition-all duration-500 ${
          isCritical ? 'border-white scale-105 shadow-[0_0_50px_rgba(255,255,255,0.2)]' :
          isSpeeding ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]' :
          isApproaching ? 'border-amber-500 scale-[0.98]' :
          'border-slate-800'
        }`}>
          <span className={`stark-display-speed text-[180px] transition-all duration-300 ${
            isApproaching ? 'text-amber-400 scale-95' : 'text-white'
          }`}>
            {Math.round(gpsData.speed)}
          </span>
          <span className="type-label-small tracking-[0.5em] text-slate-500 mt-[-10px]">MPH</span>
        </div>

        {/* Speed Limit Sign - Stark Regulatory Style */}
        <div className={`absolute -bottom-10 stark-limit-sign w-40 h-52 rounded-2xl transition-all duration-500 ${
          isCritical ? 'border-red-600 scale-110' :
          isSpeeding ? 'border-red-600' :
          isApproaching ? 'border-amber-400 animate-pulse shadow-[0_0_40px_rgba(251,191,36,0.5)]' :
          'border-black'
        }`}>
          <span className="text-[14px] font-black uppercase tracking-tighter mb-2 text-center leading-none mt-2">SPEED<br/>LIMIT</span>
          <span className="text-[100px] font-black tracking-tighter leading-none mb-4">{displayLimit}</span>
        </div>
      </div>

      <div className="mt-12 flex justify-between items-center opacity-30 text-[9px] font-mono">
        <div>LOC: {gpsData.coords?.latitude.toFixed(5)}, {gpsData.coords?.longitude.toFixed(5)}</div>
      </div>
    </div>
  );
};

export default DashboardView;
