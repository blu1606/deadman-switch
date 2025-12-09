# T.2 Lock SPL Tokens

> "Lock USDC, BONK, hoặc bất kỳ SPL token nào vào vault."

## 🎯 Goal

Cho phép owner lock SPL tokens vào vault. Tokens được giữ trong Associated Token Account (ATA) owned by Vault PDA.

## 📐 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                   SPL TOKEN LOCKING FLOW                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [CREATE VAULT + LOCK SPL]                                  │
│       │                                                     │
│       │  1. Create ATA for Vault PDA (mint X)               │
│       │  2. Transfer tokens from owner → Vault ATA          │
│       ▼                                                     │
│  [VAULT ACTIVE]                                             │
│       │                                                     │
│       │  vault.token_mint = X                               │
│       │  vault.locked_tokens = amount                       │
│       │  Vault ATA balance = amount                         │
│       ▼                                                     │
│  [VAULT RELEASED]                                           │
│       │                                                     │
│       │  is_released = true                                 │
│       ▼                                                     │
│  [RECIPIENT CLAIMS]                                         │
│       │                                                     │
│       │  1. Create/get ATA for recipient (mint X)           │
│       │  2. Transfer tokens: Vault ATA → Recipient ATA      │
│       │  3. Close Vault ATA (optional, reclaim rent)        │
│       ▼                                                     │
│  [DONE]                                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Dependencies

Add to `Cargo.toml`:
```toml
[dependencies]
anchor-spl = "0.30.1"  # Match your anchor version
```

## 🛠️ Contract Changes

### 1. Update Vault Struct

```rust
// state.rs
pub struct Vault {
    // ... existing fields ...
    
    /// SPL token mint address (None if no tokens locked)
    pub token_mint: Option<Pubkey>,
    
    /// Amount of SPL tokens locked
    pub locked_tokens: u64,
}
```

**Space calculation:**
- Add 33 bytes for `token_mint: Option<Pubkey>` (1 + 32)
- Add 8 bytes for `locked_tokens: u64`
- Total: +41 bytes to `Vault::SPACE`

### 2. Create `lock_tokens` Instruction

```rust
// instructions/lock_tokens.rs (NEW FILE)
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};
use crate::state::Vault;
use crate::errors::VaultError;

#[derive(Accounts)]
pub struct LockTokens<'info> {
    #[account(
        mut,
        has_one = owner @ VaultError::NotOwner,
        constraint = !vault.is_released @ VaultError::AlreadyReleased,
        constraint = vault.token_mint.is_none() @ VaultError::TokensAlreadyLocked,
    )]
    pub vault: Account<'info, Vault>,

    pub owner: Signer<'info>,

    pub token_mint: Account<'info, Mint>,

    /// Owner's token account (source)
    #[account(
        mut,
        constraint = owner_token_account.owner == owner.key(),
        constraint = owner_token_account.mint == token_mint.key(),
    )]
    pub owner_token_account: Account<'info, TokenAccount>,

    /// Vault's token account (destination)
    /// Will be created if doesn't exist
    #[account(
        init_if_needed,
        payer = owner,
        associated_token::mint = token_mint,
        associated_token::authority = vault,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn lock_tokens(ctx: Context<LockTokens>, amount: u64) -> Result<()> {
    require!(amount > 0, VaultError::InvalidAmount);
    
    let vault = &mut ctx.accounts.vault;
    
    // Transfer tokens from owner to vault
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.owner_token_account.to_account_info(),
                to: ctx.accounts.vault_token_account.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            },
        ),
        amount,
    )?;
    
    // Update vault state
    vault.token_mint = Some(ctx.accounts.token_mint.key());
    vault.locked_tokens = amount;
    
    msg!("Locked {} tokens of mint {}", amount, ctx.accounts.token_mint.key());
    
    Ok(())
}
```

### 3. Create `claim_tokens` Instruction

```rust
// instructions/claim_tokens.rs (NEW FILE)
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, CloseAccount, Mint, Token, TokenAccount, Transfer},
};
use crate::state::Vault;
use crate::errors::VaultError;
use crate::constants::VAULT_SEED;

#[derive(Accounts)]
pub struct ClaimTokens<'info> {
    #[account(
        mut,
        has_one = recipient @ VaultError::NotRecipient,
        constraint = vault.is_released @ VaultError::NotReleased,
        constraint = vault.token_mint.is_some() @ VaultError::NoTokensLocked,
        constraint = vault.locked_tokens > 0 @ VaultError::AlreadyClaimed,
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub recipient: Signer<'info>,

    #[account(
        constraint = token_mint.key() == vault.token_mint.unwrap() @ VaultError::InvalidMint,
    )]
    pub token_mint: Account<'info, Mint>,

    /// Vault's token account (source)
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = vault,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    /// Recipient's token account (destination)
    /// Will be created if doesn't exist
    #[account(
        init_if_needed,
        payer = recipient,
        associated_token::mint = token_mint,
        associated_token::authority = recipient,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn claim_tokens(ctx: Context<ClaimTokens>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let amount = vault.locked_tokens;
    
    // PDA seeds for signing
    let seeds = &[
        VAULT_SEED,
        vault.owner.as_ref(),
        &vault.vault_seed.to_le_bytes(),
        &[vault.bump],
    ];
    let signer_seeds = &[&seeds[..]];
    
    // Transfer tokens from vault to recipient
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_token_account.to_account_info(),
                to: ctx.accounts.recipient_token_account.to_account_info(),
                authority: vault.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
    )?;
    
    // Close vault token account and reclaim rent to recipient
    token::close_account(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: ctx.accounts.vault_token_account.to_account_info(),
                destination: ctx.accounts.recipient.to_account_info(),
                authority: vault.to_account_info(),
            },
            signer_seeds,
        ),
    )?;
    
    // Mark as claimed
    vault.locked_tokens = 0;
    
    msg!("Claimed {} tokens", amount);
    
    Ok(())
}
```

