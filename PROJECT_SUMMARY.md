# 📋 Deadman's Switch - Project Summary

> **Updated:** 2025-12-09  
> **Program ID:** `HnFEhMS84CabpztHCDdGGN8798NtXW4aG17XpB` (Devnet)
> **Goal:** Secure digital legacy on Solana.

---

## 🎯 Core Value Proposition
**"A switch that triggers when you don't."**  
Users create a vault containing encrypted secrets (keys, messages). If they fail to check in within a set time (e.g., 30 days), the vault automatically unlocks for a designated recipient.

---

## ✅ COMPLETED FEATURES (Phases 1-4, 8, 10)

### 1. Smart Contract (Anchor)
- **Instructions:** `initialize_vault`, `ping`, `trigger_release`, `update_vault`, `close_vault`, `claim_and_close`
- **Security:** `has_one` constraints, PDA-based ownership.
- **New (v2):** `set_delegate` (allows hot wallet ping), `lock_tokens` (vesting logic).

### 2. Encryption & Security
- **Client-side Encryption:** AES-256-GCM.
- **Zero-Knowledge:** Server never sees keys.
- **Modes:** 
  - **Password:** PBKDF2 derived key (User shares password with recipient manually).
  - **Wallet:** Deterministic key derived from signature (Recipient connects wallet to decrypt).

### 3. User Experience (UI/UX)
- **Create Wizard:** "Tunnel Vision" guided flow, Smart Templates (Crypto Backup, Last Letter).
- **Dashboard:** 3-part floating navbar, "Pulse" alive animation, Magnetic "Hold-to-Check-in".
- **Claim Portal:** Cinematic reveal sequence, 3D Safe animation, Typewriter effect.
- **Multi-Media Bundle:** Support for Text Notes, Files, Voice Recordings in one vault.

### 4. Growth & Onboarding
- **Flash Onboarding:** "Try Demo" mode with auto-generated burner wallet (Devnet airdrop). No Phantom required to test.
- **Kip (Mascot):** Friendly "Keeper Spirit" that reacts to vault health (Happy/Worried/Ghost).

---

## 🔄 IN PROGRESS & ROADMAP

### Phase 6: Future Enhancements (~90% Done)
- **6.1 Frictionless Check-in:** Delegated "hot wallet" ping (Contract done, UI done).
- **6.3 Tamagotchi Vault:** Kip states (Happy/Neutral/Worried) based on timer (Frontend done).
- **6.5 Silent Alarm (Duress Mode):** Fake check-in button that sends SOS email instead of resetting timer (Spec ready).

### Phase 7: Decentralization (~40% Done)
- **7.1 Bounty Hunter Protocol:** 
  - **Goal:** Kill centralized Cron job.
  - **Mechanism:** Anyone can trigger expired vaults to earn a small SOL bounty.
  - **Gravedigger SDK:** Open-source bot script for community to run and earn.
- **7.2 Delegate Check-in:** (Done)

### Phase 9: AI Micro-UX (Spec Ready)
- **9.1 Kip's Personality:** Text messages from Kip (retention).
- **9.4 Anti-Doxxer:** Client-side regex scanner to prevent pasting Private Keys in public title fields.
- **9.3 Smart Timer:** Context-aware timer suggestions.

---

## 🏗️ Architecture

```
[Frontend (Next.js)] 
   │
   ├── [Anchor Client] ──── [Solana Blockchain]
   │                             │
   ├── [IPFS/Pinata] ────────────┘ (CIDs)
   │
   └── [Resend API] (Emails)
```

## 📂 Key Directory Structure

```
deadman-switch/
├── programs/                 # Anchor Smart Contract (Rust)
├── src/
│   ├── app/                  # Next.js Pages (create, dashboard, claim)
│   ├── components/
│   │   ├── vault/            # Create wizard, Content Editor
│   │   ├── claim/            # Reveal sequence, 3D Safe
│   │   └── dashboard/        # Vault Card, Kip Spirit
│   ├── utils/                # Encryption, IPFS, Anchor helpers
│   └── types/                # IDL types, Vault interfaces
├── traction/                 # Project Specs & Roadmap
│   ├── phase-7-decentralization/ # Active specs (Bounty Hunter)
│   ├── phase-9-ai-integration/   # AI specs (Anti-Doxxer)
│   └── _completed/               # Archived phases (1-3, 8, 10)
└── tests/                    # Integration Tests
```

---

## 🔐 Security Model
1. **Keys:** Never leave the browser.
2. **Metadata:** Public (Title, Description) - stored on IPFS/Chain.
3. **Content:** Encrypted (AES-256) - stored on IPFS.
4. **Trigger:** Time-based (Solana Clock). Permissionless `trigger_release` (coming Phase 7).

---

## 🏁 Hackathon Focus
**Track:** Best Consumer App on Solana
**Key Pitch:** "The most user-friendly digital inheritance tool, powered by Solana's speed and low fees."
