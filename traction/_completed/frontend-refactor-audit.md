# 🎨 Frontend Refactor & Optimization Audit

> This document tracks the refactoring progress for UI/UX and client-side code. The goal is to optimize performance, reduce file size, improve modularity, and ensure long-term maintainability.

**Last Updated**: 2025-12-09
**Status**: 🟡 In Progress

---

## 📉 Refactoring Checklist

| Priority | Component/File | Lines | Issues Identified | Status |
|----------|----------------|-------|-------------------|--------|
| **High** | `src/components/dashboard/EditVaultModal.tsx` | 335 | Mixed concerns (UI, Logic, API, LocalStorage). Needs hook extraction. | 🔴 Pending |
| **High** | `src/app/dashboard/page.tsx` | 263 | Inline `VaultCard` rendering is heavy. Tight coupling with `VaultData`. | 🔴 Pending |
| **Medium** | `src/hooks/useVault.ts` | 231 | Manual byte parsing logic makes it hard to read. | 🔴 Pending |
| **Low** | `src/components/wallet/WalletContextProvider.tsx` | 46 | Hardcoded 'devnet' URL. Should use env var. | 🔴 Pending |
| **Low** | `src/components/wizard/StepUploadSecret.tsx` | 157 | UI/Logic mix, but manageable for now. | 🟢 Safe |
| **Low** | `src/app/layout.tsx` | 70 | Clean. Good use of dynamic imports. | 🟢 Safe |

---

## 🔍 Detailed Analysis & Recommendations

### 1. `EditVaultModal.tsx` (Critical)
- **Problem**: This component does too much. It handles form state, Solana transaction submission, LocalStorage for "Duress Mode", and API calls for "Magic Link".
- **Solution**:
    - **Extract Logic**: Create `useEditVault` hook to handle the `updateVault` transaction and state management.
    - **Extract UI**: Move "Duress Mode" and "Magic Link" sections to their own components (`DuressSettings`, `MagicLinkSettings`).

### 2. `dashboard/page.tsx` (Major)
- **Problem**: The map loop renders a complex card inline (lines 103-197). This makes the dashboard page hard to read and maintain.
- **Solution**:
    - **Extract Component**: Create `components/dashboard/VaultCard.tsx` (or update existing one if unused).
    - **Decouple**: Pass simple props to the card, avoiding deep dependency on the raw `VaultData` shape if possible.

### 3. `useVault.ts` (Optimization)
- **Problem**: The `fetchVaults` function manually parses raw Buffer data (lines 100-155). This is fragile and clutters the hook.
- **Solution**:
    - **Extract Utility**: Create `utils/parsers.ts` with `parseVaultAccount(data: Buffer): VaultData`.

### 4. `WalletContextProvider.tsx` (Config)
- **Problem**: `clusterApiUrl('devnet')` is hardcoded.
- **Solution**: Use `process.env.NEXT_PUBLIC_RPC_URL` locally, falling back to devnet/mainnet.

---

## 🚀 Optimization Goals
- **Modularity**: Smaller, single-purpose components.
- **Readability**: Logic extracted to hooks, UI stays declarative.
- ** maintainability**: Easier to test and debug isolated parts.
