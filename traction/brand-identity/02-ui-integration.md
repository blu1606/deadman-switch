# 02 UI Integration: Weaving Kip In

> **Goal:** Subtlety. Make Kip feel like a system component, not an annoying popup.

## 1. The Living Check-in Button (Dashboard)
The traditional "Button" is dead.
*   **Design:** The check-in button IS Kip's home.
*   **Normal:** Button shows "Check In". Kip floats subtly above/next to it.
*   **Action:** When user clicks **Hold**, a circular progress bar fills AROUND Kip.
    *   **0-50%:** Kip wakes up, eyes go wide.
    *   **50-90%:** Kip starts glowing, particles suck into him (Charging).
    *   **100%:** EXPLOSION of happiness (`^ ◡ ^`), button ripples green.
*   **Feedback:** "Vault Fed. Timer Reset."

## 2. Browser Tab as Status Bar (Favicon)
Use a dynamic favicon to show vault health *even when tab is inactive*.
*   **Healthy:** Green Face SVG.
*   **Critical:** Red Exclamation or Sad Face SVG.
*   *Tech:* `link rel="icon"` updated via React Effect.

## 3. "Empty State" Companion
Instead of "No Vaults Found":
*   **Visual:** A ghostly, transparent Kip outline.
*   **Micro-copy:** "I'm a spirit without a home. Create a vault to give me life."
*   **Psychology:** Guilt/Nurture trigger to create the first vault.

## 4. Mobile PWA Integration (Home Screen)
*   **Widget potential:** A simple oversized widget showing Kip's face + "30 Days Left".
*   **Icon:** Just Kip's face. No text. Makes it feel like a "Pet App" rather than a utility.

## 5. Technical Stack
*   **Components:** `KipAvatar.tsx` (The SVG face), `KipContainer.tsx` (The physics/div).
*   **Animation:** Standard CSS `@keyframes` for float/pulse. React state for changing SVG paths (Eyes/Mouth).
*   **State Management:** `useKipState(vault)` hook that calculates health % and returns the correct mood string.
