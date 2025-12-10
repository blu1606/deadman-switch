# 🛡️ Security Analysis Report

> **Date:** 2025-12-11  
> **Target:** Full Codebase Scan (Frontend, API, Crypto)  
> **Status:** ⚠️ HIGH PRIORITY FIXES NEEDED

---

## 🚨 Critical Vulnerabilities (Must Fix)

### 1. Weak Default JWT Secret (`src/utils/jwt.ts`)
**Severity:** 🔥 **CRITICAL**
*   **Issue:** The `JWT_SECRET` defaults to `'dev-secret-change-in-production'` if the env var is missing.
*   **Risk:** An attacker can sign their own "Magic Link" tokens and reset the timer for *any* vault, effectively locking funds forever (Griefing Attack).
*   **Fix:**
    ```typescript
    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
        throw new Error('FATAL: JWT_SECRET is not defined');
    }
    ```

### 2. Ephemeral Server Wallet (`src/utils/serverWallet.ts`)
**Severity:** 🟠 **MEDIUM**
*   **Issue:** `Keypair.generate()` is used when `PLATFORM_WALLET_PRIVATE_KEY` is missing in dev.
*   **Risk:** In production, if the env var is missed, the server starts with a random wallet. All "Delegate" pings will fail (signature mismatch), causing vaults to expire and assets to be released prematurely if the user relied solely on the delegate.
*   **Fix:** Ensure hard crash in production if key is missing (Already implemented, but requires strict ENV checks in deployment pipeline).

---

## ⚠️ Potential Risks (Enhancement Needed)

### 3. PII Storage (`src/app/api/vault/notify-subscribe/route.ts`)
**Severity:** 🟡 **LOW**
*   **Issue:** `recipient_email` is stored in `vault_notify_subscriptions`.
*   **Risk:** Database leak exposes relationships between Vault Addresses (Assets) and Real Identities (Emails).
*   **Fix:** Ensure strict **Row Level Security (RLS)** in Supabase. Only the Service Role (API) should be able to read this table. No public access.

### 4. Client-Side Encryption Integrity (`src/utils/crypto.ts`)
**Severity:** 🟡 **LOW**
*   **Issue:** AES-GCM provides confidentiality and integrity for the *ciphertext*, but there is no signature on the *metadata* (filename, size).
*   **Risk:** A malicious storage provider (IPFS/Pinata) could swap the blobs or rename files to mislead the recipient.
*   **Fix:** Compute a Hash (SHA-256) of the final JSON package and store that on-chain (in the Anchor instruction `init_vault`).

---

## ✅ Good Practices Found

*   **Zero-Knowledge:** `src/utils/crypto.ts` correctly uses `Web Crypto API` (SubtleCrypto). Keys are generated client-side and never sent to the server (except wrapped versions).
*   **Access Control:** `src/app/api/magic-ping/route.ts` explicitly verifies `vaultAccount.delegate` matches the server key before attempting to ping.
*   **Wallet Mode:** The deterministic key derivation (`deriveRecipientKey`) is a clever way to allow recipient-only decryption without an interactive key exchange.

---

## 🛠️ Action Plan

1.  **Immediate:** Add production check for `JWT_SECRET`.
2.  **Deployment:** Verify `PLATFORM_WALLET_PRIVATE_KEY` is set in Vercel.
3.  **Database:** precise RLS policies for `vault_notify_subscriptions`.
