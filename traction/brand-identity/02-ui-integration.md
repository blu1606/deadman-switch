# 02 UI Integration: Weaving Kip In

> **Goal:** Subtlety. Make Kip feel like a system component, not an annoying popup.

## 1. The Living Check-in Button (Tactile)
The traditional "Button" is dead.
*   **Design:** The check-in button IS Kip's home.
*   **Normal:** Button shows "Check In". Kip floats subtly above/next to it.
*   **Interaction:**
    *   **Action:** When user clicks **Hold**.
    *   **Visual:** A circular progress bar fills AROUND Kip. Particles suck into him (Charging).
    *   **Tactile (Mobile):** Haptic Feedback (`navigator.vibrate`) builds up intensity.
        *   0%: Light tap.
        *   50%: Vibration pattern speeds up `[10, 10]`.
        *   100%: **Heavy Pulse** `[50]` to signal success.
    *   **Completion:** EXPLOSION of happiness (`^ ◡ ^`), button ripples green.
*   **Feedback:** "Vault Fed. Timer Reset."

## 2. Browser Tab as Status Bar (Favicon)
Use a dynamic favicon to show vault health *even when tab is inactive*.
- Healthy: Green Face SVG.
- Critical: Red Exclamation/Face.

## 3. "Empty State" Companion
Instead of "No Vaults Found":
- **Visual:** A transparent, sketch-style Kip outline.
- **Micro-copy:** "I'm a spirit without a home. Create a vault to give me life."
- **Psychology:** Guilt/Nurture trigger.

## 4. The Ascension (Release Protocol)
Instead of a "Death Screen":
- **Animation:** Kip turns **Starlight White**, floats upwards, and dissolves into particles.
- **Message:** "Mission Complete. Legacy Delivered."
- **Feeling:** Closure, relief, success. Not grief.

## 5. Technical Stack
*   **Components:** `KipAvatar.tsx`, `KipContainer.tsx`.
*   **Haptics:** `navigator.vibrate` (with simple fallback for no support).
*   **Animation:** Standard CSS `@keyframes` for float/pulse. React state for changing SVG paths.
