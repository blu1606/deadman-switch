# 💰 Token Vesting - Lock SOL/SPL Tokens

> Mở rộng vault để chứa SOL hoặc SPL tokens được release cùng với secret data.

## 📊 Features

| Feature | Contract Change | Priority | Complexity |
|---------|-----------------|----------|------------|
| [T.1 Lock Native SOL](./t1-lock-sol.md) | ✅ Yes | 🔴 High | 🟡 Medium |
| [T.2 Lock SPL Tokens](./t2-lock-spl.md) | ✅ Yes | 🔴 High | 🟠 Hard |
| [T.3 Claim with Token Release](./t3-claim-tokens.md) | ✅ Yes | 🔴 High | 🟡 Medium |

## 🎯 Goal

Biến vault từ "gửi secret data" thành **"gửi secret data + crypto assets"**:
- Lock SOL/SPL tokens vào vault PDA
- Tokens chỉ được release khi vault is_released = true
- Recipient claim cả data lẫn tokens

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TOKEN VESTING FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [CREATE VAULT]                                             │
│       │                                                     │
│       ├── Secret data → IPFS → Vault (existing)             │
│       ├── Lock SOL → Vault PDA balance                      │
│       └── Lock SPL → Token Account owned by Vault PDA       │
│                                                             │
│  [VAULT RELEASED]                                           │
│       │                                                     │
│       ├── Recipient can view secret data (existing)         │
│       ├── claim_sol() → SOL transferred to recipient        │
│       └── claim_tokens() → SPL transferred to recipient     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📐 Implementation Order

```
T.1 Lock Native SOL (2-3 days)
    ↓
T.3 Claim with Token Release - SOL part (1-2 days)
    ↓
T.2 Lock SPL Tokens (3-4 days) - requires Token Program CPI
    ↓
T.3 Claim with Token Release - SPL part (2 days)
```

## 🔗 Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Anchor SPL Token | ❓ TBD | For T.2 SPL token handling |
| Associated Token Account | ❓ TBD | For T.2 recipient token account |
| Existing Vault | ✅ Ready | Base structure to extend |

## 📅 Estimated Timeline

**Total: ~8-10 days**

---

## ⚠️ Security Considerations

1. **Re-entrancy:** Ensure claim functions can't be called multiple times
2. **PDA Authority:** Vault PDA must have proper authority over token accounts
3. **Rent Exemption:** Ensure accounts remain rent-exempt after withdrawals
4. **Atomic Claims:** Consider whether data + tokens should be claimed atomically

---

## 💡 Design Decisions

### Q1: Một vault có thể chứa nhiều loại token không?
**Answer:** Phase 1 - chỉ 1 loại token per vault. Future có thể extend.

### Q2: Token lock khi create hay có thể top-up?
**Answer:** Phase 1 - chỉ lock khi create. Future: `top_up_tokens()` instruction.

### Q3: Partial claim có được không?
**Answer:** Phase 1 - claim all or nothing. Future: partial vesting schedule.
