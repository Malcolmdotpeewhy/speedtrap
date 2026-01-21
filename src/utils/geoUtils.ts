
import { Coordinates } from '../types';

/**
 * Calculates the Haversine distance between two points in miles.
 */
export const calculateDistance = (coords1: Coordinates, coords2: Coordinates): number => {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = (coords2.latitude - coords1.latitude) * Math.PI / 180;
  const dLon = (coords2.longitude - coords1.longitude) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coords1.latitude * Math.PI / 180) * Math.cos(coords2.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Generates a robust cache key based on tile coordinates and bearing.
 */
export const getCacheKey = (lat: number, lng: number, bearing: number): string => {
  const zoom = 19;
  const n = Math.pow(2, zoom);
  const xTile = Math.floor((lng + 180) / 360 * n);
  const latRad = lat * Math.PI / 180;
  const yTile = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  const headingStep = 22.5;
  const headingBucket = Math.round(bearing / headingStep) * headingStep % 360;

  return `Z${zoom}-X${xTile}-Y${yTile}-HDG${headingBucket}`;
};
