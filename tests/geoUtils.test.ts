
import { describe, it, expect } from 'vitest';
import { getCacheKey, calculateDistance, calculateBearing } from '../utils/geoUtils';

describe('GeoUtils', () => {
    it('calculates distance correctly', () => {
        const p1 = { latitude: 0, longitude: 0 };
        const p2 = { latitude: 0, longitude: 1 };
        // Roughly 69 miles per degree of longitude at equator
        const dist = calculateDistance(p1, p2);
        expect(dist).toBeGreaterThan(60);
        expect(dist).toBeLessThan(80);
    });

    it('calculates bearing correctly', () => {
        const p1 = { latitude: 0, longitude: 0 };
        const p2 = { latitude: 0, longitude: 1 };
        const bearing = calculateBearing(p1, p2);
        expect(bearing).toBeCloseTo(90, 1); // East

        const p3 = { latitude: 1, longitude: 0 };
        const bearingNorth = calculateBearing(p1, p3);
        expect(bearingNorth).toBeCloseTo(0, 1); // North
    });

    it('generates consistent cache keys', () => {
        const key1 = getCacheKey(10.12345, 20.12345, 90);
        const key2 = getCacheKey(10.12346, 20.12346, 92); // Slight variation
        expect(key1).toBe(key2); // Should be same grid
    });
});
