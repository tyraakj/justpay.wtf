# Envoy

A zero-custody, zero-contract payment link execution layer. Bypassing smart-contract risk by delegating state transition verifications entirely to asynchronous indexing (Alchemy/Helius Webhooks) and executing pure native/ERC-20/SPL transfers via the client.

## Architecture Highlights
- **Zero Smart Contract Risk**: No escrow, no smart-contract wrappers. Pure native transfers.
- **ExactOut Enforcement**: Ensures merchants receive exact amounts despite slippage via Jupiter V2 and 0x API protocols.
- **Cross-Chain Bridge**: deBridge DLN integration for decentralized Solana <-> EVM transfers.
- **Idempotent Webhook Verifications**: Alchemy & Helius listeners rigorously check duplicates and update payment state asynchronously.

## Setup Instructions

### 1. Clone & Install
```bash
git clone <repository_url>
cd Envoy
npm install
```

### 2. Environment Variables
Copy the `.env.example` file to create your local `.env.local`:
```bash
cp .env.example .env.local
```
Fill out your `.env.local` with your Next.js frontend keys (Supabase URL/Anon key, Alchemy RPC, Helius RPC, 0x API key).

### 3. Supabase Deployment
Envoy relies on Supabase for the database, idempotency schema, and Edge Functions (API & webhooks).

1. Initialize your local Supabase CLI or link to your hosted project:
   ```bash
   npx supabase login
   npx supabase link --project-ref [YOUR_PROJECT_ID]
   ```
2. Push the database schema:
   ```bash
   npx supabase db push
   ```
3. Set your Edge Function secrets in your Supabase project settings (or via CLI):
   ```bash
   npx supabase secrets set SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
   npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   npx supabase secrets set RESEND_API_KEY=your_resend_api_key
   ```
4. Deploy the Edge Functions:
   ```bash
   npx supabase functions deploy create-link
   npx supabase functions deploy record-transaction
   npx supabase functions deploy alchemy-webhook
   npx supabase functions deploy helius-webhook
   ```

### 4. Run Locally
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000) to create your first payment link!
