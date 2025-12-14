# Refactor Proposal: src/utils/crypto.ts

## 🚨 Issues Found
- [Warning] **Single File Overload**: 400+ lines mixing primitive crypto operations, business wrapping/unwrapping logic, and JSON packaging structure.
- [Warning] **Mixed Concerns**: Low-level `arrayBufferToBase64` utils sit next to high-level business logic `createPasswordProtectedVaultPackage`.
- [Warning] **Testability**: Hard to test `encryptFile` in isolation without mocking the entire crypto implementation.

## 🛠️ Plan

### Phase 1: Split into Modules (Extraction)
Create a new directory `src/utils/crypto/` and split the file:

1.  **`src/utils/crypto/primitives.ts`**
    *   AES-GCM encrypt/decrypt
    *   PBKDF2 derivation
    *   Key generation
    *   Base64 conversion helpers

2.  **`src/utils/crypto/wrappers.ts`**
    *   `wrapKeyWithPassword` / `unwrapKeyWithPassword`
    *   `wrapKeyWithWallet` / `unwrapKeyWithWallet`
    *   Wallet key derivation logic

3.  **`src/utils/crypto/packaging.ts`**
    *   `createPasswordProtectedVaultPackage`
    *   `createWalletProtectedVaultPackage`
    *   Types (`EncryptedVaultData`, etc.)

### Phase 2: Barrel Export
Create `src/utils/crypto/index.ts` to re-export everything, ensuring backward compatibility with existing imports so the rest of the app doesn't break immediately.

### Phase 3: Cleanup
-   Add robust JSDoc for every exported function.
-   Ensure strictly typed return values.

## 🚀 Benefits
-   **Security Audit**: Easier to audit low-level primitives separately from business logic.
-   **Reuse**: Primitives can be reused for other features (e.g., local storage encryption) without importing packaging logic.
-   **Maintainability**: Clearer separation of "How we encrypt" vs "What we encrypt".
