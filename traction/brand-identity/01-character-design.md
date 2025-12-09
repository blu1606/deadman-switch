# 01 Character Design: Kip (CSS-First)

> **Implementation Strategy:** Avoid heavy PNG/Lottie assets. Build Kip entirely with **CSS & SVG**.
> **Why:** Performance (0kb load), Scalability (any size), Animation control (CSS keyframes).

## 1. The Anatomy of Kip

Kip is essentially a `div` with `border-radius: 50%` and a glowing `box-shadow`.

### Base CSS
```css
.kip-body {
  width: var(--size);
  height: var(--size);
  background: radial-gradient(circle at 30% 30%, #34D399, #10B981);
  border-radius: 50%;
  box-shadow: 
    0 0 20px rgba(16, 185, 129, 0.4),
    inset 2px 2px 5px rgba(255, 255, 255, 0.4);
  animation: float 3s ease-in-out infinite;
}

.kip-face {
  /* SVG face centered */
}
```

## 2. Emotional States (Data-Driven)

Kip's look is determined by one prop: `health` (0-100%).

| State | Health | Color | Shadow | Face (SVG Path) | Animation |
|-------|--------|-------|--------|-----------------|-----------|
| **Healthy** | >50% | Emerald (#10B981) | Strong Green | `^ ◡ ^` | Slow Float |
| **Hungry** | 25-50% | Lime (#84CC16) | Weak Yellow | `• _ •` | Occasional Bounce |
| **Critical** | <25% | Amber (#F59E0B) | Red Pulse | `> _ <` | Shaking / Rapid Pulse |
| **Ghost** | 0% | Slate (#94A3B8) | None | `× _ ×` | Floating Up / Fade |

## 3. The "Unique Kip" System (Procedural)

To make users feel attached, their Kip should be unique.
Use `vault_address` to seed random traits **CSS-only**:

1.  **Hue Shift:** `filter: hue-rotate({seed % 360}deg)`
    - Instant 360 variations without new assets.
2.  **Accessory (Optional):**
    - Simple absolute positioned SVGs: *Leaf, Antenna, Halo, Horns.*
    - Select based on `seed % accessory_count`.

## 4. Interaction Physics (Framer Motion)
- **Hover:** Kip looks at cursor (move pupils).
- **Click/Feed:** Squish effect (`scaleY: 0.8`) then bounce (`scale: 1.2`).
- **Idle:** Breathe (`scale: 1.05` every 4s).

## 5. Mobile Considerations
- On mobile, Kip lives in the Bottom Navigation Bar or Top Right corner.
- Acts as the "Status Indicator".
