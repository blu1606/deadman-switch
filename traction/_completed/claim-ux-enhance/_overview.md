# 🎁 Claim UX Enhancement

> Nâng cấp trải nghiệm claim vault cho recipient.

## 📊 Features

| Feature | Contract Change | Priority | Complexity |
|---------|-----------------|----------|------------|
| [C.1 Timeline Visualization](./c1-timeline.md) | ❌ No | Medium | 🟢 Easy |
| [C.2 Notify Me When Ready](./c2-notify-me.md) | ❌ No | High | 🟡 Medium |
| [C.3 Claimed Vault Archive](./c3-archive.md) | ❌ No | Medium | 🟢 Easy |

## 🎯 Goal

Biến claim từ "nhận file" thành **trải nghiệm cảm xúc** với context đầy đủ:
- Ai gửi? Khi nào?
- Timeline của vault journey
- Lưu trữ vault đã claim để xem lại

## 📐 Implementation Order

```
C.1 Timeline (1 day)
    ↓
C.3 Archive (1.5 days)
    ↓
C.2 Notify Me (2 days) - cần backend
```

## 🔗 Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Supabase | ✅ Ready | For C.2 notify subscriptions |
| Email service | ✅ Ready | Resend already integrated |
| localStorage | ✅ Ready | For C.3 archive |

## 📅 Estimated Timeline

**Total: ~4.5 days**

---

## Quick Reference

### Data Available On-Chain
- `owner`: Sender wallet address
- `name`: Vault name (10.1)
- `lastCheckIn + timeInterval`: Release timestamp
- `bountyLamports`: Bounty amount

### Data From vaultSeed
- `vaultSeed` = timestamp when created → derive creation date
