# ⚡ KipSwitch (Deadman's Switch)

> **The Tamagotchi for your Digital Legacy.**  
> *Built for Solana Consumer Hackathon Track*

[![Solana](https://img.shields.io/badge/Solana-Mainnet-linear_gradient?logo=solana&color=9945FF)](https://solana.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## 📖 Introduction

**KipSwitch** turns the gloomy task of "digital inheritance" into a playful, life-affirming habit. 

Instead of a morbid "Deadman's Switch" that you set and forget (until it's too late), KipSwitch gives you **Kip**—a digital guardian that you must "feed" with periodic check-ins. As long as you're active, your secrets remain encrypted and safe. If you stop checking in, Kip assumes something has happened and securely releases your vault to your designated trusted guardians.

We are solving the **$140 Billion+** problem of lost crypto assets not through complex legalese, but through **gamification** and **seamless UX**.

---

## 🧐 The Problem & Solution

### The Problem
*   **Asset Loss**: Billions in crypto are lost annually because owners die without sharing private keys.
*   **The "Morbid" Barrier**: Existing legacy solutions feel like planning your own funeral. Users procrastinate.
*   **Complexity**: Multi-sig wallets and legal trusts are too complex for the average user.

### The KipSwitch Solution
*   **Gamified Retention**: Think "Tamagotchi meets 1Password." Feeding Kip (checking in) gives you a dopamine hit and keeps your vault secure.
*   **Zero-Knowledge**: Everything is encrypted client-side with AES-256. We (the protocol) never see your data.
*   **Proactive**: It's not just about death; it's about proving you're alive and in control.

---

## ✨ Key Features

### 🐶 Gamified Check-ins
*   **"Feed Kip"**: A simple, one-click Solana transaction resets your switch timer.
*   **Emotional UI**: Kip reacts to your presence. He gets happy when you check in and "worried" when your timer runs low.

### 🔒 Zero-Knowledge Vaults
*   **Client-Side Encryption**: Your secrets are encrypted in your browser before they ever touch IPFS.
*   **Shamir's Secret Sharing**: (Roadmap) Split keys among multiple guardians for added security.

### 🤖 AI Writing Assistant
*   **Powered by Gemini**: Writer's block? Our embedded AI helps you draft touching, meaningful final messages to your loved ones, making the setup process less daunting.

### ⚡ Powered by Solana
*   **Fast & Cheap**: Gamified check-ins require frequent transactions. Solana's sub-cent fees make this model economically viable.
*   **Anchor Framework**: Robust, secure smart contracts governing the switch logic.

---

## 🛠 How It Works

1.  **Protect**: You create a Vault, add your secrets (keys, letters, passwords), and designate a Guardian's wallet address.
2.  **Live (Check-in)**: You pledge to check in every X days. Every time you "Feed Kip," the on-chain timer resets.
3.  **Recover**: If you fail to check in after the grace period, the smart contract unlocks. Your Guardian can now claim and decrypt the vault.

---

## 🚀 Why Solana?

KipSwitch relies on the concept of **"High-Frequency Liveness Proofs"**. 
*   **Cost**: On Ethereum, a monthly "check-in" transaction could cost $5-$20. On Solana, it costs fractions of a penny ($0.00025). This allows us to make check-ins a weekly or even daily habit without draining user funds.
*   **Speed**: The "Feed Kip" interaction needs to be instant to maintain the "game-like" feel. Solana's 400ms block times provide the snappy responsiveness required for a consumer-grade app.

---

## ⚡ Quick Start

### Prerequisites
*   Node.js 18+
*   pnpm
*   Solana CLI (for local contract testing)

### Installation

```bash
# Clone the repo
git clone https://github.com/blu1606/kipswitch.git
cd kipswitch

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# (Fill in your Helius RPC URL, Pinata keys, and Gemini API key)
```

### Running Locally

```bash
# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📚 Documentation

*   **[Project Brief](docs/project-brief.md)**: High-level overview and vision.
*   **[Architecture](docs/ARCHITECTURE_FLOW.md)**: Technical diagrams and data flow.
*   **[Product Requirements (PRD)](docs/PRD.md)**: detailed feature specs.
*   **[Frontend Spec](docs/front-end-spec.md)**: UI/UX guidelines and component structure.

---

## 🏗 Tech Stack

*   **Frontend**: Next.js 14, TailwindCSS, Framer Motion, shadcn/ui
*   **Blockchain**: Solana (Anchor Framework)
*   **Integrations**: Helius (RPC/Cron), Google Gemini (AI), IPFS (Storage)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.