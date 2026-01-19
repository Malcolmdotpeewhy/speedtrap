
import React, { useState, useEffect, useRef } from 'react';
import { getSpeedLimitAtLocation, RoadInfo, PredictiveSegment } from './services/geminiService';
import { saveLog, exportData, getStoredLogsCount, clearLogs, syncPendingLogs } from './services/storageService';
import { initGoogleDrive, signInToDrive, isAuthenticated, signOutDrive, subscribeToAuthStatus, getCurrentUser, GoogleUser } from './services/googleDriveService';
import { Coordinates } from './types';

const App: React.FC = () => {
  // --- User Preferences ---
  const [threshold, setThreshold] = useState<number>(() => Number(localStorage.getItem('alert_threshold')) || 5);
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(() => localStorage.getItem('alerts_enabled') !== 'false');
  const [chimesEnabled, setChimesEnabled] = useState<boolean>(() => localStorage.getItem('chimes_enabled') !== 'false');
  const [loggingEnabled, setLoggingEnabled] = useState<boolean>(() => localStorage.getItem('data_logging_enabled') === 'true');
  const [cloudEnabled, setCloudEnabled] = useState<boolean>(() => localStorage.getItem('cloud_sync_enabled') === 'true');
  const [showPolice, setShowPolice] = useState<boolean>(() => localStorage.getItem('show_police') !== 'false');
  const [showContext, setShowContext] = useState<boolean>(() => localStorage.getItem('show_context') !== 'false');
  const [showSettings, setShowSettings] = useState(false);

  // --- Widget / Android View State ---
  const [viewMode, setViewMode] = useState<'full' | 'widget'>('full');
  const [opacity, setOpacity] = useState<number>(() => Number(localStorage.getItem('widget_opacity')) || 1);
  const [scale, setScale] = useState<number>(() => Number(localStorage.getItem('widget_scale')) || 1);
  const [clickThrough, setClickThrough] = useState<boolean>(() => localStorage.getItem('widget_click_through') === 'true');
  
  // Initialize Widget Position from LocalStorage
  const [widgetPos, setWidgetPos] = useState(() => {
    const saved = localStorage.getItem('widget_position');
    return saved ? JSON.parse(saved) : { x: 20, y: 60 };
  });
  
  const [isLocked, setIsLocked] = useState(false);

  // --- Telemetry & Intelligence ---
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [bearing, setBearing] = useState<number>(0);
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(0);
  const [gpsSignalLevel, setGpsSignalLevel] = useState<'lost' | 'low' | 'medium' | 'high'>('lost');
  
  const [roadInfo, setRoadInfo] = useState<Partial<RoadInfo>>(() => {
    const saved = localStorage.getItem('last_road_info');
    return saved ? JSON.parse(saved) : { 
      limit: 25, 
      roadName: "Initializing...", 
      roadType: "Ready", 
      policeDistrict: "",
      context: "Establishing GPS link...", 
      confidence: "Scanning",
      futureSegments: [] 
    };
  });

  const [lastValidLimit, setLastValidLimit] = useState<number>(() => {
    const saved = localStorage.getItem('last_road_info');
    return saved ? (JSON.parse(saved).limit || 25) : 25;
  });

  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logCount, setLogCount] = useState<number>(0);
  const [isDriveReady, setIsDriveReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);

  const audioCtx = useRef<AudioContext | null>(null);
  const breadcrumbs = useRef<Coordinates[]>([]);
  const lastFetchCoords = useRef<Coordinates | null>(null);
  const lastFetchBearing = useRef<number>(0);
  const lastGpsUpdate = useRef<number>(0);
  const prevLimitRef = useRef<number>(lastValidLimit);
  
  // Dragging Refs
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  
  // Backoff timer for quota management
  const quotaTimeoutRef = useRef<number>(0);
  
  // Intelligence Cache: Persistent Map of Roads mapped by Spatial Grids + Heading
  const intelCache = useRef<Map<string, RoadInfo>>(new Map());

  // Hydrate Cache from LocalStorage on mount to save Quota immediately
  useEffect(() => {
    const savedCache = localStorage.getItem('road_intelligence_db_v2');
    if (savedCache) {
      try {
        const parsed = JSON.parse(savedCache);
        Object.entries(parsed).forEach(([key, val]) => {
          intelCache.current.set(key, val as RoadInfo);
        });
      } catch (e) {
        console.error("Quota-Save Cache Hydration Failed", e);
      }
    }
    setLogCount(getStoredLogsCount());
    
    // Init Cloud
    initGoogleDrive().then(() => {
        setIsDriveReady(true);
    });

    // Subscribe to Auth Changes
    const unsubscribe = subscribeToAuthStatus((isAuth) => {
        setIsGoogleSignedIn(isAuth);
        setGoogleUser(getCurrentUser());
    });

    return () => {
        unsubscribe();
    }
  }, []);

  const persistCache = () => {
    const obj = Object.fromEntries(intelCache.current);
    // Limit cache size to prevent local storage bloat (last 500 segments)
    const keys = Object.keys(obj);
    if (keys.length > 500) {
      const keysToDelete = keys.slice(0, keys.length - 500);
      keysToDelete.forEach(k => delete obj[k]);
    }
    localStorage.setItem('road_intelligence_db_v2', JSON.stringify(obj));
  };

  const playBeep = (freq: number, dur: number, gainVal: number = 0.08) => {
    if (!alertsEnabled) return;
    try {
      if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
      const osc = audioCtx.current.createOscillator();
      const gain = audioCtx.current.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.current.currentTime);
      gain.gain.setValueAtTime(gainVal, audioCtx.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + dur);
      osc.connect(gain);
      gain.connect(audioCtx.current.destination);
      osc.start();
      osc.stop(audioCtx.current.currentTime + dur);
    } catch (e) {}
  };

  const playMilestoneChime = () => {
    if (!chimesEnabled) return;
    playBeep(784, 0.15, 0.1);
    setTimeout(() => playBeep(880, 0.1, 0.1), 100);
  };

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    await syncPendingLogs();
    setIsSyncing(false);
  };

  // --- Robust Cache Key Generation ---
  const getCacheKey = (lat: number, lng: number, bearing: number) => {
    const zoom = 19;
    const n = Math.pow(2, zoom);
    const xTile = Math.floor((lng + 180) / 360 * n);
    const latRad = lat * Math.PI / 180;
    const yTile = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
    const headingStep = 22.5;
    const headingBucket = Math.round(bearing / headingStep) * headingStep % 360;

    return `Z${zoom}-X${xTile}-Y${yTile}-HDG${headingBucket}`;
  };

  const fetchRouteIntelligence = async (lat: number, lng: number, currBearing: number, accuracy: number) => {
    // QUALITY GATE: If GPS accuracy is worse than 50 meters, do not trust this point for Road ID
    // unless we have literally no data yet.
    if (accuracy > 50 && roadInfo.roadName !== "Initializing...") {
        return; 
    }

    // Check if we are in a quota cooling period
    if (Date.now() < quotaTimeoutRef.current) {
        return;
    }

    // Generate robust cache key
    const cacheKey = getCacheKey(lat, lng, currBearing);
    
    // Check PERSISTENT cache first
    if (intelCache.current.has(cacheKey)) {
      const cached = intelCache.current.get(cacheKey)!;
      setRoadInfo(cached);
      setLastValidLimit(cached.limit || 25);
      setIsCached(true);
      lastFetchCoords.current = { latitude: lat, longitude: lng };
      lastFetchBearing.current = currBearing;
      setTimeout(() => setIsCached(false), 3000);
      return; 
    }

    setIsUpdating(true);
    setIsCached(false);
    try {
      const result = await getSpeedLimitAtLocation(lat, lng, currBearing, roadInfo.roadName);
      if (result.limit) {
        if (result.limit !== prevLimitRef.current) {
          playMilestoneChime();
          prevLimitRef.current = result.limit;
        }
        setLastValidLimit(result.limit);
        setRoadInfo(result);
        
        intelCache.current.set(cacheKey, result);
        persistCache();
        localStorage.setItem('last_road_info', JSON.stringify(result));

        // --- DATA LOGGING ---
        if (loggingEnabled) {
          const saveSuccess = await saveLog(result, { latitude: lat, longitude: lng }, currBearing, accuracy, cloudEnabled);
          if (saveSuccess) setLogCount(prev => prev + 1);
        }
      }
      lastFetchCoords.current = { latitude: lat, longitude: lng };
      lastFetchBearing.current = currBearing;
      setError(null);
    } catch (e: any) {
      if (e.message === "QUOTA_EXCEEDED") {
          const cooldownSeconds = 60;
          quotaTimeoutRef.current = Date.now() + (cooldownSeconds * 1000);
          setError(`Quota Limit - Retrying in ${cooldownSeconds}s`);
      } else {
          setError("Sync Error");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    // Watchdog Timer: Checks if GPS has stopped updating
    const watchdog = setInterval(() => {
        if (Date.now() - lastGpsUpdate.current > 6000 && lastGpsUpdate.current !== 0) {
            setGpsSignalLevel('lost');
            setError("GPS Signal Lost");
        }
    }, 2000);

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, heading, accuracy } = pos.coords;
        lastGpsUpdate.current = Date.now();
        setGpsAccuracy(accuracy);
        
        // --- Signal Quality Logic ---
        if (accuracy <= 15) setGpsSignalLevel('high');
        else if (accuracy <= 40) setGpsSignalLevel('medium');
        else setGpsSignalLevel('low');

        const mph = Math.round((speed || 0) * 2.23694);
        setCurrentSpeed(mph);
        setCoords({ latitude, longitude });

        let currBearing = heading || 0;
        if (heading === null && breadcrumbs.current.length > 0) {
          const last = breadcrumbs.current[breadcrumbs.current.length - 1];
          const y = Math.sin((longitude - last.longitude) * Math.PI/180) * Math.cos(latitude * Math.PI/180);
          const x = Math.cos(last.latitude * Math.PI/180) * Math.sin(latitude * Math.PI/180) - 
                    Math.sin(last.latitude * Math.PI/180) * Math.cos(latitude * Math.PI/180) * Math.cos((longitude - last.longitude) * Math.PI/180);
          currBearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
        }
        setBearing(currBearing);
        breadcrumbs.current = [...breadcrumbs.current.slice(-10), { latitude, longitude }];

        const dist = lastFetchCoords.current ? 
          (() => {
            const R = 3958.8;
            const dLat = (latitude - lastFetchCoords.current!.latitude) * Math.PI/180;
            const dLon = (longitude - lastFetchCoords.current!.longitude) * Math.PI/180;
            const a = Math.sin(dLat/2)**2 + Math.cos(lastFetchCoords.current!.latitude * Math.PI/180) * Math.cos(latitude * Math.PI/180) * Math.sin(dLon/2)**2;
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          })() : Infinity;

        const bearingChange = Math.abs(currBearing - lastFetchBearing.current);
        const isTurned = bearingChange > 35 && bearingChange < 325;

        const isMoving = mph > 5;
        const needsInit = !lastFetchCoords.current;
        const hasTravelled = dist > 0.25;

        // Pass accuracy to fetch logic to allow quality filtering
        if (needsInit || (isMoving && (isTurned || hasTravelled))) {
          fetchRouteIntelligence(latitude, longitude, currBearing, accuracy);
        }

        if (roadInfo.futureSegments && roadInfo.futureSegments.length > 0) {
          const nextSegment = roadInfo.futureSegments[0];
          if (dist >= nextSegment.distanceMiles) {
            playMilestoneChime();
            setLastValidLimit(nextSegment.limit);
            setRoadInfo(prev => ({
              ...prev,
              limit: nextSegment.limit,
              futureSegments: prev.futureSegments?.slice(1)
            }));
            lastFetchCoords.current = { latitude, longitude };
          }
        }
      },
      (err) => {
          console.error("GPS Error", err);
          setGpsSignalLevel('lost');
          setError("GPS Error");
      },
      { 
          enableHighAccuracy: true, 
          maximumAge: 0, // Force fresh readings
          timeout: 10000 
      }
    );
    return () => {
        navigator.geolocation.clearWatch(watchId);
        clearInterval(watchdog);
    };
  }, [roadInfo, loggingEnabled, cloudEnabled]);

  const displayLimit = roadInfo.limit ?? lastValidLimit;
  const overage = currentSpeed - displayLimit;
  const isSpeeding = overage >= threshold;
  const isCritical = overage >= threshold + 10;
  const isApproaching = overage >= 0 && overage < threshold;

  useEffect(() => {
    const int = isCritical ? 400 : isSpeeding ? 2000 : null;
    if (int) {
      const timer = setInterval(() => playBeep(isCritical ? 880 : 440, 0.1), int);
      return () => clearInterval(timer);
    }
  }, [isSpeeding, isCritical, alertsEnabled]);

  // --- Drag Handling ---
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (isLocked || clickThrough) return; // Disable drag on body if locked OR click-through is enabled
    isDragging.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    dragOffset.current = { x: clientX - widgetPos.x, y: clientY - widgetPos.y };
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging.current || isLocked || clickThrough) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    let newX = clientX - dragOffset.current.x;
    let newY = clientY - dragOffset.current.y;

    // Boundary Checks (Keep widget on screen)
    // Using simple bounds based on window size
    const maxX = window.innerWidth - 50; 
    const maxY = window.innerHeight - 50;
    
    // Clamp
    newX = Math.max(-50, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    setWidgetPos({
      x: newX,
      y: newY
    });
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    // Persist position on drop
    localStorage.setItem('widget_position', JSON.stringify(widgetPos));
  };

  const renderSignalBars = () => {
      const bars = gpsSignalLevel === 'high' ? 4 : gpsSignalLevel === 'medium' ? 3 : gpsSignalLevel === 'low' ? 2 : 0;
      const color = gpsSignalLevel === 'high' ? 'bg-emerald-400' : gpsSignalLevel === 'medium' ? 'bg-amber-400' : 'bg-red-500';
      
      return (
          <div className="flex items-end gap-0.5 h-3">
              {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`w-1 rounded-sm transition-all duration-300 ${i <= bars ? color : 'bg-slate-700'}`} style={{ height: `${i * 25}%` }}></div>
              ))}
          </div>
      );
  };

  const renderRoadBadge = (type: string) => {
    const t = type.toLowerCase();
    let badgeClass = "bg-slate-700 border-slate-500 text-slate-100";
    let icon = <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

    if (t.includes('high') || t.includes('free') || t.includes('inter') || t.includes('exp')) {
      badgeClass = "bg-blue-600 border-blue-400 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]";
      icon = (
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" stroke="none" />
          <path d="M12 4l6 2.25V11c0 4.16-2.88 8.05-6 9-3.12-.95-6-4.84-6-9V6.25L12 4z" fill="rgba(255,255,255,0.2)" />
        </svg>
      );
    } else if (t.includes('art') || t.includes('av') || t.includes('blvd') || t.includes('rd') || t.includes('rou')) {
      badgeClass = "bg-amber-600 border-amber-400 text-white shadow-[0_0_10px_rgba(217,119,6,0.4)]";
      icon = (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      );
    } else if (t.includes('res') || t.includes('loc') || t.includes('lane') || t.includes('way') || t.includes('dr')) {
      badgeClass = "bg-emerald-600 border-emerald-400 text-white shadow-[0_0_10px_rgba(5,150,105,0.4)]";
      icon = (
         <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
         </svg>
      );
    }

    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${badgeClass} transition-all duration-300`}>
        {icon}
        <span className="text-[10px] font-black uppercase tracking-wider leading-none pt-[1px]">{type || 'Scanning'}</span>
      </div>
    );
  };

  // --- WIDGET MODE RENDER ---
  if (viewMode === 'widget') {
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
              <span className="text-5xl font-black text-white leading-none tracking-tighter">{currentSpeed}</span>
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
                    <button onClick={() => setShowSettings(true)} className="p-1.5 bg-white/10 rounded-full hover:bg-white/20" onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
                       <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    </button>
                    <button onClick={() => setViewMode('full')} className="p-1.5 bg-white/10 rounded-full hover:bg-white/20" onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
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

        {/* Floating Settings Panel for Widget */}
        {showSettings && (
           <div className="fixed inset-x-4 top-20 bg-slate-900/95 border border-white/20 rounded-2xl p-4 z-50 shadow-2xl backdrop-blur-md">
              <h3 className="text-sm font-black text-white uppercase mb-4">Widget Settings</h3>
              
              <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-bold">Lock Position</span>
                    <button onClick={() => setIsLocked(!isLocked)} className={`px-3 py-1 rounded text-xs font-bold ${isLocked ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                        {isLocked ? 'LOCKED' : 'UNLOCKED'}
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-bold">Click-Through</span>
                    <button onClick={() => {
                        const newVal = !clickThrough;
                        setClickThrough(newVal);
                        localStorage.setItem('widget_click_through', String(newVal));
                    }} className={`px-3 py-1 rounded text-xs font-bold ${clickThrough ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                        {clickThrough ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1"><span className="text-xs text-slate-400 font-bold">Opacity</span><span className="text-xs text-white">{Math.round(opacity * 100)}%</span></div>
                    <input type="range" min="0.2" max="1" step="0.1" value={opacity} onChange={(e) => {setOpacity(parseFloat(e.target.value)); localStorage.setItem('widget_opacity', e.target.value);}} className="w-full h-1 bg-slate-700 rounded-lg appearance-none accent-blue-500"/>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1"><span className="text-xs text-slate-400 font-bold">Scale</span><span className="text-xs text-white">{scale}x</span></div>
                    <input type="range" min="0.5" max="1.5" step="0.1" value={scale} onChange={(e) => {setScale(parseFloat(e.target.value)); localStorage.setItem('widget_scale', e.target.value);}} className="w-full h-1 bg-slate-700 rounded-lg appearance-none accent-blue-500"/>
                  </div>

                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/10">
                      <span className="text-xs text-slate-400 font-bold">Troubleshoot</span>
                      <button onClick={() => { setWidgetPos({x: 20, y: 60}); localStorage.removeItem('widget_position'); }} className="px-2 py-1 bg-red-900/50 text-red-300 rounded text-[10px] font-bold uppercase">
                          Reset Pos
                      </button>
                  </div>

                  <button onClick={() => setShowSettings(false)} className="w-full py-2 bg-blue-600 rounded-lg text-xs font-black uppercase">Close</button>
              </div>
           </div>
        )}
      </div>
    );
  }

  // --- FULL DASHBOARD RENDER ---
  return (
    <div className={`flex flex-col h-[100dvh] w-full transition-all duration-700 p-6 text-white overflow-hidden select-none ${
      isCritical ? 'bg-red-600' : isSpeeding ? 'bg-red-950' : isApproaching ? 'bg-amber-950/60' : 'bg-slate-950'
    }`}>
      
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
            
            {/* NEW GPS STATUS BAR */}
            <div className="flex items-center gap-2 pl-4 border-l border-white/10">
                {renderSignalBars()}
                <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${gpsAccuracy > 50 ? 'text-red-400' : 'text-slate-400'}`}>
                    ±{Math.round(gpsAccuracy)}m
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
            {/* Widget Mode Button */}
            <button onClick={() => setViewMode('widget')} className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md active:scale-95 transition-transform">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
            </button>
            <button onClick={() => setShowSettings(true)} className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md active:scale-95 transition-transform">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
            </button>
        </div>
      </div>

      <div className={`mt-8 bg-black/40 backdrop-blur-2xl border rounded-[2rem] p-6 shadow-2xl relative overflow-hidden transition-colors duration-700 ${isCached ? 'border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'border-white/5'}`}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            {renderRoadBadge(roadInfo.roadType || 'Scanning')}
            
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
            <div className="w-3 h-3 border-2 border-slate-700 rounded-sm rotate-45" style={{ transform: `rotate(${bearing}deg)` }} />
            <span className="text-[9px] font-mono text-slate-500 uppercase">{Math.round(bearing)}° HEAD</span>
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
            {currentSpeed}
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

      <div className={`fixed inset-x-0 bottom-0 bg-slate-900 border-t border-white/10 rounded-t-[3rem] p-10 z-50 transition-transform duration-500 ${showSettings ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="w-16 h-2 bg-slate-800 rounded-full mx-auto mb-8 cursor-pointer" onClick={() => setShowSettings(false)}></div>
        <h3 className="text-2xl font-black mb-8 uppercase text-white">Config & Storage</h3>
        <div className="space-y-6 overflow-y-auto max-h-[60vh] pb-10">
          
          {/* Main Controls */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div><p className="font-bold text-lg">Speed Alerts</p><p className="text-xs text-slate-500">Audio chime over limit</p></div>
                <button onClick={() => setAlertsEnabled(!alertsEnabled)} className={`w-16 h-9 rounded-full relative transition-colors ${alertsEnabled ? 'bg-blue-600' : 'bg-slate-800'}`}>
                <div className={`absolute top-1.5 w-6 h-6 bg-white rounded-full transition-all ${alertsEnabled ? 'left-8' : 'left-1.5'}`}></div>
                </button>
            </div>
            <div className="flex justify-between items-center">
                <div><p className="font-bold text-lg">Milestone Chimes</p><p className="text-xs text-slate-500">Tone on limit changes</p></div>
                <button onClick={() => setChimesEnabled(!chimesEnabled)} className={`w-16 h-9 rounded-full relative transition-colors ${chimesEnabled ? 'bg-blue-600' : 'bg-slate-800'}`}>
                <div className={`absolute top-1.5 w-6 h-6 bg-white rounded-full transition-all ${chimesEnabled ? 'left-8' : 'left-1.5'}`}></div>
                </button>
            </div>
            <div className="flex justify-between items-center">
                <div><p className="font-bold text-lg">Police District</p><p className="text-xs text-slate-500">Show local jurisdiction</p></div>
                <button onClick={() => setShowPolice(!showPolice)} className={`w-16 h-9 rounded-full relative transition-colors ${showPolice ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                <div className={`absolute top-1.5 w-6 h-6 bg-white rounded-full transition-all ${showPolice ? 'left-8' : 'left-1.5'}`}></div>
                </button>
            </div>
            <div className="flex justify-between items-center">
                <div><p className="font-bold text-lg">Verified Info</p><p className="text-xs text-slate-500">Show data source context</p></div>
                <button onClick={() => setShowContext(!showContext)} className={`w-16 h-9 rounded-full relative transition-colors ${showContext ? 'bg-blue-600' : 'bg-slate-800'}`}>
                <div className={`absolute top-1.5 w-6 h-6 bg-white rounded-full transition-all ${showContext ? 'left-8' : 'left-1.5'}`}></div>
                </button>
            </div>
            <div className="pt-4 border-t border-white/5">
                <div className="flex justify-between mb-4"><p className="font-bold text-lg">Alert Buffer</p><p className="font-black text-3xl text-blue-500">+{threshold} MPH</p></div>
                <input type="range" min="1" max="20" value={threshold} onChange={(e) => setThreshold(parseInt(e.target.value))} className="w-full h-3 bg-slate-800 rounded-xl appearance-none accent-blue-500"/>
            </div>
          </div>

          {/* Data Logging Section */}
          <div className="pt-6 border-t border-white/10">
            <h4 className="text-sm font-black uppercase text-slate-400 mb-4 tracking-widest">Data Logging Strategy</h4>
            <div className="bg-slate-800/50 rounded-2xl p-4 mb-4">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <p className="font-bold text-white">Auto-Log Routes</p>
                        <p className="text-[10px] text-slate-400">Save JSON metadata to /Gemini_API_Data</p>
                    </div>
                    <button onClick={() => setLoggingEnabled(!loggingEnabled)} className={`w-12 h-7 rounded-full relative transition-colors ${loggingEnabled ? 'bg-red-500' : 'bg-slate-600'}`}>
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${loggingEnabled ? 'left-6' : 'left-1'}`}></div>
                    </button>
                </div>
                
                {/* CLOUD SYNC CONTROLS */}
                <div className="flex justify-between items-center mb-4 border-t border-white/10 pt-3">
                    <div>
                        <p className="font-bold text-white">Google Drive Cloud</p>
                        <p className="text-[10px] text-slate-400">Mirror data to personal cloud storage</p>
                    </div>
                    <button onClick={() => {
                        const newState = !cloudEnabled;
                        setCloudEnabled(newState);
                        localStorage.setItem('cloud_sync_enabled', newState.toString());
                        if (newState && !isGoogleSignedIn) {
                            signInToDrive();
                        }
                    }} className={`w-12 h-7 rounded-full relative transition-colors ${cloudEnabled ? 'bg-sky-500' : 'bg-slate-600'}`}>
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${cloudEnabled ? 'left-6' : 'left-1'}`}></div>
                    </button>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-300 font-mono bg-black/30 p-3 rounded-lg">
                    <span>Logs Stored:</span>
                    <span className="font-bold text-blue-400">{logCount} Files</span>
                </div>
                
                {cloudEnabled && (
                    <div className="mt-4">
                        {isGoogleSignedIn && googleUser ? (
                            <div className="bg-slate-700/50 rounded-xl p-3 flex items-center gap-3 border border-white/10">
                                <img src={googleUser.picture} className="w-8 h-8 rounded-full border border-white/20" alt="Avatar" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] font-bold text-white truncate">{googleUser.name}</div>
                                    <button onClick={signOutDrive} className="text-[9px] text-red-400 hover:text-red-300 uppercase font-bold tracking-wider">Disconnect</button>
                                </div>
                                <button onClick={handleManualSync} disabled={isSyncing} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isSyncing ? 'bg-slate-600 text-slate-400' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white'}`}>
                                    {isSyncing ? 'Syncing' : 'Sync Now'}
                                </button>
                            </div>
                        ) : (
                            <button onClick={signInToDrive} className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95">
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                <span className="text-xs font-bold tracking-wide">Sign in with Google</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <button onClick={exportData} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    Export Archive
                </button>
                <button onClick={() => { if(confirm('Clear all logs?')) { clearLogs(); setLogCount(0); }}} className="px-4 py-3 bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400 rounded-xl font-bold text-sm transition-colors">
                    Clear
                </button>
            </div>
            <p className="text-[9px] text-slate-500 mt-3 text-center">
                Logs are organized by Date / Location as specified in Data Strategy v1.
            </p>
          </div>

          <button onClick={() => {
            setShowSettings(false);
            localStorage.setItem('alerts_enabled', alertsEnabled.toString());
            localStorage.setItem('chimes_enabled', chimesEnabled.toString());
            localStorage.setItem('alert_threshold', threshold.toString());
            localStorage.setItem('data_logging_enabled', loggingEnabled.toString());
            localStorage.setItem('show_police', showPolice.toString());
            localStorage.setItem('show_context', showContext.toString());
            localStorage.setItem('cloud_sync_enabled', cloudEnabled.toString());
          }} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase shadow-xl active:scale-[0.98] transition-transform">Save Preferences</button>
        </div>
      </div>

      <div className="mt-12 flex justify-between items-center opacity-30 text-[9px] font-mono">
        <div>LOC: {coords?.latitude.toFixed(4)}, {coords?.longitude.toFixed(4)}</div>
        <div className="text-right uppercase">Predictive Engine v5.4 • DB Cache Hybrid</div>
      </div>
    </div>
  );
};

export default App;
