# 🚀 justpay.wtf

> **Zero-Auth Crypto Payment Links with Integrated Swaps**

A frictionless payment link generator for Sui, Solana and Ethereum. Create shareable payment links in seconds—no wallet connection required for payment creation. Direct wallet-to-wallet transfers with built-in token swap support.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev)
[![Solana](https://img.shields.io/badge/Solana-Supported-14F195?logo=solana)](https://solana.com)
[![Ethereum](https://img.shields.io/badge/Ethereum-Supported-627EEA?logo=ethereum)](https://ethereum.org)
[![Sui](https://img.shields.io/badge/Sui-Testnet-6FBCF0?logo=sui)](https://sui.io)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-green)](#license)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Payment Flow](#payment-flow)
- [API Endpoints](#api-endpoints)
- [Smart Features](#smart-features)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Development](#development)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

---

## 🎯 Overview

justpay.wtf is a next-generation payment infrastructure for crypto-native applications. It solves the critical problem of accepting crypto payments without custody risk, smart contract vulnerabilities, or poor user experience.

### Why justpay.wtf?

- **Zero Custody**: Payments flow directly from payer to payee wallet. No intermediary holds funds.
- **Zero Smart Contracts**: No escrow contracts, no automated market maker proxies. Pure blockchain transfers.
- **Guaranteed Amounts**: ExactOut routing ensures merchants receive exact payment amounts despite slippage.
- **Multi-Chain**: Ethereum, Solana, and Sui supported. Seamless token swaps and cross-chain bridges built-in.
- **Developer Friendly**: Simple API, shareable links, embedded checkout components.

---

## ✨ Key Features

### 🔐 Security First

- **Non-custodial architecture** — funds never touch justpay.wtf servers
- **Webhook verification** with multiple confirmation thresholds
- **Token allowlist** to prevent fee-on-transfer token exploits
- **RPC fallback transport** for resilience against rate limits

### 💱 Smart Token Routing

- **ExactOut enforcement** via Jupiter (Solana) and 0x API (EVM)
- **Automatic slippage handling** with 0.1% buffer
- **Real-time price feeds** cached server-side to prevent CoinGecko rate limits
- **Token allowlist validation** against malicious token contracts

### 🌉 Cross-Chain Support

- **Solana** native transfers + SPL tokens
- **Ethereum** mainnet + L2s (Arbitrum, Optimism, Polygon, Base)
- **Sui** testnet — native SUI transfers, RPC-verified payments
- **LI.FI integration** for 12+ bridging protocols
- **Atomic payment verification** across chains

### 🎨 Experience

- **Frictionless link creation** — no dashboard logins required
- **QR code generation** for easy sharing
- **Realtime payment status** via Supabase Realtime
- **Email notifications** for payment confirmations
- **15-minute payment expiry** to protect against volatility

---

## 🏗️ Architecture

justpay.wtf implements a **state-free execution model** where:

1. **Frontend** constructs unsigned transactions locally via `viem` and `@solana/web3.js`
2. **User** signs transactions in their wallet (MetaMask, Phantom, etc.)
3. **Transaction** is broadcast to the blockchain
4. **Webhook handlers** (Alchemy/Helius) monitor for payment completion asynchronously
5. **Database** updates in real-time, notifying the payer's browser

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js Frontend                            │
│  Landing Page → Create Link → Share → Payment Page → Checkout    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Backend                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ Payment Links DB │  │  Transactions DB │  │ Token Prices  │ │
│  │ (payment_links)  │  │ (transactions)   │  │ Cache (60s)   │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
│                                                                   │
│  Edge Functions:                                                 │
│  • create-link      — Register link & webhook                  │
│  • record-transaction — Store tx details                        │
│  • alchemy-webhook   — EVM payment verification                │
│  • helius-webhook    — Solana payment verification             │
│  • sui-webhook       — Sui RPC verification (polling)          │
│  • verify-destination — Atomic cross-chain checks              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                             │
│  Alchemy / Helius (RPC & Webhooks)                              │
│  Sui RPC (fullnode.testnet.sui.io — polling verification)       │
│  Jupiter V2 (Solana Swap Quotes)                                │
│  0x Swap API v2 (EVM Swap Quotes)                               │
│  LI.FI SDK (Cross-Chain Bridge)                                 │
│  CoinGecko (Price Feeds)                                        │
│  Resend (Transactional Email)                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer               | Technology                      | Purpose                                |
| :------------------ | :------------------------------ | :------------------------------------- |
| **Framework**       | Next.js 15 (App Router)         | Full-stack React SSR + API routes      |
| **Language**        | TypeScript 5                    | Type-safe frontend & backend           |
| **Frontend**        | React 19 + Tailwind CSS 4       | Modern UI with responsive design       |
| **Styling**         | CSS Variables + Vanilla CSS     | Glassmorphism dark theme               |
| **EVM Wallet**      | Wagmi v3 + Viem                 | Ethereum wallet interactions           |
| **Solana Wallet**   | @solana/wallet-adapter-react    | Solana wallet adapter                  |
| **Sui Wallet**      | @mysten/dapp-kit                | Sui wallet connection + modal          |
| **Sui SDK**         | @mysten/sui                     | Sui transactions + RPC client          |
| **Animations**      | Framer Motion + GSAP + Three.js | Complex motion & 3D rendering          |
| **Database**        | Supabase (Postgres)             | Realtime subscriptions, edge functions |
| **Authentication**  | Wallet signature verification   | Non-custodial auth via signed messages |
| **API Routing**     | Next.js API Routes              | Server-side payment processing         |
| **Short URLs**      | nanoid (8 chars)                | URL-safe collision-resistant IDs       |
| **QR Codes**        | qrcode.react                    | Client-side SVG generation             |
| **Token Swaps**     | Jupiter API v2 (Solana)         | DEX aggregation for Solana             |
| **Token Swaps**     | 0x Swap API v2 (EVM)            | DEX aggregation for Ethereum           |
| **Bridges**         | LI.FI SDK                       | 12+ cross-chain bridge aggregation     |
| **Price Data**      | CoinGecko API                   | Token price feeds (server-cached)      |
| **Email**           | Resend (@resend/node)           | Transactional payment emails           |
| **Email Templates** | React Email                     | Component-based email templates        |
| **Hosting**         | Vercel                          | Deployment + edge functions            |
| **Testing**         | ESLint                          | Code quality & type checking           |

---

## 📋 Prerequisites

- **Node.js** 18+ and **npm** 9+ (or yarn/pnpm)
- **Git** for version control
- **Supabase account** (free tier available)
- **Wallet provider account** (one or more of):
  - Alchemy or Infura for EVM RPC + webhooks
  - Helius or Triton for Solana RPC + webhooks
- **API keys** for integrations:
  - 0x Swap API (free tier)
  - Jupiter API (free, public)
  - CoinGecko API (free tier)
  - Resend for emails (free tier available)
  - LI.FI API key (optional for bridges)

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/justpay.wtf.git
cd justpay.wtf
npm install
```

### 2. Create Environment File

```bash
cp .env.example .env.local
```

### 3. Configure Supabase

```bash
npx supabase login
npx supabase link --project-ref [YOUR_PROJECT_ID]
npx supabase db push
npx supabase secrets set SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
npx supabase secrets set RESEND_API_KEY=your_resend_api_key
```

### 4. Deploy Edge Functions

```bash
npx supabase functions deploy create-link
npx supabase functions deploy record-transaction
npx supabase functions deploy alchemy-webhook
npx supabase functions deploy helius-webhook
npx supabase functions deploy verify-destination
npx supabase functions deploy sui-webhook
```

### 5. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000 to start creating payment links!

---

## 📦 Installation

### Prerequisites Check

Verify you have the required versions:

```bash
node --version  # v18.0.0 or higher
npm --version   # 9.0.0 or higher
```

### Step-by-Step Setup

#### A. Clone & Dependencies

```bash
git clone
cd
npm install
```

#### B. Supabase Project Setup

```bash
# Install Supabase CLI globally (optional)
npm install -g supabase

# Authenticate
npx supabase login

# Link to existing Supabase project
npx supabase link --project-ref [PROJECT_ID]

# Or create a new local Supabase instance
npx supabase start
```

#### C. Database Migration

```bash
# Apply all migrations from supabase/migrations/
npx supabase db push

# Verify schema
npx supabase db list tables
```

#### D. Configure Secrets

```bash
# Set Edge Function secrets
npx supabase secrets set SUPABASE_URL=https://[PROJECT_ID].supabase.co
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY]
npx supabase secrets set RESEND_API_KEY=[RESEND_API_KEY]
npx supabase secrets set ALCHEMY_API_KEY=[ALCHEMY_KEY]
npx supabase secrets set HELIUS_API_KEY=[HELIUS_KEY]
npx supabase secrets set ZERO_EX_API_KEY=[0x_API_KEY]
```

#### E. Deploy Edge Functions

```bash
npx supabase functions deploy create-link
npx supabase functions deploy record-transaction
npx supabase functions deploy alchemy-webhook
npx supabase functions deploy helius-webhook
npx supabase functions deploy verify-destination
npx supabase functions deploy sui-webhook
```

#### F. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]

# EVM RPC & Webhooks (Alchemy)
NEXT_PUBLIC_ALCHEMY_API_KEY=[API_KEY]
NEXT_PUBLIC_ALCHEMY_MAINNET_RPC=https://eth-mainnet.g.alchemy.com/v2/[API_KEY]
NEXT_PUBLIC_ALCHEMY_ARBITRUM_RPC=https://arb-mainnet.g.alchemy.com/v2/[API_KEY]

# Solana RPC & Webhooks (Helius)
NEXT_PUBLIC_HELIUS_API_KEY=[API_KEY]
NEXT_PUBLIC_HELIUS_RPC=https://mainnet.helius-rpc.com/?api-key=[API_KEY]

# Token Swap APIs
NEXT_PUBLIC_ZERO_EX_API_KEY=[API_KEY]
NEXT_PUBLIC_JUPITER_RPC=https://api.mainnet-beta.solana.com

# Price Feeds (CoinGecko)
# CoinGecko API is called only server-side, no key needed for free tier

# Email (Resend)
NEXT_PUBLIC_RESEND_API_KEY=[API_KEY]

# App Configuration
NEXT_PUBLIC_APP_NAME=justpay.wtf
NEXT_PUBLIC_SHORT_DOMAIN=justpay.wtf.finance
NEXT_PUBLIC_DEFAULT_PAYMENT_EXPIRY=15 # minutes
```

### Supported Networks

```typescript
// EVM Chains
- Ethereum Mainnet (Chain ID: 1)
- Arbitrum (Chain ID: 42161)
- Optimism (Chain ID: 10)
- Polygon (Chain ID: 137)
- Base (Chain ID: 8453)
- Sepolia Testnet (Chain ID: 11155111)
- Base Sepolia Testnet (Chain ID: 84532)

// Solana
- Mainnet Beta (Cluster: mainnet-beta)
- Devnet (Cluster: devnet)

// Sui
- Testnet (Network: testnet)
- Native token: SUI (9 decimals / MIST)
- Verification: RPC polling via sui-webhook edge function
```

### Token List

Supported tokens are validated against a hardcoded allowlist in `supabase/functions/create-link/index.ts`:

```typescript
const STRICT_TOKEN_LIST = {
  // Solana
  USDC: "EPjFWaLb3odcccccccccccccccccccccccccccccccc...",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenEqw",
  WSOL: "So11111111111111111111111111111111111111112",
  // EVM
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  // ... more tokens
};
```

---

## 📁 Project Structure

```
justpay.wtf/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Landing page
│   │   ├── globals.css                # Global styles
│   │   ├── [linkId]/
│   │   │   ├── page.tsx               # Payment page
│   │   │   └── CheckoutClient.tsx     # Checkout component
│   │   ├── api/
│   │   │   ├── rpc/
│   │   │   │   ├── base/route.ts      # Base RPC endpoint
│   │   │   │   └── solana/route.ts    # Solana RPC endpoint
│   │   │   └── v1/
│   │   │       └── links/route.ts     # Link creation API
│   │   └── dashboard/
│   │       ├── page.tsx               # Creator dashboard
│   │       ├── links/                 # Link management
│   │       ├── history/               # Payment history
│   │       └── settings/              # Account settings
│   ├── components/
│   │   ├── landing/                   # Landing page sections
│   │   │   ├── HeroSection.tsx
│   │   │   ├── DemoSection.tsx
│   │   │   ├── HowItWorksSection.tsx
│   │   │   ├── FaqSection.tsx
│   │   │   ├── SocialProofSection.tsx
│   │   │   └── ContactSection.tsx
│   │   ├── shared/                    # Reusable components
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── WalletConnectButton.tsx
│   │   │   └── ZeroFeeBanner.tsx
│   │   ├── CreateLinkForm.tsx         # Link creation form
│   │   ├── PaymentCard.tsx            # Payment display
│   │   ├── QRCodeGenerator.tsx        # QR code component
│   │   ├── DashboardSidebar.tsx       # Dashboard navigation
│   │   ├── SmartButton.tsx            # Custom button
│   │   └── NeonBackground.tsx         # Visual effects
│   ├── hooks/
│   │   └── usePaymentState.ts         # Payment state management
│   ├── lib/
│   │   ├── supabase.ts                # Supabase client
│   │   ├── payment.ts                 # Payment utilities
│   │   ├── config/
│   │   │   └── chain-policy.ts        # Chain configuration
│   │   └── web3/
│   │       ├── wagmi.ts               # Wagmi config (EVM)
│   │       ├── executeSolana.ts       # Solana execution
│   │       ├── executeEVM.ts          # EVM execution
│   │       ├── swap.ts                # Swap orchestration
│   │       └── bridge.ts              # Bridge integration
│   └── providers/
│       └── Web3Provider.tsx           # Web3 provider setup
├── supabase/
│   ├── config.toml                    # Supabase config
│   ├── functions/
│   │   ├── create-link/
│   │   │   └── index.ts               # Link creation API
│   │   ├── record-transaction/
│   │   │   └── index.ts               # TX recording
│   │   ├── alchemy-webhook/
│   │   │   └── index.ts               # EVM webhook handler
│   │   ├── helius-webhook/
│   │   │   └── index.ts               # Solana webhook handler
│   │   └── verify-destination/
│   │       ├── deno.json
│   │       └── index.ts               # Cross-chain verification
│   └── migrations/
│       ├── 001_create_tables.sql      # Initial schema
│       └── 002_schema_updates.sql     # Updates
├── public/                             # Static assets
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
└── README.md
```

---

## 💰 Payment Flow

### Create Link Flow

```
1. User lands on justpay.wtf
2. Clicks "Create Payment Link"
3. Enters: Amount | Token | Recipient Address | Email (optional)
4. Frontend calls POST /api/v1/links
5. Backend:
   - Validates token against allowlist
   - Registers Alchemy/Helius webhook
   - Generates nanoid short code
   - Stores in payment_links table
6. Returns shareable link: justpay.wtf/pay/abc12345
7. User copies link or scans QR code
```

### Payment Flow

```
1. Payer opens link: justpay.wtf/pay/abc12345
2. Sees payment details (amount, token, recipient, expiry)
3. Checks if wallet has token → if not, shows swap UI
4. If swap needed:
   a. User selects swap source token
   b. Frontend gets quote from Jupiter/0x
   c. User approves & executes swap (ExactOut)
   d. Waits for swap completion
   e. Updates UI: "Ready to pay"
5. Payer connects wallet (MetaMask/Phantom)
6. Reviews final transaction
7. Signs transaction in wallet
8. Transaction broadcast to blockchain
9. Frontend shows: "Payment submitted..."
10. Webhook fires (Alchemy/Helius) when payment confirmed
11. Frontend shows: "Payment received! ✓"
12. Creator receives email notification
```

### Sui Payment Flow

```
1. Payer opens link: justpay.wtf/pay/abc12345 (chain: sui)
2. Sees payment details (amount in SUI, recipient, expiry)
3. Connects Sui Wallet (Sui Wallet, Martian, Suiet, OKX Wallet)
4. Reviews transaction — amount in SUI + gas estimate
5. Signs and submits transaction via @mysten/dapp-kit
6. Frontend receives transaction digest
7. Frontend calls /functions/v1/sui-webhook with digest + expected amount
8. Edge function polls Sui RPC → verifies balance change + finality
9. Marks payment_links status → 'completed'
10. Supabase Realtime fires → frontend shows "Payment confirmed ✓"
11. Creator receives email notification via Resend
```

> **Note:** Sui uses RPC polling for payment verification instead of push webhooks
> (no Alchemy/Helius equivalent exists for Sui). The `sui-webhook` edge function
> is called client-side after transaction submission.

### Webhook Verification Flow

```
Alchemy/Helius Webhook → Supabase Edge Function:
1. Verify webhook signature
2. Extract tx hash & amount received
3. Check for idempotency (prevent duplicates)
4. Validate: amount_received >= amount_required - fee
5. Update payment_links status to "completed"
6. Broadcast via Supabase Realtime to payer
7. Send email to creator
8. Log to transactions table
```

### Sui Webhook (RPC Polling) Flow

```
Frontend → sui-webhook Edge Function:
1. Frontend submits tx → receives digest from @mysten/dapp-kit
2. Frontend POST to /functions/v1/sui-webhook with { link_id, tx_digest, recipient_address, expected_amount }
3. Edge function calls sui_getTransactionBlock via Sui RPC
4. Validates: effects.status === 'success'
5. Validates: sum of positive balanceChanges to recipient >= expected_amount * 0.999
6. Updates payment_links.status to 'completed' (with idempotency guard)
7. Inserts into transactions table (payer_chain: 'sui', amount_paid, token_paid: 'SUI')
8. Supabase Realtime broadcasts to payer frontend
9. Email sent to creator via Resend
```

---

## 📡 API Endpoints

### Public Endpoints

#### POST `/api/v1/links`

Create a new payment link.

**Request:**

```json
{
  "amount": 1000,
  "token_address": "EPjFWaLb3odcccccccccccccccccccccccccccccccc",
  "recipient_address": "0x1234567890123456789012345678901234567890",
  "chain": "solana",
  "creator_email": "creator@example.com",
  "metadata": {
    "description": "Payment for services"
  }
}
```

**Valid `chain` values:** `ethereum` | `arbitrum` | `optimism` | `polygon` | `base` | `solana` | `sui`

**Sui-specific notes:**

- `recipient_address` must be a valid Sui address (`0x` + 64 hex characters)
- `token_address` must be `0x2::sui::SUI` for native SUI transfers on testnet
- Payment verification uses RPC polling instead of push webhooks

**Response:**

```json
{
  "success": true,
  "link_id": "abc12345",
  "short_url": "https://justpay.wtf/pay/abc12345",
  "qr_code": "data:image/svg+xml;base64,...",
  "expires_at": "2026-06-17T12:30:00Z"
}
```

#### GET `/api/v1/links/[linkId]`

Fetch payment link details.

**Response:**

```json
{
  "id": "abc12345",
  "amount": 1000,
  "token_address": "EPjFWaLb3odcccccccccccccccccccccccccccccccc",
  "token_symbol": "USDC",
  "recipient_address": "0x1234567890123456789012345678901234567890",
  "chain": "solana",
  "status": "pending",
  "created_at": "2026-06-17T12:15:00Z",
  "expires_at": "2026-06-17T12:30:00Z",
  "transaction_hash": null
}
```

### Protected Endpoints (Webhook)

#### POST `/webhook/alchemy` (Internal)

EVM payment verification via Alchemy Notify.

#### POST `/webhook/helius` (Internal)

Solana payment verification via Helius webhook.

---

## 🧠 Smart Features

### Resolution 1: ExactOut Enforcement

Prevents slippage by routing all swaps through ExactOut mode:

- **Solana**: Jupiter V2 API with `swapMode=ExactOut`
- **EVM**: 0x Swap API v2 with `buyAmount` parameter
- **Buffer**: 0.1% added to handle decimal truncation variance

### Resolution 2: Zero Approval EVM Execution

Eliminates high-friction approve→transfer flows:

- **Direct Payments**: Raw ERC-20 `transfer()` via `viem`
- **Swaps**: EIP-2612 Permit2 for atomic approval+execution
- **Result**: Single signature, single transaction

### Resolution 3: Token Allowlist Registry

Protects against fee-on-transfer and malicious tokens:

- Hardcoded `StrictTokenList` in create-link function
- Webhook validates actual amount received
- Auto-rejects transfers degraded by taxes

### Resolution 4: Webhook Finality Thresholds

Eliminates chain reorg risk:

- **Solana**: Helius webhook configured to `commitment: finalized` (400ms delay)
- **EVM Mainnet**: Enforcement of `block.depth >= 12` (3+ minutes)
- **L2s**: Accept sequencer finality (Arbitrum/Optimism)

### Resolution 5: RPC Load Balancing

Prevents rate limiting under high load:

- Viem fallback transport with 3 RPC endpoints
- EVM: `[Alchemy, Infura, Cloudflare]`
- Solana: `[Helius, Triton, mainnet-beta]`

### Resolution 6: Native Gas Validation

Prevents "insufficient gas" failures:

- Pre-flight checks in `usePaymentState` hook
- Validates user has >= 0.005 ETH (or Solana rent)
- Locks "Pay" button with helpful error message

### Resolution 7: Sui RPC Payment Verification

Handles Sui payments without push webhook infrastructure:

- **Challenge**: Sui has no Alchemy/Helius equivalent for push webhooks
- **Solution**: Client-side trigger — frontend calls `sui-webhook` edge function after tx submission
- **Verification**: `sui_getTransactionBlock` RPC call validates `effects.status === 'success'`
- **Amount check**: Sums `balanceChanges` for recipient address with 0.1% tolerance buffer
- **Idempotency**: `.eq('status', 'pending')` guard on `payment_links` update prevents duplicate processing
- **Finality**: Sui achieves transaction finality in ~400ms — no block depth wait needed

### Resolution 8: Direct Native Transfer Fallback

Prevents bridge failures for same-chain native token payments:

- **Challenge**: Cross-chain bridge aggregators like LI.FI often reject same-chain quotes for native tokens (e.g. SUI to SUI) or testnet requests.
- **Solution**: The checkout orchestrator detects if `payerChain === destinationChain` and if no token swaps are needed.
- **Bypass Mechanism**: Intercepts the quote request and immediately falls back to constructing a raw `viem` or `@mysten/sui` direct transfer transaction block.
- **Result**: Always-online reliability for native payments, even if external swap APIs are down or unsupported.

---

## 🔐 Environment Variables Reference

### Critical (Required)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[32-char key]
```

### EVM & Webhooks

```bash
NEXT_PUBLIC_ALCHEMY_API_KEY=[your-key]
NEXT_PUBLIC_ALCHEMY_MAINNET_RPC=https://eth-mainnet.g.alchemy.com/v2/[key]
NEXT_PUBLIC_ALCHEMY_ARBITRUM_RPC=https://arb-mainnet.g.alchemy.com/v2/[key]
```

### Solana & Webhooks

```bash
NEXT_PUBLIC_HELIUS_API_KEY=[your-key]
NEXT_PUBLIC_HELIUS_RPC=https://mainnet.helius-rpc.com/?api-key=[key]
```

### Token Swap APIs

```bash
NEXT_PUBLIC_ZERO_EX_API_KEY=[your-key]
NEXT_PUBLIC_JUPITER_RPC=https://api.mainnet-beta.solana.com
```

### Email Service

```bash
NEXT_PUBLIC_RESEND_API_KEY=[your-key]
```

### Optional Configuration

```bash
NEXT_PUBLIC_APP_NAME=justpay.wtf
NEXT_PUBLIC_SHORT_DOMAIN=justpay.wtf
NEXT_PUBLIC_DEFAULT_PAYMENT_EXPIRY=15
NEXT_PUBLIC_PRICE_CACHE_TTL=60
NEXT_PUBLIC_NETWORKS_ENABLED=solana,ethereum,arbitrum,optimism,polygon,base,sui

# Sui (testnet)
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io:443
```

---

## 🚢 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# ... add other variables

# Deploy to production
vercel --prod
```

### Deploy Supabase Edge Functions

```bash
npx supabase functions deploy create-link --project-ref [PROJECT_ID]
npx supabase functions deploy record-transaction --project-ref [PROJECT_ID]
npx supabase functions deploy alchemy-webhook --project-ref [PROJECT_ID]
npx supabase functions deploy helius-webhook --project-ref [PROJECT_ID]
npx supabase functions deploy verify-destination --project-ref [PROJECT_ID]
npx supabase functions deploy sui-webhook --project-ref [PROJECT_ID]
```

### Configure Webhooks in Alchemy/Helius

**Alchemy Notify (EVM):**

1. Go to Dashboard → Notify
2. Create webhook pointing to: `https://[YOUR_SUPABASE_PROJECT].functions.supabase.co/alchemy-webhook`
3. Select events: `alchemy_filteredNewFullPendingTransactionsByHash`

**Helius Webhook (Solana):**

1. Go to Dashboard → Webhooks
2. Create webhook pointing to: `https://[YOUR_SUPABASE_PROJECT].functions.supabase.co/helius-webhook`
3. Select events: `transactionSignature`

---

## 👨‍💻 Development

### Available Scripts

```bash
# Start development server (with HMR)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Run linter with auto-fix
npm run lint -- --fix
```

### Development Workflow

1. **Start services:**

   ```bash
   npx supabase start        # Local Supabase
   npm run dev              # Next.js dev server
   ```

2. **Create a feature branch:**

   ```bash
   git checkout -b feature/my-feature
   ```

3. **Make changes and test locally:**
   - Visit `http://localhost:3000`
   - Test payment creation and completion
   - Check browser console for errors

4. **Commit & push:**

   ```bash
   git add .
   git commit -m "feat: description of changes"
   git push origin feature/my-feature
   ```

5. **Create pull request**

### Testing Payments Locally

1. **Start both services:**

   ```bash
   npx supabase start
   npm run dev
   ```

2. **Use testnet wallets:**
   - MetaMask: Switch to Sepolia testnet
   - Phantom: Switch to Devnet
   - Fund wallets with faucet tokens

3. **Create test payment links:**
   - Navigate to `http://localhost:3000`
   - Select testnet in chain selector
   - Create link with test tokens (USDC on Sepolia, etc.)

4. **Verify webhook delivery:**
   - Check Supabase dashboard → Edge Functions logs
   - Verify webhook payload in transactions table

### Debugging

**Local logs:**

```bash
npx supabase functions serve
```

**Production logs:**

```bash
npx supabase functions logs create-link --project-ref [PROJECT_ID]
```

**Realtime debugging:**
Use Supabase Dashboard → SQL Editor to query tables in real-time.

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### Code Standards

- **TypeScript** for all new code
- **ESLint** configuration must pass
- **Prettier** for consistent formatting
- **Meaningful commit messages** (feat:, fix:, docs:, etc.)

### Making Changes

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/xyz`
3. **Commit** changes with clear messages
4. **Push** to your fork
5. **Create** a pull request with description

### Reporting Issues

- Use GitHub Issues for bug reports
- Include environment details (Node version, OS, etc.)
- Provide reproduction steps
- Attach error logs if applicable

---

## 📞 Support

### Documentation

- See [ARCHITECTURE.md](./ARCHITECTURE.md) for technical deep-dives
- Check [supabase/migrations/](./supabase/migrations/) for database schema

### Community

- **Discord**: [Join our community](https://discord.gg/xyz)
- **Twitter**: [@justpay](https://twitter.com/justpay)
- **Email**: support@justpay.wtf

### Troubleshooting

**Issue: "NEXT_PUBLIC_SUPABASE_URL not set"**

- Ensure `.env.local` exists with correct variables
- Restart dev server: `npm run dev`

**Issue: Webhook not firing**

- Verify Alchemy/Helius webhook URL is accessible
- Check Edge Functions logs: `npx supabase functions logs`
- Ensure transaction amount matches exactly

**Issue: Payment stuck in "pending"**

- Check blockchain explorer for transaction confirmation
- Verify recipient address is correct
- Wait for sufficient block confirmations

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

### Key Points

- ✅ Free to use, modify, and distribute
- ✅ Commercial use allowed
- ⚠️ No warranty or liability
- 📋 Include license in distributions

---

## 🙏 Acknowledgments

Built with love by the justpay.wtf team. Special thanks to:

- **Solana** ecosystem for wallet adapters
- **Sui Foundation** for @mysten/sui SDK and testnet infrastructure
- **0x Protocol** for swap infrastructure
- **Alchemy & Helius** for reliable webhooks
- **Supabase** for database & edge computing
- **Vercel** for deployment infrastructure
- **LI.FI** for bridge aggregation

---

**Version**: 1.0.0  
**Last Updated**: June 17, 2026  
**Maintainer**: justpay.wtf Team
