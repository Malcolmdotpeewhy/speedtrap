# Palette's Journal

## 2025-05-14 - Micro-feedback patterns
**Learning:** Users in this high-frequency telemetry app benefit greatly from immediate visual confirmation of state changes, especially for background tasks like syncing and preference saving.
**Action:** Use temporary button state changes (e.g., "Sync Now" -> "Syncing..." -> "Synced!") instead of separate toast notifications to maintain focus on the current interaction point.

## 2025-05-14 - Mobile Touch Targets in Dense UIs
**Learning:** In a dense dashboard UI, explicitly setting min-dimensions for buttons (44x44px) is critical for usability, even when the visual icon is smaller.
**Action:** Always apply `min-w-[44px] min-h-[44px]` to interactive elements in mobile-first views.

## 2025-05-14 - Sensitive Data Visibility
**Learning:** For long, sensitive strings like API keys, users need a way to verify input without permanently exposing the secret. Mobile keyboards often cause typos.
**Action:** Always include a "Show/Hide" toggle (using Eye/EyeOff icons) for password-style inputs that contain complex configuration data.

## 2025-05-15 - Inline Destructive Confirmation
**Learning:** Native `confirm()` dialogs disrupt the user flow and feel jarring in a polished UI. Inline "double-tap" confirmation (tap to arm, tap to confirm) provides safety without breaking immersion.
**Action:** Implement timeout-based inline confirmation for destructive actions instead of blocking browser alerts.
