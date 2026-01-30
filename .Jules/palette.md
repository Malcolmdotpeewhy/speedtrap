# Palette's Journal

## 2025-05-14 - Micro-feedback patterns
**Learning:** Users in this high-frequency telemetry app benefit greatly from immediate visual confirmation of state changes, especially for background tasks like syncing and preference saving.
**Action:** Use temporary button state changes (e.g., "Sync Now" -> "Syncing..." -> "Synced!") instead of separate toast notifications to maintain focus on the current interaction point.

## 2025-05-14 - Mobile Touch Targets in Dense UIs
**Learning:** In a dense dashboard UI, explicitly setting min-dimensions for buttons (44x44px) is critical for usability, even when the visual icon is smaller.
**Action:** Always apply `min-w-[44px] min-h-[44px]` to interactive elements in mobile-first views.

## 2025-05-23 - API Key Usability
**Learning:** For complex strings like API keys in settings, users struggle to verify correct input without a visibility toggle, leading to "invalid key" errors that are hard to diagnose.
**Action:** Always pair `type="password"` inputs for long tokens with a show/hide toggle, even in "secure" settings panels.
