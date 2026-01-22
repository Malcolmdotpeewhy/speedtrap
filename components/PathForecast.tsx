import React from 'react';
import { RoadInfo } from '../types';

interface PathForecastProps {
  roadInfo: Partial<RoadInfo>;
  displayLimit: number;
}

const PathForecast: React.FC<PathForecastProps> = ({ roadInfo, displayLimit }) => {
  return (
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
  );
};

export default React.memo(PathForecast);
