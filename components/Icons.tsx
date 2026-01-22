
import React from 'react';

/**
 * Reusable Icon components for performance and cleanliness.
 * Moved from inline SVG paths to constant components.
 */

export const SearchIcon: React.FC<{ className?: string }> = ({ className = "w-3 h-3" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const HighwayIcon: React.FC<{ className?: string }> = ({ className = "w-3 h-3" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" stroke="none" />
    <path d="M12 4l6 2.25V11c0 4.16-2.88 8.05-6 9-3.12-.95-6-4.84-6-9V6.25L12 4z" fill="rgba(255,255,255,0.2)" />
  </svg>
);

export const ArterialIcon: React.FC<{ className?: string }> = ({ className = "w-3 h-3" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

export const ResidentialIcon: React.FC<{ className?: string }> = ({ className = "w-3 h-3" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

export const SettingsIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
);

export const MinimizeIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
  </svg>
);

export const WidgetIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
    </svg>
);
