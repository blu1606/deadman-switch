# 01 Character Design: Kip (CSS-First)

> **Implementation Strategy:** Avoid heavy PNG/Lottie assets. Build Kip entirely with **CSS & SVG**.

## 1. The Anatomy of Kip

Kip is essentially a `div` with `border-radius: 50%` and a glowing `box-shadow`. The color is defined by a **Curated Palette**.

```css
.kip-body {
  width: var(--size);
  height: var(--size);
  background: var(--gradient);
  border-radius: 50%;
  box-shadow: 
    0 0 20px var(--shadow-color),
    inset 2px 2px 5px rgba(255, 255, 255, 0.4);
  animation: float 3s ease-in-out infinite;
}
```

## 2. Emotional States (Data-Driven)

Kip's look is determined by one prop: `health` (0-100%).

| State | Health | Color | Shadow | Face (SVG Path) | Animation |
|-------|--------|-------|--------|-----------------|-----------|
| **Healthy** | >50% | Emerald (#10B981) | Strong Green | `^ ◡ ^` | Slow Float |
| **Hungry** | 25-50% | Lime (#84CC16) | Weak Yellow | `• _ •` | Occasional Bounce |
| **Critical** | <25% | Amber (#F59E0B) | Red Pulse | `> _ <` | Shaking / Rapid Pulse |
| **Ascended** | 0% | Starlight (#F8FAFC) | White Glow | `^ ◡ ^` (Peaceful) | Floats Up + Dissolves |

> **Ascended Note:** When vault expires, Kip doesn't die. He turns into light and flies up to deliver the legacy. "Mission Complete."

## 3. The "Unique Kip" System (Curated Palettes)

Instead of random colors (which can be ugly), we use **5 Curated Gradient Palettes**.
`seed % 5` determines the Kip Type.

| ID | Name | Core Gradient (Bottom-Left → Top-Right) | Personality |
|----|------|-----------------------------------------|-------------|
| 0 | **Original** | Emerald 400 → 500 (`#34D399` → `#10B981`) | Friendly |
| 1 | **Ocean** | Cyan 400 → Blue 500 (`#22D3EE` → `#3B82F6`) | Calm |
| 2 | **Galaxy** | Purple 400 → Pink 500 (`#C084FC` → `#EC4899`) | Mystic |
| 3 | **Solar** | Orange 400 → Amber 500 (`#FB923C` → `#F59E0B`) | Energetic |
| 4 | **Phantom** | Teal 400 → Slate 500 (`#2DD4BF` → `#64748B`) | Stoic |

## 4. Interaction Physics (Framer Motion)
- **Hover:** Kip looks at cursor (move pupils).
- **Click/Feed:** Squish effect (`scaleY: 0.8`) then bounce (`scale: 1.2`).
- **Idle:** Breathe (`scale: 1.05` every 4s).

## 5. Mobile Considerations
- On mobile, Kip acts as the "Status Indicator" in the Navbar.
