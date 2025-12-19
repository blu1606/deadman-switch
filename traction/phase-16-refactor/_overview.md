# 🛠 Phase 16: Code Quality & Architectural Refactor

> **Philosophy:** "Clean code is sustainable code. Decentralize responsibly."  
> **Focus:** Decomposing God Components & Extracting Business Logic  
> **Updated:** 2025-12-19

---

## 🎯 Core Problem

```
Current Experience:
  1. StepConfirm.tsx (560 lines) handles UI, encryption, IPFS, and Solana.
  2. ClaimModal.tsx (782 lines) handles 4 states, versioned decryption, and claims.
  3. High technical debt and risk of regression during feature addition.
```

**Target:** Modular hooks for logic and lightweight, focused components for UI.

---

## 📊 Feature Matrix

| ID | Feature | Difficulty | Benefit | Priority | Target |
|----|---------|------------|---------|----------|--------|
| **16.1** | Functional Hook Extraction | ⭐⭐ | ⭐⭐⭐⭐ | **P0** | Beta |
| **16.2** | UI Component Decomposition | ⭐⭐⭐ | ⭐⭐⭐ | **P1** | Beta |

---

## 📂 Spec Files

| File | Content | Status |
|------|---------|--------|
| [16.1-logic-hooks.md](./16.1-logic-hooks.md) | Moving transaction & encryption logic to hooks | ✅ Done |
| [16.2-ui-decomposition.md](./16.2-ui-decomposition.md) | Splitting God Components into sub-components | ✅ Done |

---

## 🔗 Dependencies

| Feature | Depends On | Status | Note |
|---------|------------|--------|------|
| 16.1 Logic Hooks | useUnifiedWallet | ✅ Stable | Core identity dependency |
| 16.2 UI Decomposition | TanStack Query | ✅ Stable | For cache management |

---

## 🚀 Execution Order

1. **16.1 Functional Hook Extraction** - Create `useCreateVault`, `useVaultUnlock`, and `useVaultActions`.
2. **16.2 UI Component Decomposition** - Refactor `StepConfirm` and `ClaimModal` to use new hooks and sub-components.

---

## 💡 Key Insight

> **"Separation of Concerns"**  
> Business logic lives in hooks; presentation lives in components.  
> This allows us to scale KipSwitch features (like multisig or social recovery) without breaking the core UI.
