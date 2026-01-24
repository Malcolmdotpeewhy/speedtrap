import React, { createContext, useContext, useCallback, useState } from 'react';
import { useGPS, GpsData, GpsSignalLevel } from '../hooks/useGPS';
import { useRoadIntelligence } from '../hooks/useRoadIntelligence';
import { useSettings } from '../hooks/useSettings';
import { playBeepTone } from '../utils/audioUtils';
import { RoadInfo } from '../services/geminiService';
import { GoogleUser } from '../services/googleDriveService';

interface AppContextType {
  // Settings
  threshold: number; setThreshold: (v: number) => void;
  alertsEnabled: boolean; setAlertsEnabled: (v: boolean) => void;
  chimesEnabled: boolean; setChimesEnabled: (v: boolean) => void;
  loggingEnabled: boolean; setLoggingEnabled: (v: boolean) => void;
  cloudEnabled: boolean; setCloudEnabled: (v: boolean) => void;
  showPolice: boolean; setShowPolice: (v: boolean) => void;
  showContext: boolean; setShowContext: (v: boolean) => void;
  opacity: number; setOpacity: (v: number) => void;
  scale: number; setScale: (v: number) => void;
  clickThrough: boolean; setClickThrough: (v: boolean) => void;
  widgetPos: { x: number, y: number }; setWidgetPos: (v: { x: number, y: number }) => void;
  apiKey: string; setApiKey: (v: string) => void;

  // GPS
  gpsData: GpsData;
  gpsSignalLevel: GpsSignalLevel;
  gpsError: string | null;

  // Intelligence
  roadInfo: Partial<RoadInfo>;
  lastValidLimit: number;
  isUpdating: boolean;
  isCached: boolean;
  intelError: string | null;
  logCount: number;
  setLogCount: React.Dispatch<React.SetStateAction<number>>;

  // Derived
  displayLimit: number;
  isSpeeding: boolean;
  isCritical: boolean;
  isApproaching: boolean;

  // Actions
  playBeep: (freq: number, dur: number, gainVal?: number) => void;

  // Auth State (Managed in App.tsx for now, passed down or moved here later if needed)
  isGoogleSignedIn: boolean;
  googleUser: GoogleUser | null;
  isSyncing: boolean;
  handleManualSync: () => void;

  // UI State
  isLocked: boolean;
  setIsLocked: (v: boolean) => void;
  viewMode: 'full' | 'widget';
  setViewMode: (v: 'full' | 'widget') => void;
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{
    children: React.ReactNode;
    isGoogleSignedIn: boolean;
    googleUser: GoogleUser | null;
    isSyncing: boolean;
    handleManualSync: () => void;
}> = ({ children, isGoogleSignedIn, googleUser, isSyncing, handleManualSync }) => {

  const settings = useSettings();
  const gps = useGPS();

  const playBeep = useCallback((freq: number, dur: number, gainVal: number = 0.08) => {
    if (!settings.alertsEnabled) return;
    playBeepTone(freq, dur, gainVal);
  }, [settings.alertsEnabled]);

  const playMilestoneChime = useCallback(() => {
    if (!settings.chimesEnabled) return;
    playBeep(784, 0.15, 0.1);
    setTimeout(() => playBeep(880, 0.1, 0.1), 100);
  }, [settings.chimesEnabled, playBeep]);

  const intelligence = useRoadIntelligence(
    gps.gpsData,
    settings.loggingEnabled,
    settings.cloudEnabled,
    playMilestoneChime
  );

  // Derived Logic
  const displayLimit = React.useMemo(() => intelligence.roadInfo.limit ?? intelligence.lastValidLimit, [intelligence.roadInfo.limit, intelligence.lastValidLimit]);
  const overage = gps.gpsData.speed - displayLimit;
  const isSpeeding = React.useMemo(() => overage >= settings.threshold, [overage, settings.threshold]);
  const isCritical = React.useMemo(() => overage >= settings.threshold + 10, [overage, settings.threshold]);
  const isApproaching = React.useMemo(() => overage >= 0 && overage < settings.threshold, [overage, settings.threshold]);

  // Alert Loop
  React.useEffect(() => {
    const int = isCritical ? 400 : isSpeeding ? 2000 : null;
    if (int) {
      const timer = setInterval(() => playBeep(isCritical ? 880 : 440, 0.1), int);
      return () => clearInterval(timer);
    }
  }, [isSpeeding, isCritical, settings.alertsEnabled, playBeep]);

  // Local UI State
  const [isLocked, setIsLocked] = useState(false);
  const [viewMode, setViewMode] = useState<'full' | 'widget'>('full');
  const [showSettings, setShowSettings] = useState(false);

  const value: AppContextType = React.useMemo(() => ({
    ...settings,
    gpsData: gps.gpsData,
    gpsSignalLevel: gps.gpsSignalLevel,
    gpsError: gps.error,
    ...intelligence,
    intelError: intelligence.error,
    displayLimit,
    isSpeeding,
    isCritical,
    isApproaching,
    playBeep,
    isGoogleSignedIn,
    googleUser,
    isSyncing,
    handleManualSync,
    isLocked, setIsLocked,
    viewMode, setViewMode,
    showSettings, setShowSettings
  }), [
    settings.threshold, settings.setThreshold,
    settings.alertsEnabled, settings.setAlertsEnabled,
    settings.chimesEnabled, settings.setChimesEnabled,
    settings.loggingEnabled, settings.setLoggingEnabled,
    settings.cloudEnabled, settings.setCloudEnabled,
    settings.showPolice, settings.setShowPolice,
    settings.showContext, settings.setShowContext,
    settings.opacity, settings.setOpacity,
    settings.scale, settings.setScale,
    settings.clickThrough, settings.setClickThrough,
    settings.widgetPos, settings.setWidgetPos,
    settings.apiKey, settings.setApiKey,
    gps.gpsData, gps.gpsSignalLevel, gps.error,
    intelligence.roadInfo, intelligence.lastValidLimit, intelligence.isUpdating, intelligence.isCached, intelligence.error, intelligence.logCount, intelligence.setLogCount,
    displayLimit, isSpeeding, isCritical, isApproaching, playBeep,
    isGoogleSignedIn, googleUser, isSyncing, handleManualSync,
    isLocked, setIsLocked, viewMode, setViewMode, showSettings, setShowSettings
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
