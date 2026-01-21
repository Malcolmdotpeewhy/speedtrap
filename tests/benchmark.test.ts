
import { describe, it, expect } from 'vitest';
import { RoadInfo } from '../services/geminiService';

// Simulate the data structure
const generateCache = (count: number): Record<string, RoadInfo> => {
  const cache: Record<string, RoadInfo> = {};
  for (let i = 0; i < count; i++) {
    cache[`key_${i}`] = {
      limit: 65,
      roadName: `Highway ${i}`,
      roadType: 'Interstate',
      policeDistrict: 'District A',
      context: 'Verified via Google Maps',
      confidence: 'High',
      futureSegments: [
        { distanceMiles: 1.5, limit: 55 },
        { distanceMiles: 5.0, limit: 65 },
      ]
    };
  }
  return cache;
};

const CACHE_SIZE = 500;
const rawData = generateCache(CACHE_SIZE);
const stringifiedData = JSON.stringify(rawData);

describe('Storage Performance Benchmark', () => {
  it('measures blocking time of JSON.parse', () => {
    const start = performance.now();
    const parsed = JSON.parse(stringifiedData);
    const end = performance.now();

    // Simulate iterating and setting into map (as done in current implementation)
    const map = new Map();
    Object.entries(parsed).forEach(([key, val]) => {
      map.set(key, val);
    });
    const finalEnd = performance.now();

    const parseTime = end - start;
    const totalTime = finalEnd - start;

    console.log(`[Baseline] JSON.parse time for ${CACHE_SIZE} items: ${parseTime.toFixed(3)}ms`);
    console.log(`[Baseline] Total blocking time (parse + map population): ${totalTime.toFixed(3)}ms`);

    expect(parsed).toBeDefined();
  });

  it('measures non-blocking simulation (Structured Clone / Async)', async () => {
     // This test simulates the "async" nature. In a real browser, IDB is async.
     // Here we just want to verify that we can avoid the blocking JSON.parse.
     // In IDB, we retrieve objects directly.

     // Simulate retrieval time (async)
     const start = performance.now();

     // Simulate async delay
     await new Promise(resolve => setTimeout(resolve, 0));

     // "Retrieval" is instant in memory for this simulation, but the key is that
     // main thread wasn't blocked by parsing a huge string.
     // But wait, IDB implementations might deserialize internally.
     // However, the browser handles that, often more efficiently or off main thread in some engines.
     // But the critical part is that the *hydration loop* in the component is what we are changing.

     const retrievedData = structuredClone(rawData); // native clone, optimized

     const map = new Map();
     Object.entries(retrievedData).forEach(([key, val]) => {
         map.set(key, val);
     });

     const end = performance.now();
     // Note: `start` to `end` includes the await, so it measures "wall clock time", not "blocking time".
     // But we care about blocking time.

     console.log(`[Optimized] Wall clock time (async + population): ${(end - start).toFixed(3)}ms`);
  });
});
