# T.3 Claim with Token Release

> "Claim cả secret data lẫn crypto assets trong một flow thống nhất."

## 🎯 Goal

Tạo unified claim experience - recipient claim data và tokens trong cùng một UI flow.

## 📐 Claim Flow Options

### Option A: Separate Claims (Recommended for Phase 1)
```
┌─────────────────────────────────────────────────────────────┐
│                    SEPARATE CLAIMS                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. [View Secret] → Download/decrypt (existing)             │
│                                                             │
│  2. [Claim SOL]   → claim_sol instruction                   │
│                                                             │
│  3. [Claim USDC]  → claim_tokens instruction                │
│                                                             │
│  Pros: Simple, flexible, recipient pays only what they use  │
│  Cons: Multiple transactions                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Option B: Atomic Claim All (Future)
```
┌─────────────────────────────────────────────────────────────┐
│                     ATOMIC CLAIM                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Claim Everything] → Single transaction:                   │
│     - claim_sol()                                           │
│     - claim_tokens()                                        │
│     - mark data as claimed                                  │
│                                                             │
│  Requires: Composable CPI or batch transaction              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Phase 1 Decision:** Go with Option A (Separate Claims).

## 🛠️ Implementation

### Phase 1: Separate Claims

No new contract changes needed - reuse `claim_sol` (T.1) và `claim_tokens` (T.2).

### Optional: Add `claim_and_close` Enhancement

Update existing `claim_and_close` to also handle tokens:

```rust
// instructions/claim_and_close.rs (UPDATED)
pub fn claim_and_close(ctx: Context<ClaimAndClose>) -> Result<()> {
    let vault = &ctx.accounts.vault;
    
    // Check if there are unclaimed assets
    require!(
        vault.locked_lamports == 0, 
        VaultError::UnclaimedSol
    );
    require!(
        vault.locked_tokens == 0, 
        VaultError::UnclaimedTokens
    );
    
    // Existing close logic - transfer remaining rent to recipient
    // ...
    
    Ok(())
}
```

## 🎨 Frontend Changes

### Claim Portal - Multi-Asset View

```
┌────────────────────────────────────────────────────────────┐
│ 🎉 Vault Released!                                         │
│                                                            │
│ From: 0x1234...abcd                                        │
│ Created: Dec 1, 2025 • Released: Dec 9, 2025               │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ 📄 SECRET DATA                                             │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ 📁 family_documents.zip (12.3 MB)                      │ │
│ │                                                        │ │
│ │ Enter decryption key:                                  │ │
│ │ [________________________________]                     │ │
│ │                                                        │ │
│ │                              [🔓 Decrypt & Download]   │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ 💰 LOCKED ASSETS                                           │
│ ┌────────────────────────────────────────────────────────┐ │
│ │                                                        │ │
│ │ ◎ 2.5 SOL                              [Claim SOL]     │ │
│ │   ~$500 USD                            ✅ Claimed      │ │
│ │                                                        │ │
│ │ 💵 500 USDC                            [Claim USDC]    │ │
│ │   ~$500 USD                            ⏳ Pending      │ │
│ │                                                        │ │
│ │ ────────────────────────────────────────────────────── │ │
│ │ Total Value: ~$1,000 USD                               │ │
│ │                                                        │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ─────────────────────────────────────────────────────────  │
│                                                            │
│                                    [Close Vault & Finish]  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Claim Status Icons

| Status | Icon | Description |
|--------|------|-------------|
| Available | ⏳ | Asset ready to claim |
| Claiming | 🔄 | Transaction in progress |
| Claimed | ✅ | Already claimed |
| Error | ❌ | Transaction failed |

### Claim Button Component

```tsx
// components/claim/ClaimAssetButton.tsx

interface ClaimAssetButtonProps {
  type: 'sol' | 'token';
  amount: number;
  symbol: string;
  usdValue?: number;
  onClaim: () => Promise<void>;
  isClaimed: boolean;
}

export function ClaimAssetButton({
  type,
  amount,
  symbol,
  usdValue,
  onClaim,
  isClaimed,
}: ClaimAssetButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  const handleClaim = async () => {
    setStatus('loading');
    try {
      await onClaim();
      setStatus('success');
    } catch (error) {
      setStatus('error');
      toast.error(`Failed to claim ${symbol}`);
    }
  };
  
  if (isClaimed) {
    return (
      <div className="flex items-center gap-2 text-green-500">
        <CheckCircle className="w-5 h-5" />
        <span>Claimed</span>
      </div>
    );
  }
  
  return (
    <Button 
      onClick={handleClaim}
      disabled={status === 'loading'}
    >
      {status === 'loading' ? (
        <Loader2 className="animate-spin" />
      ) : (
        `Claim ${symbol}`
      )}
    </Button>
  );
}
```

### Hook: useClaimVault

```tsx
// hooks/useClaimVault.ts

export function useClaimVault(vaultPubkey: PublicKey) {
  const { program } = useProgram();
  const { connection } = useConnection();
  const wallet = useWallet();
  
  const claimSol = useCallback(async () => {
    if (!wallet.publicKey || !program) return;
    
    const tx = await program.methods
      .claimSol()
      .accounts({
        vault: vaultPubkey,
        recipient: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
      
    await connection.confirmTransaction(tx);
    return tx;
  }, [program, vaultPubkey, wallet.publicKey]);
  
  const claimTokens = useCallback(async (
    tokenMint: PublicKey
  ) => {
    if (!wallet.publicKey || !program) return;
    
    const vaultAta = getAssociatedTokenAddressSync(
      tokenMint,
      vaultPubkey,
      true // allowOwnerOffCurve for PDA
    );
    
    const recipientAta = getAssociatedTokenAddressSync(
      tokenMint,
      wallet.publicKey
    );
    
    const tx = await program.methods
      .claimTokens()
      .accounts({
        vault: vaultPubkey,
        recipient: wallet.publicKey,
        tokenMint,
        vaultTokenAccount: vaultAta,
        recipientTokenAccount: recipientAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
      
    await connection.confirmTransaction(tx);
    return tx;
  }, [program, vaultPubkey, wallet.publicKey]);
  
  return { claimSol, claimTokens };
}
```

## ⚠️ UX Considerations

1. **Claim Order:**
   - Recommend: Claim tokens first, then SOL
   - Reason: SOL claim might leave dust for tx fees

2. **Gas Estimation:**
   - Show estimated tx fee before each claim
   - Warn if recipient has insufficient SOL for fees

3. **Token Account Creation:**
   - Explain to user: "Creating token account costs ~0.002 SOL"
   - This is returned when vault ATA is closed

4. **Error Recovery:**
   - Allow retry on failed claims
   - Show transaction ID for debugging

## ✅ Execution Steps

### Frontend
- [ ] Create ClaimAssetButton component
- [ ] Create useClaimVault hook
- [ ] Update ClaimPortal to show assets
- [ ] Add claim status tracking
- [ ] Handle token metadata fetching
- [ ] USD price display (optional)
- [ ] Error handling & retry logic

### UX Polish
- [ ] Loading states
- [ ] Success animations
- [ ] Transaction confirmation toasts
- [ ] Mobile responsiveness

### Testing
- [ ] Test claim SOL flow
- [ ] Test claim SPL token flow
- [ ] Test claim with no tokens (graceful)
- [ ] Test insufficient gas error
- [ ] Test network errors & recovery
