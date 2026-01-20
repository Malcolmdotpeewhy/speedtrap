# STARK Journal

## 2025-05-14 - Architecture & State Management
**Learning:** The "God Component" pattern (`App.tsx` holding all state) makes the application brittle and hard to test. React Context combined with specific hooks (`useGPS`, `useRoadIntelligence`) is a better fit for this telemetry-heavy app.
**Action:** Decouple state logic into dedicated hooks and use a Context Provider to inject dependencies, allowing for easier testing and cleaner UI components.

## 2025-05-14 - Performance & DX (Tailwind)
**Learning:** Using CDN for Tailwind prevents build-time optimization (purging) and hurts DX (no intellisense).
**Action:** Migrated to PostCSS/Tailwind build pipeline. This ensures a smaller bundle size in production and better developer tooling.

## 2025-05-14 - Reliability & Testing
**Learning:** Telemetry logic (GPS, Bearings) is complex and error-prone. Lacking tests makes refactoring dangerous.
**Action:** Introduced Vitest and basic unit tests for the core logic (GPS utils, Intelligence Service) to ensure reliability during the transformation.
