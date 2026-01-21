
import React from 'react';

export type GpsSignalLevel = 'lost' | 'low' | 'medium' | 'high';

interface SignalBarsProps {
  gpsSignalLevel: GpsSignalLevel;
}

const SignalBars: React.FC<SignalBarsProps> = ({ gpsSignalLevel }) => {
  const bars = gpsSignalLevel === 'high' ? 4 : gpsSignalLevel === 'medium' ? 3 : gpsSignalLevel === 'low' ? 2 : 0;
  const color = gpsSignalLevel === 'high' ? 'bg-emerald-400' : gpsSignalLevel === 'medium' ? 'bg-amber-400' : 'bg-red-500';

  // Optimization: Moved constant array outside or use static range
  const BAR_RANGE = [1, 2, 3, 4];

  const signalDescription = gpsSignalLevel === 'lost' ? 'No GPS Signal' : `GPS Signal: ${gpsSignalLevel}`;

  return (
    <div
      className="flex items-end gap-0.5 h-3"
      role="img"
      aria-label={signalDescription}
      title={signalDescription}
    >
      {BAR_RANGE.map(i => (
        <div
          key={i}
          className={`w-1 rounded-sm transition-all duration-300 ${i <= bars ? color : 'bg-slate-700'}`}
          style={{ height: `${i * 25}%` }}
        />
      ))}
    </div>
  );
};

// Optimization: Memoize to prevent re-renders when parent App re-renders but GPS level is the same
export default React.memo(SignalBars);
