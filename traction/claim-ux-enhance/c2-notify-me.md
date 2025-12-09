# C.2 Notify Me When Ready

> Recipient đăng ký nhận email khi vault unlock.

## Goal

Recipient truy cập vault đang pending → nhập email → nhận thông báo khi vault ready.

## User Flow

```
┌─────────────────────────────────────┐
│         ⏳ VAULT PENDING            │
│                                     │
│    "Emergency Access Keys"          │
│    Opens in: 14 days                │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📧 your@email.com           │   │
│  └─────────────────────────────┘   │
│                                     │
│     [ 🔔 Notify Me When Ready ]     │
│                                     │
│  ✓ We'll email you the moment       │
│    this vault becomes claimable     │
└─────────────────────────────────────┘
```

## Backend Spec

### API Endpoint

```typescript
// POST /api/vault/notify-subscribe
interface NotifySubscribeRequest {
    vaultAddress: string;
    recipientEmail: string;
    releaseTimestamp: number; // Unix seconds
}

interface NotifySubscribeResponse {
    success: boolean;
    message: string;
}
```

### Database Schema

```sql
-- Supabase table
CREATE TABLE vault_notify_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_address TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    release_timestamp BIGINT NOT NULL,
    notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(vault_address, recipient_email)
);

CREATE INDEX idx_pending_notifications 
ON vault_notify_subscriptions(release_timestamp, notified)
WHERE notified = FALSE;
```

### Cron Job Update

```typescript
// In /api/cron/check-status

// Add: Check for pending notifications
const pendingNotifs = await supabase
    .from('vault_notify_subscriptions')
    .select('*')
    .lte('release_timestamp', now)
    .eq('notified', false);

for (const notif of pendingNotifs) {
    await sendEmail({
        to: notif.recipient_email,
        subject: '🔓 Your vault is ready to claim!',
        template: 'vault-ready',
        data: { vaultAddress: notif.vault_address }
    });
    
    await supabase
        .from('vault_notify_subscriptions')
        .update({ notified: true })
        .eq('id', notif.id);
}
```

## Email Template

**Subject:** 🔓 Your vault is ready to claim!

```
A vault has been unlocked and is ready for you to claim.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[CLAIM YOUR VAULT]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Vault: {vaultAddress}
Released: {releaseDate}

Don't wait - claim your vault now.
```

## Frontend Component

### `NotifyMeForm.tsx`

```tsx
interface NotifyMeFormProps {
    vaultAddress: string;
    releaseTimestamp: number;
}
```

## Implementation Steps

- [ ] Create Supabase table
- [ ] Create `/api/vault/notify-subscribe` endpoint
- [ ] Create `NotifyMeForm.tsx` component
- [ ] Update cron job to check subscriptions
- [ ] Create email template `vault-ready`
- [ ] Integrate form into pending vault view
