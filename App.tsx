
import React, { useState, useEffect, useRef } from 'react';
import SignalBars from './components/SignalBars';
import RoadBadge from './components/RoadBadge';
const DashboardView = React.lazy(() => import('./components/DashboardView'));
const WidgetView = React.lazy(() => import('./components/WidgetView'));
const SettingsPanel = React.lazy(() => import('./components/SettingsPanel'));
import { calculateDistance, getCacheKey } from './utils/geoUtils';
import { playBeepTone } from './utils/audioUtils';
import { getSpeedLimitAtLocation, RoadInfo, PredictiveSegment } from './services/geminiService';
import { saveLog, exportData, getStoredLogsCount, clearLogs, syncPendingLogs } from './services/storageService';
import { initGoogleDrive, signInToDrive, isAuthenticated, signOutDrive, subscribeToAuthStatus, getCurrentUser, GoogleUser } from './services/googleDriveService';
import { Coordinates } from './types';

const App: React.FC = () => {
  // Optimization: Memoize initial storage values to avoid parsing on every render
  const initialPrefs = React.useMemo(() => ({
    threshold: Number(localStorage.getItem('alert_threshold')) || 5,
    alertsEnabled: localStorage.getItem('alerts_enabled') !== 'false',
    chimesEnabled: localStorage.getItem('chimes_enabled') !== 'false',
    loggingEnabled: localStorage.getItem('data_logging_enabled') === 'true',
    cloudEnabled: localStorage.getItem('cloud_sync_enabled') === 'true',
    showPolice: localStorage.getItem('show_police') !== 'false',
    showContext: localStorage.getItem('show_context') !== 'false',
    opacity: Number(localStorage.getItem('widget_opacity')) || 1,
    scale: Number(localStorage.getItem('widget_scale')) || 1,
    clickThrough: localStorage.getItem('widget_click_through') === 'true',
    widgetPos: (() => {
      const saved = localStorage.getItem('widget_position');
      return saved ? JSON.parse(saved) : { x: 20, y: 60 };
    })()
  }), []);

  // --- User Preferences ---
  const [threshold, setThreshold] = useState<number>(initialPrefs.threshold);
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(initialPrefs.alertsEnabled);
  const [chimesEnabled, setChimesEnabled] = useState<boolean>(initialPrefs.chimesEnabled);
  const [loggingEnabled, setLoggingEnabled] = useState<boolean>(initialPrefs.loggingEnabled);
  const [cloudEnabled, setCloudEnabled] = useState<boolean>(initialPrefs.cloudEnabled);
  const [showPolice, setShowPolice] = useState<boolean>(initialPrefs.showPolice);
  const [showContext, setShowContext] = useState<boolean>(initialPrefs.showContext);
  const [showSettings, setShowSettings] = useState(false);

  // --- Widget / Android View State ---
  const [viewMode, setViewMode] = useState<'full' | 'widget'>('full');
  const [opacity, setOpacity] = useState<number>(initialPrefs.opacity);
  const [scale, setScale] = useState<number>(initialPrefs.scale);
  const [clickThrough, setClickThrough] = useState<boolean>(initialPrefs.clickThrough);
  
  // Initialize Widget Position from LocalStorage
  const [widgetPos, setWidgetPos] = useState(initialPrefs.widgetPos);
  
  const [isLocked, setIsLocked] = useState(false);

  // --- Telemetry & Intelligence ---
  const [gpsData, setGpsData] = useState<{
    speed: number;
    bearing: number;
    accuracy: number;
    coords: Coordinates | null;
  }>({
    speed: 0,
    bearing: 0,
    accuracy: 0,
    coords: null
  });

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

  const [isUpdating, setIsUpdating] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logCount, setLogCount] = useState<number>(0);
  const [isDriveReady, setIsDriveReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);

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
  const persistTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const persistCache = React.useCallback(() => {
    if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);

    persistTimeoutRef.current = setTimeout(() => {
      // Optimization: If cache size is manageable, persist. If too large, prune first.
      if (intelCache.current.size > 500) {
        const entries = Array.from(intelCache.current.entries());
        const prunedEntries = entries.slice(-500);
        intelCache.current = new Map(prunedEntries);
      }

      const obj = Object.fromEntries(intelCache.current);
      localStorage.setItem('road_intelligence_db_v2', JSON.stringify(obj));
    }, 2000); // 2 second debounce
  }, []);

  const playBeep = React.useCallback((freq: number, dur: number, gainVal: number = 0.08) => {
    if (!alertsEnabled) return;
    playBeepTone(freq, dur, gainVal);
  }, [alertsEnabled]);

  const playMilestoneChime = React.useCallback(() => {
    if (!chimesEnabled) return;
    playBeep(784, 0.15, 0.1);
    setTimeout(() => playBeep(880, 0.1, 0.1), 100);
  }, [chimesEnabled, playBeep]);

  const handleManualSync = React.useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    await syncPendingLogs();
    setIsSyncing(false);
  }, [isSyncing]);

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
        
        // --- Signal Quality Logic ---
        if (accuracy <= 15) setGpsSignalLevel('high');
        else if (accuracy <= 40) setGpsSignalLevel('medium');
        else setGpsSignalLevel('low');

        const mph = Math.round((speed || 0) * 2.23694);

        let currBearing = heading || 0;
        if (heading === null && breadcrumbs.current.length > 0) {
          const last = breadcrumbs.current[breadcrumbs.current.length - 1];
          const y = Math.sin((longitude - last.longitude) * Math.PI/180) * Math.cos(latitude * Math.PI/180);
          const x = Math.cos(last.latitude * Math.PI/180) * Math.sin(latitude * Math.PI/180) - 
                    Math.sin(last.latitude * Math.PI/180) * Math.cos(latitude * Math.PI/180) * Math.cos((longitude - last.longitude) * Math.PI/180);
          currBearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
        }

        setGpsData({
          speed: mph,
          bearing: currBearing,
          accuracy,
          coords: { latitude, longitude }
        });

        // Optimization: Use a more direct way to maintain the last 10 points
        if (breadcrumbs.current.length >= 10) {
          breadcrumbs.current.shift();
        }
        breadcrumbs.current.push({ latitude, longitude });

        const dist = lastFetchCoords.current ? 
          calculateDistance({ latitude, longitude }, lastFetchCoords.current) : Infinity;

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

  const displayLimit = React.useMemo(() => roadInfo.limit ?? lastValidLimit, [roadInfo.limit, lastValidLimit]);
  const overage = gpsData.speed - displayLimit;
  const isSpeeding = React.useMemo(() => overage >= threshold, [overage, threshold]);
  const isCritical = React.useMemo(() => overage >= threshold + 10, [overage, threshold]);
  const isApproaching = React.useMemo(() => overage >= 0 && overage < threshold, [overage, threshold]);

  useEffect(() => {
    const int = isCritical ? 400 : isSpeeding ? 2000 : null;
    if (int) {
      const timer = setInterval(() => playBeep(isCritical ? 880 : 440, 0.1), int);
      return () => clearInterval(timer);
    }
  }, [isSpeeding, isCritical, alertsEnabled]);

  // --- Drag Handling ---
  const handleTouchStart = React.useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (isLocked || clickThrough) return; // Disable drag on body if locked OR click-through is enabled
    isDragging.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    dragOffset.current = { x: clientX - widgetPos.x, y: clientY - widgetPos.y };
  }, [isLocked, clickThrough, widgetPos.x, widgetPos.y]);

  const lastTouchMoveTime = useRef(0);
  const handleTouchMove = React.useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging.current || isLocked || clickThrough) return;

     // Optimization: Throttle to ~60fps (16ms)
     const now = Date.now();
     if (now - lastTouchMoveTime.current < 16) return;
     lastTouchMoveTime.current = now;

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
  }, [isLocked, clickThrough]);

  const handleTouchEnd = React.useCallback(() => {
    isDragging.current = false;
    // Persist position on drop
    localStorage.setItem('widget_position', JSON.stringify(widgetPos));
  }, [widgetPos]);


  return (
    <React.Suspense fallback={<div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-white font-black animate-pulse">DRIVE PRO</div>}>
      {viewMode === 'widget' ? (
        <WidgetView
          gpsData={gpsData}
          gpsSignalLevel={gpsSignalLevel}
          roadInfo={roadInfo}
          displayLimit={displayLimit}
          isCritical={isCritical}
          isSpeeding={isSpeeding}
          isApproaching={isApproaching}
          widgetPos={widgetPos}
          scale={scale}
          opacity={opacity}
          clickThrough={clickThrough}
          isLocked={isLocked}
          showPolice={showPolice}
          handleTouchStart={handleTouchStart}
          handleTouchMove={handleTouchMove}
          handleTouchEnd={handleTouchEnd}
          setShowSettings={setShowSettings}
          setViewMode={setViewMode}
        />
      ) : (
        <DashboardView
          gpsData={gpsData}
          gpsSignalLevel={gpsSignalLevel}
          roadInfo={roadInfo}
          isCached={isCached}
          error={error}
          isUpdating={isUpdating}
          loggingEnabled={loggingEnabled}
          showPolice={showPolice}
          showContext={showContext}
          displayLimit={displayLimit}
          isCritical={isCritical}
          isSpeeding={isSpeeding}
          isApproaching={isApproaching}
          setViewMode={setViewMode}
          setShowSettings={setShowSettings}
        />
      )}

      {showSettings && (
        <SettingsPanel
          alertsEnabled={alertsEnabled}
          setAlertsEnabled={setAlertsEnabled}
          chimesEnabled={chimesEnabled}
          setChimesEnabled={setChimesEnabled}
          showPolice={showPolice}
          setShowPolice={setShowPolice}
          showContext={showContext}
          setShowContext={setShowContext}
          threshold={threshold}
          setThreshold={setThreshold}
          loggingEnabled={loggingEnabled}
          setLoggingEnabled={setLoggingEnabled}
          cloudEnabled={cloudEnabled}
          setCloudEnabled={setCloudEnabled}
          isGoogleSignedIn={isGoogleSignedIn}
          googleUser={googleUser}
          logCount={logCount}
          isSyncing={isSyncing}
          handleManualSync={handleManualSync}
          signInToDrive={signInToDrive}
          signOutDrive={signOutDrive}
          exportData={exportData}
          clearLogs={clearLogs}
          setLogCount={setLogCount}
          setShowSettings={setShowSettings}
          isLocked={isLocked}
          setIsLocked={setIsLocked}
          clickThrough={clickThrough}
          setClickThrough={setClickThrough}
          opacity={opacity}
          setOpacity={setOpacity}
          scale={scale}
          setScale={setScale}
          setWidgetPos={setWidgetPos}
          viewMode={viewMode}
        />
      )}
    </React.Suspense>
  );
};

export default App;
