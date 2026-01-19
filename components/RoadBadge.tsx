
import React from 'react';
import { SearchIcon, HighwayIcon, ArterialIcon, ResidentialIcon } from './Icons';

interface RoadBadgeProps {
  type: string;
}

const RoadBadge: React.FC<RoadBadgeProps> = ({ type }) => {
  const t = (type || '').toLowerCase();
  let badgeClass = "bg-slate-700 border-slate-500 text-slate-100";
  let Icon = SearchIcon;

  if (t.includes('high') || t.includes('free') || t.includes('inter') || t.includes('exp')) {
    badgeClass = "bg-blue-600 border-blue-400 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]";
    Icon = HighwayIcon;
  } else if (t.includes('art') || t.includes('av') || t.includes('blvd') || t.includes('rd') || t.includes('rou')) {
    badgeClass = "bg-amber-600 border-amber-400 text-white shadow-[0_0_10px_rgba(217,119,6,0.4)]";
    Icon = ArterialIcon;
  } else if (t.includes('res') || t.includes('loc') || t.includes('lane') || t.includes('way') || t.includes('dr')) {
    badgeClass = "bg-emerald-600 border-emerald-400 text-white shadow-[0_0_10px_rgba(5,150,105,0.4)]";
    Icon = ResidentialIcon;
  }

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${badgeClass} transition-all duration-300`}>
      <Icon />
      <span className="text-[10px] font-black uppercase tracking-wider leading-none pt-[1px]">{type || 'Scanning'}</span>
    </div>
  );
};

// Optimization: Memoize to prevent re-renders when parent App re-renders but road type is same
export default React.memo(RoadBadge);
