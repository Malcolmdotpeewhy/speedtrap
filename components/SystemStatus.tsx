import React from 'react';
import SignalBars from './SignalBars';

interface SystemStatusProps {
  isCached: boolean;
  gpsError: string | null;
  gpsSignalLevel: 'high' | 'medium' | 'low' | 'lost';
  isUpdating: boolean;
  gpsAccuracy: number;
  loggingEnabled: boolean;
}

/**
 * SystemStatus
 * Consolidates system health indicators (GPS, Network, Cache, Logging).
 * Handles loading, error, and content states for system status.
 */
const SystemStatus: React.FC<SystemStatusProps> = ({
  isCached,
  gpsError,
  gpsSignalLevel,
  isUpdating,
  gpsAccuracy,
  loggingEnabled,
}) => {
  // Derived states
  const isOffline = gpsError && gpsError.includes('Quota');
  const isGpsLost = gpsSignalLevel === 'lost';
  const accuracyText = `±${Math.round(gpsAccuracy)}m`;
  const isPoorAccuracy = gpsAccuracy > 50;

  return (
    <div className="flex flex-col gap-1" role="status" aria-label="System Status">

      {/* Top Row: Title + Critical Badges */}
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-black italic tracking-tighter text-white">
          DRIVE<span className="text-blue-500">PRO</span>
        </h1>

        {isCached && (
          <span
            className="flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest transition-all duration-500"
            aria-label="Using Cached Data"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
            Cached
          </span>
        )}

        {isOffline && (
          <span
            className="text-[8px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-black uppercase tracking-widest animate-pulse"
            aria-label="Offline Mode"
          >
            OFFLINE
          </span>
        )}

        {isGpsLost && (
          <span
            className="text-[8px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-black uppercase tracking-widest animate-pulse"
            aria-label="GPS Signal Lost"
          >
            GPS LOST
          </span>
        )}
      </div>

      {/* Bottom Row: Detailed Indicators */}
      <div className="flex items-center gap-4 mt-1">

        {/* Sync Status */}
        <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isUpdating ? 'bg-blue-400 animate-ping' :
                isOffline ? 'bg-amber-500' :
                'bg-emerald-500'
              }`}
              aria-hidden="true"
            />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              {isUpdating ? 'Gemini Syncing...' : gpsError ? gpsError : 'Local Engine'}
            </span>
        </div>

        {/* GPS Signal & Accuracy */}
        <div className="flex items-center gap-2 pl-4 border-l border-white/10">
            <SignalBars gpsSignalLevel={gpsSignalLevel} />
            <span
              className={`text-[9px] font-mono font-bold uppercase tracking-wider ${
                isPoorAccuracy ? 'text-red-400' : 'text-slate-400'
              }`}
              aria-label={`GPS Accuracy ${accuracyText}`}
            >
                {accuracyText}
            </span>
        </div>

        {/* Recording Indicator */}
        {loggingEnabled && (
           <div
             className="flex items-center gap-1 ml-2 bg-red-500/10 border border-red-500/30 px-1.5 py-0.5 rounded animate-pulse"
             aria-label="Recording Enabled"
           >
             <div className="w-1.5 h-1.5 rounded-full bg-red-500" aria-hidden="true"></div>
             <span className="text-[8px] font-black text-red-400 uppercase tracking-wider">REC</span>
           </div>
        )}
      </div>
    </div>
  );
};

export default SystemStatus;
