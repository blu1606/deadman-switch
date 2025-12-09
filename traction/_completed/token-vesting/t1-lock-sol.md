# T.1 Lock Native SOL

> "Lock SOL vào vault, release cùng với secret data."

## 🎯 Goal

Cho phép owner lock SOL vào vault PDA khi tạo vault. SOL chỉ được withdraw khi vault released.

## 📐 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                     SOL LOCKING FLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [CREATE VAULT + LOCK SOL]                                  │
│       │                                                     │
│       │  Owner calls initialize_vault()                     │
│       │  + transfers X SOL to Vault PDA                     │
│       ▼                                                     │
│  [VAULT ACTIVE]                                             │
│       │                                                     │
│       │  vault.locked_sol = X                               │
│       │  PDA balance = X + rent_exempt + bounty             │
│       ▼                                                     │
│  [VAULT RELEASED]                                           │
│       │                                                     │
│       │  is_released = true                                 │
│       ▼                                                     │
│  [RECIPIENT CLAIMS]                                         │
│       │                                                     │
│       │  claim_sol() → X SOL transferred to recipient       │
│       │  vault.locked_sol = 0                               │
│       ▼                                                     │
│  [DONE]                                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Contract Changes

### 1. Update Vault Struct

```rust
// state.rs
pub struct Vault {
    // ... existing fields ...
    
    /// Amount of SOL locked for vesting (lamports)
    pub locked_lamports: u64,
}
```

**Space calculation:**
- Add 8 bytes for `locked_lamports: u64`
- Update `Vault::SPACE` constant

### 2. Update `initialize_vault` Instruction

```rust
// instructions/init.rs
pub fn initialize_vault(
    ctx: Context<InitializeVault>,
    // ... existing params ...
    locked_lamports: u64,  // NEW: Amount to lock
) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    
    // ... existing logic ...
    
    // Transfer locked SOL from signer to vault PDA
    if locked_lamports > 0 {
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.signer.to_account_info(),
                to: vault.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, locked_lamports)?;
    }
    
    vault.locked_lamports = locked_lamports;
    
    Ok(())
}
```

### 3. Add `claim_sol` Instruction

```rust
// instructions/claim_sol.rs (NEW FILE)
use anchor_lang::prelude::*;
use crate::state::Vault;
use crate::errors::VaultError;

#[derive(Accounts)]
pub struct ClaimSol<'info> {
    #[account(
        mut,
        has_one = recipient @ VaultError::NotRecipient,
        constraint = vault.is_released @ VaultError::NotReleased,
        constraint = vault.locked_lamports > 0 @ VaultError::NoLockedSol,
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub recipient: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn claim_sol(ctx: Context<ClaimSol>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let amount = vault.locked_lamports;
    
    // Transfer SOL from vault PDA to recipient
    // Use vault seeds for PDA signing
    **vault.to_account_info().try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.recipient.try_borrow_mut_lamports()? += amount;
    
    // Mark as claimed
    vault.locked_lamports = 0;
    
    msg!("Claimed {} lamports", amount);
    
    Ok(())
}
```

### 4. Update Error Enum

```rust
// errors.rs
#[error_code]
pub enum VaultError {
    // ... existing errors ...
    
    #[msg("No SOL locked in vault")]
    NoLockedSol,
}
```

### 5. Update lib.rs

```rust
// lib.rs
pub mod claim_sol;
use claim_sol::*;

#[program]
pub mod deadmans_switch {
    // ... existing instructions ...
    
    pub fn claim_sol(ctx: Context<ClaimSol>) -> Result<()> {
        claim_sol::claim_sol(ctx)
    }
}
```

## 🎨 Frontend Changes

### Create Vault Wizard - New Step/Field

```
┌────────────────────────────────────────────────────────────┐
│ 💰 Lock Assets (Optional)                                  │
│                                                            │
│ Lock SOL to be released with your secret:                  │
│                                                            │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Amount: [    0.5    ] SOL                            │   │
│ │                                                      │   │
│ │ Your balance: 2.34 SOL                               │   │
│ │ After lock: 1.84 SOL                                 │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                            │
│ ⚠️ This SOL will be locked until the vault is released    │
│    and claimed by the recipient.                          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Claim Portal - Show Locked Assets

```
┌────────────────────────────────────────────────────────────┐
│ 🎁 Vault Contents                                          │
│                                                            │
│ 📄 Secret Data: myfile.pdf (2.3 MB)         [Download]     │
│                                                            │
│ 💰 Locked Assets:                                          │
│ ├─ 1.5 SOL (~$300)                          [Claim]        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Dashboard - Show Vault Value

```
┌────────────────────────────────────────────────────────────┐
│ 🔒 Family Vault                                            │
│                                                            │
│ Timer: 28 days remaining                                   │
│ Bounty: 0.01 SOL                                           │
│ Locked: 1.5 SOL ($300)                                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## ⚠️ Security Considerations

1. **Rent Exemption:**
   - Vault PDA cần giữ minimum balance để rent-exempt
   - `claim_sol` phải check không withdraw quá số SOL có thể
   
   ```rust
   let rent = Rent::get()?;
   let min_balance = rent.minimum_balance(vault.to_account_info().data_len());
   require!(
       vault.to_account_info().lamports() - amount >= min_balance,
       VaultError::InsufficientRent
   );
   ```

2. **Re-entrancy:**
   - Set `locked_lamports = 0` TRƯỚC khi transfer
   - Hoặc use atomic check-effect-interaction pattern

3. **Owner không thể withdraw:**
   - Không có instruction để owner rút SOL
   - Chỉ recipient sau khi released

## 💰 Cost Analysis

| Action | Cost | Notes |
|--------|------|-------|
| Lock 1 SOL | 1 SOL + tx fee | Owner pays |
| Claim SOL | ~0.000005 SOL tx fee | Recipient pays |

## ✅ Execution Steps

### Contract
- [ ] Add `locked_lamports` field to Vault struct
- [ ] Update Vault::SPACE calculation
- [ ] Update `initialize_vault` to accept and transfer locked SOL
- [ ] Create `claim_sol` instruction
- [ ] Add `NoLockedSol` error variant
- [ ] Update lib.rs exports
- [ ] Write tests
- [ ] Update IDL
- [ ] Deploy to devnet

### Frontend
- [ ] Add "Lock SOL" input to Create Vault wizard
- [ ] Update vault creation transaction
- [ ] Show locked amount on Dashboard
- [ ] Add claim UI in Claim Portal
- [ ] Connect claim button to `claim_sol` instruction

### Testing
- [ ] Unit test: Lock 0.1 SOL in vault
- [ ] Unit test: Claim SOL as recipient (success)
- [ ] Unit test: Claim before release (fail)
- [ ] Unit test: Claim as non-recipient (fail)
- [ ] Unit test: Double claim (fail)
- [ ] Integration test: Full flow (create → release → claim)
