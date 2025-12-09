# C.1 Timeline Visualization

> Hiển thị journey của vault từ creation → release → claim.

## Goal

Recipient thấy được context: vault được tạo khi nào, unlock khi nào, để hiểu "câu chuyện" phía sau.

## UI Concept

```
─────●─────────────────●──────────────●───> time
   SEALED           RELEASED        CLAIMED
  Dec 1, 2024      Dec 9, 2024      Today

"Created by 0x7Kj...4Bq"            "You claimed this"
```

## Data Sources

| Data Point | Source | Calculation |
|------------|--------|-------------|
| Created | `vaultSeed` | `new Date(vaultSeed)` (seed = timestamp) |
| Released | On-chain | `lastCheckIn + timeInterval` |
| Claimed | localStorage | Record after successful claim |

## Component Spec

### `VaultTimeline.tsx`

```tsx
interface VaultTimelineProps {
    createdAt: Date;
    releasedAt: Date;
    claimedAt?: Date;
    senderAddress: string;
    senderName?: string; // From contact API
}
```

### States

| Milestone | Visual | Description |
|-----------|--------|-------------|
| Sealed | ⚪ Faded check | Past event, completed |
| Released | 🔵 Highlighted | Key moment |
| Claimed | 🟢 Pulse glow | Current/success |

## CSS Animation

```css
@keyframes milestone-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
    50% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
}
```

## Integration Points

- `/claim` page: Show above claim button
- `/archive` page: Show in claimed vault cards

## Implementation Steps

- [ ] Create `VaultTimeline.tsx` component
- [ ] Add `getCreatedDate(vaultSeed: BN)` utility
- [ ] Style milestones with Tailwind
- [ ] Add Framer Motion transitions
- [ ] Integrate into claim page
