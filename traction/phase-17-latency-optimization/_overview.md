# ⚡ Phase 17: Latency Optimization (Hybrid Shell)

> **Philosophy:** "Speed is a feature. Interaction should be instantaneous."  
> **Focus:** SSR UI Shell, Fragmented Hydration, and Facebook-style Streaming.  
> **Updated:** 2025-12-19

---

## 🎯 Core Problem

```
Current Experience:
  1. Root Layout blocks on client-side JS (ssr: false for Header).
  2. Page transitions feel "clunky" due to full hydration and heavy Web3 JS.
  3. "INITIALIZING..." screens appear as waterfalls rather than overlapping streams.
```

**Target:** Sub-100ms perceived latency using a static shell and streaming data.

---

## 📊 Feature Matrix

| ID | Feature | Difficulty | Benefit | Priority | Target |
|----|---------|------------|---------|----------|--------|
| **17.1** | Static UI Shell SSR | ⭐⭐ | ⭐⭐⭐⭐⭐ | **P0** | UI/UX |
| **17.2** | Streaming & Skeletons | ⭐⭐⭐ | ⭐⭐⭐⭐ | **P1** | UX |
| **17.3** | Cache & Prefetch Optimization | ⭐⭐ | ⭐⭐⭐ | **P2** | Performance |

---

## 📂 Spec Files

| File | Content | Status |
|------|---------|--------|
| [17.1-shell-ssr.md](./17.1-shell-ssr.md) | Refactoring Header & Layout for instant SSR shell | 📝 Planned |
| [17.2-streaming-skeletons.md](./17.2-streaming-skeletons.md) | Implementation of loading.tsx and Skeleton UI | 📝 Planned |
| [17.3-cache-optimization.md](./17.3-cache-optimization.md) | TanStack Query config & prefetching logic | 📝 Planned |

---

## 🔗 Dependencies

| Feature | Depends On | Status | Note |
|---------|------------|--------|------|
| 17.1 Shell SSR | Next.js App Router | ✅ Stable | Native framework support |
| 17.2 Streaming | React Suspense | ✅ Stable | Framework core feature |

---

## 🚀 Execution Order

1. **17.1 Static UI Shell SSR** - Enable SSR for Header/Layout while isolating Wallet components.
2. **17.2 Streaming & Skeletons** - Create `loading.tsx` and Skeleton components for Dashboard/Claim.
3. **17.3 Cache Optimization** - Configure TanStack Query for SWR and link prefetching.

---

## 💡 Key Insight

> **"Perceived Latency vs. Actual Latency"**  
> We can't make Solana faster, but we can make the UI respond instantly.  
> By showing the shell immediately, user cognitive load is reduced and the app feels "native".
