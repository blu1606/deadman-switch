# C.3 Claimed Vault Archive

> Lưu trữ các vault đã claim để xem lại.

## Goal

Recipient có "vault history" - danh sách các vault đã claim, có thể xem lại content bất kỳ lúc nào.

## Storage Approach

**Hybrid: localStorage + optional future sync**

```typescript
// Key pattern
const key = `claimed_vaults_${recipientWallet}`;

interface ClaimedVaultRecord {
    address: string;
    name: string;
    claimedAt: number; // Unix timestamp
    senderAddress: string;
    senderName?: string;
    contentSummary: {
        itemCount: number;
        totalSize: number;
        types: VaultItemType[];
    };
    ipfsCid: string; // For re-fetching
    decryptionHint?: string; // Password hint if saved
}
```

## UI Concept

```
┌────────────────────────────────────────────────────────────────┐
│  📦 MY VAULT ARCHIVE                              [Sort ▼]     │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 💌 "Letter to My Children"          Claimed: Dec 9, 2024 │   │
│  │     From: Mom (0x7Kj...4Bq)                              │   │
│  │     📝 2 notes · 🎤 1 audio · 1.2 MB                     │   │
│  │                              [ 👁️ View ] [ ⬇️ Export ]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔐 "Crypto Recovery Keys"           Claimed: Nov 15, 2024│   │
│  │     From: Self (0x9Af...2Cd)                             │   │
│  │     📄 1 file · 256 KB                                   │   │
│  │                              [ 👁️ View ] [ ⬇️ Export ]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Component Spec

### `useClaimedVaults` Hook

```tsx
interface UseClaimedVaultsReturn {
    vaults: ClaimedVaultRecord[];
    addVault: (record: ClaimedVaultRecord) => void;
    removeVault: (address: string) => void;
    loading: boolean;
}

export function useClaimedVaults(): UseClaimedVaultsReturn {
    // Read from localStorage
    // Write on claim success
}
```

### `ClaimedVaultCard.tsx`

```tsx
interface ClaimedVaultCardProps {
    vault: ClaimedVaultRecord;
    onView: () => void;
    onExport: () => void;
}
```

### `/archive` Page

```tsx
export default function ArchivePage() {
    const { connected } = useWallet();
    const { vaults } = useClaimedVaults();
    
    // Show empty state if no vaults
    // Show list of ClaimedVaultCard
}
```

## Flow Integration

### After Claim Success

```tsx
// In claim flow, after successful decrypt
const { addVault } = useClaimedVaults();

addVault({
    address: vault.publicKey.toBase58(),
    name: vault.name,
    claimedAt: Date.now(),
    senderAddress: vault.owner.toBase58(),
    contentSummary: {
        itemCount: bundle.items.length,
        totalSize: bundle.metadata.totalSize,
        types: bundle.items.map(i => i.type)
    },
    ipfsCid: vault.ipfsCid
});
```

## Re-View Flow

When user clicks "View" on archived vault:
1. Fetch encrypted bundle from IPFS (cached ideally)
2. Prompt for password/wallet signature
3. Decrypt and show content in modal

## Navigation

Add link in header:
```tsx
<NavLink href="/archive">📦 Archive</NavLink>
```

## Implementation Steps

- [ ] Create `useClaimedVaults` hook
- [ ] Create `ClaimedVaultCard.tsx` component
- [ ] Create `/archive` page route
- [ ] Integrate "Save to Archive" after claim success
- [ ] Add "Archive" link to navigation
- [ ] Add "View" modal for re-decryption
- [ ] Add "Export" (download all as zip)