### 4. Update Error Enum

```rust
// errors.rs
#[error_code]
pub enum VaultError {
    // ... existing errors ...
    
    #[msg("Tokens already locked in vault")]
    TokensAlreadyLocked,
    
    #[msg("No tokens locked in vault")]
    NoTokensLocked,
    
    #[msg("Invalid token mint")]
    InvalidMint,
    
    #[msg("Already claimed")]
    AlreadyClaimed,
    
    #[msg("Invalid amount")]
    InvalidAmount,
}
```

## 🎨 Frontend Changes

### Token Selection UI in Create Vault

```
┌────────────────────────────────────────────────────────────┐
│ 💰 Lock Tokens (Optional)                                  │
│                                                            │
│ Select token:                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ [USDC ▼]  Token search...                            │   │
│ │                                                      │   │
│ │ Popular:                                             │   │
│ │ ○ SOL (Native)                                       │   │
│ │ ○ USDC (EPjFWd...)                                   │   │
│ │ ○ BONK (DezXAZ...)                                   │   │
│ │ ○ Custom token...                                    │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                            │
│ Amount: [      100      ] USDC                             │
│                                                            │
│ Your balance: 1,234.56 USDC                                │
│ After lock: 1,134.56 USDC                                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Show Token Info on Dashboard

```
┌────────────────────────────────────────────────────────────┐
│ 🔒 Emergency Fund Vault                                    │
│                                                            │
│ Timer: 28 days remaining                                   │
│                                                            │
│ 📦 Contents:                                               │
│ ├─ 📄 Secret document                                      │
│ ├─ 💵 100 USDC ($100)                                      │
│ └─ 💰 0.5 SOL ($100)                                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## ⚠️ Security Considerations

1. **Token Authority:**
   - Vault PDA MUST be authority of vault_token_account
   - Only Vault PDA (via CPI signer) can transfer out

2. **Mint Validation:**
   - Always verify token_mint matches vault.token_mint
   - Prevent swap attack (claim different token)

3. **ATA Creation:**
   - Use `init_if_needed` for both vault và recipient ATA
   - Vercel recipient pays for their ATA rent

4. **Token Account Closure:**
   - Close vault ATA after claim để reclaim rent
   - Rent goes to recipient (họ đã pay claim tx)

5. **Single Token Limit (Phase 1):**
   - Một vault chỉ chứa 1 loại SPL token
   - Future: vector of locked tokens

## 💰 Cost Analysis

| Action | Cost | Payer |
|--------|------|-------|
| Create vault ATA | ~0.002 SOL rent | Owner |
| Lock tokens | tx fee | Owner |
| Create recipient ATA | ~0.002 SOL rent | Recipient |
| Claim tokens | tx fee | Recipient |
| Close vault ATA | -0.002 SOL returned | → Recipient |

## 🔍 Testing Tokens

### Devnet Test Tokens
- **USDC Devnet:** `Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr`
- **USDT Devnet:** `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`

### Create Test Token
```bash
spl-token create-token
spl-token create-account <MINT>
spl-token mint <MINT> 1000000
```

## ✅ Execution Steps

### Contract
- [ ] Add `anchor-spl` dependency
- [ ] Add `token_mint` and `locked_tokens` to Vault struct
- [ ] Update Vault::SPACE
- [ ] Create `lock_tokens` instruction
- [ ] Create `claim_tokens` instruction
- [ ] Add new error variants
- [ ] Update lib.rs exports
- [ ] Write unit tests
- [ ] Update IDL
- [ ] Deploy to devnet

### Frontend
- [ ] Create TokenSelect component
- [ ] Add token locking to Create Vault wizard
- [ ] Fetch token metadata (name, symbol, logo)
- [ ] Show locked tokens on Dashboard
- [ ] Create claim tokens UI
- [ ] Connect to contract instructions

### Testing
- [ ] Unit test: Lock 100 USDC (devnet)
- [ ] Unit test: Claim tokens as recipient
- [ ] Unit test: Claim wrong mint (fail)
- [ ] Unit test: Claim before release (fail)
- [ ] Unit test: Double claim (fail)
- [ ] Integration test: Full flow with SPL token
