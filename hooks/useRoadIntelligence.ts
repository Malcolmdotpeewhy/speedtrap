import { useState, useRef, useEffect, useCallback } from 'react';
import { get, set } from 'idb-keyval';
import { getSpeedLimitAtLocation, RoadInfo } from '../services/geminiService';
import { saveLog, getStoredLogsCount } from '../services/storageService';
import { getCacheKey, calculateDistance } from '../utils/geoUtils';
import { Coordinates } from '../types';

export const useRoadIntelligence = (
  gpsData: { speed: number; bearing: number; accuracy: number; coords: Coordinates | null },
  loggingEnabled: boolean,
  cloudEnabled: boolean,
  playMilestoneChime: () => void
) => {
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

  const lastFetchCoords = useRef<Coordinates | null>(null);
  const lastFetchBearing = useRef<number>(0);
  const prevLimitRef = useRef<number>(lastValidLimit);
  const quotaTimeoutRef = useRef<number>(0);
  const intelCache = useRef<Map<string, RoadInfo>>(new Map());
  const persistTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const hydrateCache = async () => {
      try {
        // Try IDB first
        const savedCache = await get<Map<string, RoadInfo>>('road_intelligence_db_v2');
        if (savedCache && savedCache instanceof Map) {
          intelCache.current = savedCache;
        } else {
          // Migration from LocalStorage
          const lsCache = localStorage.getItem('road_intelligence_db_v2');
          if (lsCache) {
            const parsed = JSON.parse(lsCache);
            Object.entries(parsed).forEach(([key, val]) => {
              intelCache.current.set(key, val as RoadInfo);
            });
            // Migrate to IDB
            await set('road_intelligence_db_v2', intelCache.current);
            localStorage.removeItem('road_intelligence_db_v2');
          }
        }
      } catch (e) {
        console.error("Cache Hydration Failed", e);
      }
    };

    hydrateCache();
    setLogCount(getStoredLogsCount());
  }, []);

  const persistCache = useCallback(() => {
    if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);

    persistTimeoutRef.current = setTimeout(() => {
      if (intelCache.current.size > 500) {
        const entries = Array.from(intelCache.current.entries());
        const prunedEntries = entries.slice(-500);
        intelCache.current = new Map(prunedEntries);
      }
      set('road_intelligence_db_v2', intelCache.current).catch(e =>
        console.error("Failed to persist cache", e)
      );
    }, 2000);
  }, []);

  const fetchRouteIntelligence = async (lat: number, lng: number, currBearing: number, accuracy: number) => {
    if (accuracy > 50 && roadInfo.roadName !== "Initializing...") {
        return;
    }

    if (Date.now() < quotaTimeoutRef.current) {
        return;
    }

    const cacheKey = getCacheKey(lat, lng, currBearing);

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

  // Main Effect to Trigger Fetching
  useEffect(() => {
    if (!gpsData.coords) return;
    const { latitude, longitude } = gpsData.coords;
    const currBearing = gpsData.bearing;
    const accuracy = gpsData.accuracy;
    const mph = gpsData.speed;

    const dist = lastFetchCoords.current ?
      calculateDistance({ latitude, longitude }, lastFetchCoords.current) : Infinity;

    const bearingChange = Math.abs(currBearing - lastFetchBearing.current);
    const isTurned = bearingChange > 35 && bearingChange < 325;
    const isMoving = mph > 5;
    const needsInit = !lastFetchCoords.current;
    const hasTravelled = dist > 0.25;

    if (needsInit || (isMoving && (isTurned || hasTravelled))) {
      fetchRouteIntelligence(latitude, longitude, currBearing, accuracy);
    }

    // Future Segments Logic
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpsData, loggingEnabled, cloudEnabled]);

  return { roadInfo, lastValidLimit, isUpdating, isCached, error, logCount, setLogCount };
};
