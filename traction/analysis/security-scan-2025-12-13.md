# Security Analysis Report

> **Date:** 2025-12-13
> **Scope:** `src/` (Codebase Scan)

## 🚨 Critical Findings

### 1. Truncated BIP39 Wordlist (Logic Flaw)
*   **File:** `src/utils/safetyScanner.ts`
*   **Severity:** **High** (Conceptually) / **Medium** (Impact)
*   **Issue:** The `COMMON_BIP39_WORDS` array stops at the letter 'c' (~100 words). The actual BIP39 standard has 2048 words.
*   **Impact:** The `looksLikeSeedPhrase` function requires an 80% match ratio. If a user enters a valid seed phrase where most words start with d-z, the scanner will **fail to detect it**, bypassing the anti-doxxer protection.
*   **Recommendation:** Import the full wordlist from a library (like `bip39` or `bs58`) or paste the full 2048 words.

## ⚠️ Medium/Low Risks

### 1. `dangerouslySetInnerHTML` Usage
*   **File:** `src/app/layout.tsx`
*   **Context:** `dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}`
*   **Verdict:** **Safe**. Used for inserting JSON-LD (Schema.org metadata). Input is programmatically generated, not user input.
*   **File:** `src/components/ui/line-chart.tsx` (Verified via review)
*   **Context:** Used for SVG/Chart rendering? (Need to confirm if user labels are escaped).
*   **Recommendation:** Ensure any user-defined labels in charts are sanitized.

### 2. Private Key Handling
*   **Files:** `relay/claim/route.ts`, `serverWallet.ts`
*   **Verdict:** **Safe**. Keys are loaded from `process.env`.
*   **Observation:** `serverWallet.ts` has a dev fallback: `console.warn("⚠️ [DEV] No PLATFORM_WALLET_PRIVATE_KEY found. Generating ephemeral server wallet.")`. Ensure this path **cannot** trigger in production builds (checks `process.env.NODE_ENV`?).

## ✅ Good Practices Found
*   **Secrets:** No hardcoded secrets found in source (all `process.env`).
*   **Encryption:** `AES-GCM` used correctly with random IVs (in `crypto.ts`).
*   **AI:** Keys checked for existence before initialization.

## 🛠️ Action Plan
1.  **Fix `safetyScanner.ts`:** Update `COMMON_BIP39_WORDS` to include full list.
2.  **Audit `serverWallet.ts`:** Verify the ephemeral wallet fallback is disabled in `NODE_ENV=production`.
