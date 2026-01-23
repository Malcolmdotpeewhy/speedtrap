import { useState, useEffect, useRef } from 'react';
import { Coordinates } from '../types';
import { calculateBearing } from '../utils/geoUtils';

export interface GpsData {
  speed: number;
  bearing: number;
  accuracy: number;
  coords: Coordinates | null;
}

export type GpsSignalLevel = 'lost' | 'low' | 'medium' | 'high';

export const useGPS = (loggingEnabled: boolean, cloudEnabled: boolean) => {
  const [gpsData, setGpsData] = useState<GpsData>({
    speed: 0,
    bearing: 0,
    accuracy: 0,
    coords: null
  });

  const [gpsSignalLevel, setGpsSignalLevel] = useState<GpsSignalLevel>('lost');
  const [error, setError] = useState<string | null>(null);

  const breadcrumbs = useRef<Coordinates[]>([]);
  const lastGpsUpdate = useRef<number>(0);
  const watchdogRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Watchdog Timer: Checks if GPS has stopped updating
    watchdogRef.current = setInterval(() => {
        if (Date.now() - lastGpsUpdate.current > 6000 && lastGpsUpdate.current !== 0) {
            setGpsSignalLevel('lost');
            setError("GPS Signal Lost");
        }
    }, 2000);

    watchIdRef.current = navigator.geolocation.watchPosition(
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
          currBearing = calculateBearing(last, { latitude, longitude });
        }

        const newGpsData = {
          speed: mph,
          bearing: currBearing,
          accuracy,
          coords: { latitude, longitude }
        };

        setGpsData(newGpsData);
        setError(null);

        // Optimization: Use a more direct way to maintain the last 10 points
        if (breadcrumbs.current.length >= 10) {
          breadcrumbs.current.shift();
        }
        breadcrumbs.current.push({ latitude, longitude });
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
        if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
        if (watchdogRef.current) clearInterval(watchdogRef.current);
    };
  }, [loggingEnabled, cloudEnabled]); // Keeping dependencies similar to original App.tsx

  return { gpsData, gpsSignalLevel, error, breadcrumbs };
};
