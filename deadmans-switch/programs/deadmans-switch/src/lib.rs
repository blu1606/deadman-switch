use anchor_lang::prelude::*;

declare_id!("HnFEhMS84CabpztHCDdGGN8798NxNse7NtXW4aG17XpB");

// ============================================================================
// CONSTANTS
// ============================================================================

/// Seeds for Vault PDA
pub const VAULT_SEED: &[u8] = b"vault";

/// Maximum length of IPFS CID (CIDv1 base32 = ~59 chars, add padding)
pub const MAX_IPFS_CID_LEN: usize = 64;

/// Maximum length of encrypted AES key (base64 encoded)
pub const MAX_ENCRYPTED_KEY_LEN: usize = 128;

// ============================================================================
// PROGRAM
// ============================================================================

#[program]
pub mod deadmans_switch {
    use super::*;

    /// Initialize a new vault with dead man's switch functionality.
    /// Creates a PDA owned by the caller to store vault data.
    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        seed: u64,
        ipfs_cid: String,
        encrypted_key: String,
        recipient: Pubkey,
        time_interval: i64,
    ) -> Result<()> {
        require!(
            ipfs_cid.len() <= MAX_IPFS_CID_LEN,
            VaultError::IpfsCidTooLong
        );
        require!(
            encrypted_key.len() <= MAX_ENCRYPTED_KEY_LEN,
            VaultError::EncryptedKeyTooLong
        );
        require!(time_interval > 0, VaultError::InvalidTimeInterval);

        let vault = &mut ctx.accounts.vault;
        let clock = Clock::get()?;

        vault.owner = ctx.accounts.owner.key();
        vault.recipient = recipient;
        vault.ipfs_cid = ipfs_cid;
        vault.encrypted_key = encrypted_key;
        vault.time_interval = time_interval;
        vault.last_check_in = clock.unix_timestamp;
        vault.is_released = false;
        vault.vault_seed = seed;
        vault.bump = ctx.bumps.vault;

        msg!("Vault initialized for owner: {}", vault.owner);
        msg!("Vault Seed: {}", seed);
        msg!("Recipient: {}", vault.recipient);

        Ok(())
    }

    /// Ping (check-in) to reset the dead man's switch timer.
    /// Only the vault owner can call this instruction.
    pub fn ping(ctx: Context<Ping>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let clock = Clock::get()?;

        require!(!vault.is_released, VaultError::AlreadyReleased);

        vault.last_check_in = clock.unix_timestamp;

        msg!("Ping successful. Timer reset to: {}", vault.last_check_in);

        Ok(())
    }

    /// Trigger the release of vault contents if the timer has expired.
    /// Anyone can call this, but it only succeeds if the vault has expired.
    pub fn trigger_release(ctx: Context<TriggerRelease>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        let clock = Clock::get()?;

        require!(!vault.is_released, VaultError::AlreadyReleased);

        let expiry_time = vault
            .last_check_in
            .checked_add(vault.time_interval)
            .ok_or(VaultError::Overflow)?;

        require!(clock.unix_timestamp > expiry_time, VaultError::NotExpired);

        vault.is_released = true;

        msg!("Vault released! Recipient {} can now claim.", vault.recipient);

        Ok(())
    }

    /// Close the vault and reclaim rent back to owner.
    /// Only the vault owner can call this instruction.
    pub fn close_vault(_ctx: Context<CloseVault>) -> Result<()> {
        msg!("Vault closed by owner. Rent reclaimed.");
        Ok(())
    }

    /// Claim the vault contents and close it.
    /// Only the recipient can call this, and only after vault is expired.
    /// Rent is transferred to the recipient as inheritance bonus.
    pub fn claim_and_close(ctx: Context<ClaimAndClose>) -> Result<()> {
        let vault = &ctx.accounts.vault;
        let clock = Clock::get()?;

        // Check if vault is expired (allow claim even if not formally released)
        let expiry_time = vault
            .last_check_in
            .checked_add(vault.time_interval)
            .ok_or(VaultError::Overflow)?;

        require!(
            clock.unix_timestamp > expiry_time || vault.is_released,
            VaultError::NotExpired
        );

        msg!("Vault claimed and closed by recipient: {}", vault.recipient);
        msg!("Rent transferred to recipient.");

        Ok(())
    }
}

// ============================================================================
// ACCOUNTS
// ============================================================================

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = owner,
        space = Vault::SPACE,
        seeds = [VAULT_SEED, owner.key().as_ref(), seed.to_le_bytes().as_ref()],
        bump
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Ping<'info> {
    #[account(
        mut,
        has_one = owner @ VaultError::Unauthorized
    )]
    pub vault: Account<'info, Vault>,

    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct TriggerRelease<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
}

#[derive(Accounts)]
pub struct CloseVault<'info> {
    #[account(
        mut,
        close = owner,
        has_one = owner @ VaultError::Unauthorized
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimAndClose<'info> {
    #[account(
        mut,
        close = recipient,
        has_one = recipient @ VaultError::Unauthorized
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub recipient: Signer<'info>,
}

// ============================================================================
// STATE
// ============================================================================

#[account]
pub struct Vault {
    /// The wallet that created this vault
    pub owner: Pubkey, // 32 bytes

    /// The wallet that can claim when released
    pub recipient: Pubkey, // 32 bytes

    /// IPFS CID of the encrypted file
    pub ipfs_cid: String, // 4 + MAX_IPFS_CID_LEN bytes

    /// Base64-encoded encrypted AES key
    pub encrypted_key: String, // 4 + MAX_ENCRYPTED_KEY_LEN bytes

    /// Check-in interval in seconds
    pub time_interval: i64, // 8 bytes

    /// Timestamp of last check-in
    pub last_check_in: i64, // 8 bytes

    /// Whether the vault has been released
    pub is_released: bool, // 1 byte

    /// Unique seed for this vault
    pub vault_seed: u64, // 8 bytes

    /// PDA bump seed
    pub bump: u8, // 1 byte
}

impl Vault {
    /// Calculate the space needed for a Vault account
    /// Original: 290 bytes
    /// New: 290 + 8 (seed) = 298 bytes
    pub const SPACE: usize = 8 + 32 + 32 + (4 + MAX_IPFS_CID_LEN) + (4 + MAX_ENCRYPTED_KEY_LEN) + 8 + 8 + 1 + 8 + 1;
}

// ============================================================================
// ERRORS
// ============================================================================

#[error_code]
pub enum VaultError {
    #[msg("Only the vault owner can perform this action")]
    Unauthorized,

    #[msg("Vault timer has not expired yet")]
    NotExpired,

    #[msg("Vault has already been released")]
    AlreadyReleased,

    #[msg("IPFS CID exceeds maximum length")]
    IpfsCidTooLong,

    #[msg("Encrypted key exceeds maximum length")]
    EncryptedKeyTooLong,

    #[msg("Time interval must be greater than 0")]
    InvalidTimeInterval,

    #[msg("Arithmetic overflow occurred")]
    Overflow,
}
