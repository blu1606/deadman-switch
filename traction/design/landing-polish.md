# Landing Page UI Polish Plan

> **Goal:** Address UX feedback regarding motivation, clarity, and rendering issues.
> **Source:** User Feedback (Brainstorm Session)

## 1. Hero / "Digital Fire Alarm"
**Issue:** "Digital Fire Alarm" text lacks AI association.
**Fix:**
-   Add `Bot` or `BrainCircuit` icon (Lucide) next to the title.
-   Update text to "The AI-Powered Digital Fire Alarm" (?) or just add the visual cue.
-   **Decision:** Replace emojis with cohesive Lucide icons (Option A).
    -   Header: `bg-primary-500/10` container with `<Siren />` (Context: "Fire Alarm/Emergency")
    -   Step 1 (Load): `<ShieldCheck />` or `<Vault />`
    -   Step 2 (Timer): `<Hourglass />`
    -   Step 3 (Heartbeat): `<Activity />`
    -   Step 4 (Release): `<Key />`

## 2. Problem Section ("Inactive Account Manager")
**Issue:** "effect/img left to blur -> not have any motivate".
**Analysis:** The blurring hex code visual is too abstract and boring.
-   **Decision:** "Locked Cloud" Visual (Option 2)
    -   **Base:** A glass-morphic Cloud icon (`Cloud` Lucide or SVG).
    -   **Overlay:** A prominent **Red Glowing Padlock** floating in center.
    -   **Animation:** The lock "pulses" (scale 1.0 -> 1.05).
    -   **Micro-copy:** "Vault Locked: 12 Years" (Counting up).

## 3. Mechanism ("See How It Works")
**Issue:** "animation do not display all the thing we do".
**Fix:**
-   The current static cards + line is too simple.
-   **Enhancement:**
    -   Animate the connecting line (SVG draw animation).
    -   Add a "Pulse" effect moving from Step 1 -> Step 4 to show flow.
    -   Add detailed tooltips or sub-text to explain "checking in" and "smart contract" better.

## 4. Process (UseCaseGrid)
**Issue:** "img lock -> error cannot render".
**Analysis:** Likely due to `mix-blend-screen` CSS class on the images. If the glass images are transparent PNGs, specific blend modes can make them invisible or washed out against dark backgrounds.
**Fix:**
-   Remove `mix-blend-screen`.
-   Ensure `layout="fill"` works with the parent container (it seems correct).
-   Verify image paths (confirmed exist).

---

## Action Plan
- [ ] Modify `EmergencySwitch.tsx` (Header Icon + Animation).
- [ ] Modify `ProblemSection.tsx` (New Visual).
- [ ] Modify `UseCaseGrid.tsx` (Remove blend mode).
