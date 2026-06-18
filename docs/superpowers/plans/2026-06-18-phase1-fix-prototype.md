# Phase 1: Migrate to Convex + Fix Prototype — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Supabase with Convex as the backend and get the payment link flow working end-to-end on testnets. This eliminates all schema drift issues and gives us automatic real-time reactivity.

**Architecture:** Next.js frontend talks to Convex (reactive DB + server functions) for all data operations. Wallet execution still happens client-side via wagmi/wallet-adapter/dapp-kit. On-chain webhooks hit Convex HTTP actions to index events.

**Tech Stack:** Next.js 16, React 19, Convex, TypeScript, @solana/web3.js, wagmi/viem, @mysten/dapp-kit, LI.FI SDK v4

**Already completed (from recent commits):**
- CheckoutClient chain type fix (uses `chainFamily` from `getChainConfig()`)
- LI.FI router `LifiQuoteParams` interface has `fromChain: number | string`
- Supabase schema consolidated (column renames done in edge functions + migration)
- ChainTokenSelector has `SupportedChain` type with testnet variants
- Direct transfer fallback implemented in SmartButton

**Remaining work (this plan):**
- Initialize Convex and write schema/functions
- Migrate CreateLinkForm from Supabase edge function to Convex mutation
- Migrate SmartButton's record-transaction call to Convex mutation
- Migrate checkout page link fetch to Convex query
- Migrate dashboard pages to Convex reactive queries
- Remove all Supabase code and dependencies

---

### Task 1: Initialize Convex Project

**Files:**
- Create: `convex/schema.ts`
- Create: `convex/tsconfig.json`
- Modify: `package.json` (add convex dependency)
- Create: `.env.local` (add CONVEX_URL)

- [ ] **Step 1: Install Convex**

```bash
pnpm add convex
pnpm exec convex init
```

- [ ] **Step 2: Write the schema**

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  paymentLinks: defineTable({
    shortCode: v.string(),
    linkType: v.union(v.literal("invoice"), v.literal("tip_jar"), v.literal("recurring")),

    // Destination
    merchantAddress: v.string(),
    destinationChain: v.string(), // "base", "solana", "sui", "sepolia", "baseSepolia", "solanaDevnet", "suiTestnet"
    destinationTokenAddress: v.optional(v.string()),
    destinationTokenSymbol: v.string(),

    // Amount (undefined for tip_jar)
    amount: v.optional(v.string()),

    // Metadata
    label: v.optional(v.string()),
    memo: v.optional(v.string()),
    merchantEmail: v.optional(v.string()),

    // Lifecycle
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("expired"),
      v.literal("cancelled")
    ),
    expiresAt: v.optional(v.number()),

    // On-chain reference
    linkIdHash: v.string(),
  })
    .index("by_shortCode", ["shortCode"])
    .index("by_merchant", ["merchantAddress"])
    .index("by_status", ["status"]),

  transactions: defineTable({
    linkId: v.id("paymentLinks"),

    // Source (payer)
    payerAddress: v.string(),
    sourceChain: v.string(),
    sourceToken: v.optional(v.string()),
    sourceTxHash: v.string(),
    sourceAmount: v.string(),

    // Destination (result)
    destinationTxHash: v.optional(v.string()),
    destinationAmount: v.optional(v.string()),

    // LI.FI routing
    lifiRouteId: v.optional(v.string()),
    bridgeUsed: v.optional(v.string()),

    // Fees
    protocolFee: v.optional(v.string()),

    // Status
    status: v.union(
      v.literal("pending"),
      v.literal("bridging"),
      v.literal("confirmed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    confirmedAt: v.optional(v.number()),
  })
    .index("by_link", ["linkId"])
    .index("by_sourceTxHash", ["sourceTxHash"]),
});
```

- [ ] **Step 3: Deploy schema to Convex dev**

```bash
pnpm exec convex dev
```

Expected: Schema deploys successfully, Convex dashboard shows tables.

- [ ] **Step 4: Commit**

```bash
git add convex/ package.json pnpm-lock.yaml .env.local
git commit -m "feat: initialize Convex project with schema"
```

---

### Task 2: Write Convex Mutations (Create Link + Record Transaction)

**Files:**
- Create: `convex/links.ts`
- Create: `convex/transactions.ts`

- [ ] **Step 1: Write createLink mutation**

```typescript
// convex/links.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { createHash } from "crypto";

function generateShortCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function computeLinkIdHash(shortCode: string): string {
  return "0x" + createHash("sha256").update(shortCode).digest("hex");
}

export const createLink = mutation({
  args: {
    merchantAddress: v.string(),
    destinationChain: v.string(), // accepts any supported chain key
    destinationTokenSymbol: v.string(),
    destinationTokenAddress: v.optional(v.string()),
    amount: v.optional(v.string()),
    label: v.optional(v.string()),
    memo: v.optional(v.string()),
    merchantEmail: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    linkType: v.optional(v.union(v.literal("invoice"), v.literal("tip_jar"), v.literal("recurring"))),
  },
  handler: async (ctx, args) => {
    const shortCode = generateShortCode();
    const linkIdHash = computeLinkIdHash(shortCode);

    const id = await ctx.db.insert("paymentLinks", {
      shortCode,
      linkType: args.linkType ?? "invoice",
      merchantAddress: args.merchantAddress,
      destinationChain: args.destinationChain,
      destinationTokenSymbol: args.destinationTokenSymbol,
      destinationTokenAddress: args.destinationTokenAddress,
      amount: args.amount,
      label: args.label,
      memo: args.memo,
      merchantEmail: args.merchantEmail,
      status: "active",
      expiresAt: args.expiresAt,
      linkIdHash,
    });

    return { id, shortCode, linkIdHash };
  },
});

export const getLinkByShortCode = query({
  args: { shortCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("paymentLinks")
      .withIndex("by_shortCode", (q) => q.eq("shortCode", args.shortCode))
      .unique();
  },
});

export const getLinksByMerchant = query({
  args: { merchantAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("paymentLinks")
      .withIndex("by_merchant", (q) => q.eq("merchantAddress", args.merchantAddress))
      .order("desc")
      .collect();
  },
});
```

- [ ] **Step 2: Write recordTransaction mutation**

```typescript
// convex/transactions.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const recordTransaction = mutation({
  args: {
    linkId: v.id("paymentLinks"),
    payerAddress: v.string(),
    sourceChain: v.string(),
    sourceToken: v.optional(v.string()),
    sourceTxHash: v.string(),
    sourceAmount: v.string(),
    lifiRouteId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("transactions", {
      linkId: args.linkId,
      payerAddress: args.payerAddress,
      sourceChain: args.sourceChain,
      sourceToken: args.sourceToken,
      sourceTxHash: args.sourceTxHash,
      sourceAmount: args.sourceAmount,
      lifiRouteId: args.lifiRouteId,
      status: "pending",
    });
  },
});

export const confirmTransaction = mutation({
  args: {
    sourceTxHash: v.string(),
    destinationTxHash: v.optional(v.string()),
    destinationAmount: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const tx = await ctx.db
      .query("transactions")
      .withIndex("by_sourceTxHash", (q) => q.eq("sourceTxHash", args.sourceTxHash))
      .unique();

    if (!tx) throw new Error("Transaction not found");

    await ctx.db.patch(tx._id, {
      status: "confirmed",
      confirmedAt: Date.now(),
      destinationTxHash: args.destinationTxHash,
      destinationAmount: args.destinationAmount,
    });

    // Update link status if it's a one-time invoice
    const link = await ctx.db.get(tx.linkId);
    if (link && link.linkType === "invoice") {
      await ctx.db.patch(link._id, { status: "completed" });
    }
  },
});

export const getTransactionsByLink = query({
  args: { linkId: v.id("paymentLinks") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .withIndex("by_link", (q) => q.eq("linkId", args.linkId))
      .order("desc")
      .collect();
  },
});

export const getTransactionsByMerchant = query({
  args: { merchantAddress: v.string() },
  handler: async (ctx, args) => {
    // Get all links for this merchant, then get their transactions
    const links = await ctx.db
      .query("paymentLinks")
      .withIndex("by_merchant", (q) => q.eq("merchantAddress", args.merchantAddress))
      .collect();

    const linkIds = links.map((l) => l._id);
    const allTxs = [];

    for (const linkId of linkIds) {
      const txs = await ctx.db
        .query("transactions")
        .withIndex("by_link", (q) => q.eq("linkId", linkId))
        .collect();
      allTxs.push(...txs);
    }

    return allTxs.sort((a, b) => b._creationTime - a._creationTime);
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add convex/links.ts convex/transactions.ts
git commit -m "feat: add Convex mutations and queries for links and transactions"
```

---

### Task 3: Write Convex HTTP Actions (Webhook Receivers)

**Files:**
- Create: `convex/http.ts`
- Create: `convex/webhooks.ts`

- [ ] **Step 1: Write HTTP action router**

```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { handleAlchemyWebhook, handleHeliusWebhook } from "./webhooks";

const http = httpRouter();

http.route({
  path: "/webhooks/alchemy",
  method: "POST",
  handler: handleAlchemyWebhook,
});

http.route({
  path: "/webhooks/helius",
  method: "POST",
  handler: handleHeliusWebhook,
});

export default http;
```

- [ ] **Step 2: Write webhook handlers**

```typescript
// convex/webhooks.ts
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

export const handleAlchemyWebhook = httpAction(async (ctx, request) => {
  const body = await request.json();

  // Extract tx hash from Alchemy webhook payload
  const activities = body?.event?.activity || [];
  for (const activity of activities) {
    const txHash = activity.hash;
    if (!txHash) continue;

    try {
      await ctx.runMutation(api.transactions.confirmTransaction, {
        sourceTxHash: txHash,
      });
    } catch (e) {
      // Transaction not found in our DB — ignore (not our payment)
      console.log(`Ignoring tx ${txHash}: not found in DB`);
    }
  }

  return new Response("OK", { status: 200 });
});

export const handleHeliusWebhook = httpAction(async (ctx, request) => {
  const body = await request.json();

  // Helius sends an array of transactions
  const transactions = Array.isArray(body) ? body : [body];
  for (const tx of transactions) {
    const signature = tx.signature || tx.transaction?.signatures?.[0];
    if (!signature) continue;

    try {
      await ctx.runMutation(api.transactions.confirmTransaction, {
        sourceTxHash: signature,
      });
    } catch (e) {
      console.log(`Ignoring sig ${signature}: not found in DB`);
    }
  }

  return new Response("OK", { status: 200 });
});
```

- [ ] **Step 3: Commit**

```bash
git add convex/http.ts convex/webhooks.ts
git commit -m "feat: add Convex HTTP actions for Alchemy/Helius webhooks"
```

---

### Task 4: Write Convex Cron for Link Expiry

**Files:**
- Create: `convex/crons.ts`

- [ ] **Step 1: Write expiry cron**

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

export const expireLinks = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const activeLinks = await ctx.db
      .query("paymentLinks")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    for (const link of activeLinks) {
      if (link.expiresAt && link.expiresAt < now) {
        await ctx.db.patch(link._id, { status: "expired" });
      }
    }
  },
});

const crons = cronJobs();

crons.interval("expire stale links", { minutes: 1 }, internal.crons.expireLinks);

export default crons;
```

- [ ] **Step 2: Commit**

```bash
git add convex/crons.ts
git commit -m "feat: add Convex cron for automatic link expiry"
```

---

### Task 5: Add Convex Provider to Frontend

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/providers/ConvexClientProvider.tsx`

- [ ] **Step 1: Create Convex provider component**

```typescript
// src/providers/ConvexClientProvider.tsx
"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
```

- [ ] **Step 2: Wrap layout with ConvexClientProvider**

In `src/app/layout.tsx`, wrap the existing `<Web3Provider>` with `<ConvexClientProvider>`:

```tsx
import { ConvexClientProvider } from "@/providers/ConvexClientProvider";

// In the body:
<ConvexClientProvider>
  <Web3Provider>
    {/* ... existing content ... */}
  </Web3Provider>
</ConvexClientProvider>
```

- [ ] **Step 3: Add NEXT_PUBLIC_CONVEX_URL to .env.local**

```
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

- [ ] **Step 4: Commit**

```bash
git add src/providers/ConvexClientProvider.tsx src/app/layout.tsx .env.local
git commit -m "feat: add Convex provider to app layout"
```

---

### Task 6: Migrate CreateLinkForm to Convex

**Files:**
- Modify: `src/components/CreateLinkForm.tsx`
- Delete: `src/lib/payment.ts`

- [ ] **Step 1: Replace Supabase call with Convex mutation**

```typescript
// In CreateLinkForm.tsx, replace the import and handleCreate:
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

// Inside the component:
const createLinkMutation = useMutation(api.links.createLink);

const handleCreate = async () => {
  if (!address || !amount) return;
  setIsLoading(true);

  try {
    let expiresAt: number | undefined;
    const now = Date.now();
    if (expiry === '15m') expiresAt = now + 15 * 60 * 1000;
    else if (expiry === '1h') expiresAt = now + 60 * 60 * 1000;
    else if (expiry === '24h') expiresAt = now + 24 * 60 * 60 * 1000;
    else if (expiry === '7d') expiresAt = now + 7 * 24 * 60 * 60 * 1000;

    const result = await createLinkMutation({
      merchantAddress: address,
      destinationChain: chain,
      destinationTokenSymbol: tokenSymbol,
      destinationTokenAddress: chain === 'sui' ? '0x2::sui::SUI' : undefined,
      amount,
      merchantEmail: email || undefined,
      memo: memo || undefined,
      label: 'justpay.wtf Payment',
      expiresAt,
      linkType: 'invoice',
    });

    router.push(`/${result.shortCode}`);
  } catch (error: any) {
    console.error(error);
    alert(error.message || 'Failed to create link');
  } finally {
    setIsLoading(false);
  }
};
```

- [ ] **Step 2: Remove src/lib/payment.ts (no longer needed)**

```bash
rm src/lib/payment.ts
```

- [ ] **Step 3: Commit**

```bash
git add src/components/CreateLinkForm.tsx
git rm src/lib/payment.ts
git commit -m "feat: migrate CreateLinkForm to Convex mutation"
```

---

### Task 7: Migrate Checkout Page to Convex

**Files:**
- Modify: `src/app/[linkId]/page.tsx`
- Modify: `src/app/[linkId]/CheckoutClient.tsx`

- [ ] **Step 1: Rewrite page.tsx to use Convex query**

The checkout page needs to fetch link data. Since it's a server component, use `fetchQuery` from `convex/nextjs`:

```typescript
// src/app/[linkId]/page.tsx
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { CheckoutClient } from "./CheckoutClient";

export default async function CheckoutPage({ params }: { params: { linkId: string } }) {
  const link = await fetchQuery(api.links.getLinkByShortCode, { shortCode: params.linkId });

  if (!link) {
    return <div className="text-center p-8">Link not found</div>;
  }

  if (link.status === "expired") {
    return <div className="text-center p-8">This payment link has expired</div>;
  }

  return (
    <CheckoutClient
      linkId={link._id}
      shortCode={link.shortCode}
      chain={link.destinationChain}
      recipientAddress={link.merchantAddress}
      tokenSymbol={link.destinationTokenSymbol}
      amount={link.amount || "0"}
    />
  );
}
```

- [ ] **Step 2: Fix CheckoutClient chain type**

Change the `chain` prop type from `'ethereum' | 'solana' | 'sui'` to `string` and fix the comparison logic using chain family:

```typescript
interface CheckoutClientProps {
  linkId: string;
  shortCode: string;
  chain: string;
  recipientAddress: string;
  tokenSymbol: string;
  amount: string;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/[linkId]/page.tsx src/app/[linkId]/CheckoutClient.tsx
git commit -m "feat: migrate checkout page to Convex query, fix chain type"
```

---

### Task 8: Migrate SmartButton to Record Transaction via Convex

**Files:**
- Modify: `src/components/SmartButton.tsx`

The SmartButton currently calls `fetch(${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/record-transaction, ...)` with fields like `linkId`, `payerAddress`, `payerChain`, `txHash`, `amountPaid`, `tokenPaid`, `bridgeTxHash`, etc. Replace this with a Convex mutation.

- [ ] **Step 1: Replace Supabase fetch with Convex mutation**

```typescript
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Inside component:
const recordTx = useMutation(api.transactions.recordTransaction);

// Replace the entire fetch(...record-transaction...) block with:
await recordTx({
  linkId: linkId as Id<"paymentLinks">,
  payerAddress,
  sourceChain: payerChain,
  sourceToken: inputTokenAddress || tokenAddress || "NATIVE",
  sourceTxHash: txHash,
  sourceAmount: String(amountPaidFloat),
  lifiRouteId: undefined, // LI.FI doesn't return a route ID in current flow
});
```

Also remove the `idempotencyKey`, `fromDecimals`, and `amountPaidFloat` calculation block since Convex handles deduplication via the `by_sourceTxHash` index.

- [ ] **Step 2: Remove NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env vars usage from SmartButton**

- [ ] **Step 3: Commit**

```bash
git add src/components/SmartButton.tsx
git commit -m "feat: migrate SmartButton to Convex recordTransaction mutation"
```

---

### Task 9: Migrate Dashboard to Convex Reactive Queries

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/dashboard/history/page.tsx`
- Modify: `src/app/dashboard/links/page.tsx`

- [ ] **Step 1: Rewrite dashboard overview**

```typescript
// src/app/dashboard/page.tsx
"use client";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

// Inside component:
const links = useQuery(api.links.getLinksByMerchant, 
  address ? { merchantAddress: address } : "skip"
);
const transactions = useQuery(api.transactions.getTransactionsByMerchant,
  address ? { merchantAddress: address } : "skip"
);

// These auto-update in real-time when new payments arrive!
const activeLinks = links?.filter(l => l.status === "active").length ?? 0;
const totalVolume = transactions?.reduce((sum, tx) => sum + Number(tx.sourceAmount), 0) ?? 0;
```

- [ ] **Step 2: Rewrite history page similarly**

Replace Supabase queries with `useQuery(api.transactions.getTransactionsByMerchant, ...)`.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx src/app/dashboard/history/page.tsx src/app/dashboard/links/page.tsx
git commit -m "feat: migrate dashboard to Convex reactive queries"
```

---

### Task 10: Remove Supabase Dependencies

**Files:**
- Modify: `package.json`
- Delete: `src/lib/supabase.ts`
- Delete: `supabase/` directory (migrations, functions, config)
- Delete: `src/app/api/v1/links/route.ts` (replaced by Convex)

- [ ] **Step 1: Remove Supabase packages**

```bash
pnpm remove @supabase/supabase-js
rm src/lib/supabase.ts
rm -rf supabase/
rm src/app/api/v1/links/route.ts
rm src/hooks/usePaymentState.ts
```

- [ ] **Step 2: Remove any remaining Supabase imports**

```bash
grep -r "supabase" src/ --include="*.ts" --include="*.tsx" -l
```

Fix any remaining imports found.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove Supabase dependencies and legacy code"
```

---

### Task 11: Verify End-to-End Build

- [ ] **Step 1: Run Convex dev to verify schema + functions deploy**

```bash
pnpm exec convex dev
```

Expected: All functions deploy without errors.

- [ ] **Step 2: Run Next.js build**

```bash
pnpm build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Push all changes**

```bash
git push origin main
```

---

## Convex Functions Summary

After this phase, the Convex backend has:

| Function | Type | Purpose |
|----------|------|---------|
| `links.createLink` | Mutation | Create a new payment link |
| `links.getLinkByShortCode` | Query | Fetch link for checkout page |
| `links.getLinksByMerchant` | Query | Dashboard link list (reactive) |
| `transactions.recordTransaction` | Mutation | Record payment intent |
| `transactions.confirmTransaction` | Mutation | Mark tx as confirmed (called by webhooks) |
| `transactions.getTransactionsByLink` | Query | Get txs for a specific link |
| `transactions.getTransactionsByMerchant` | Query | Dashboard tx history (reactive) |
| `webhooks.handleAlchemyWebhook` | HTTP Action | Receive EVM payment events |
| `webhooks.handleHeliusWebhook` | HTTP Action | Receive Solana payment events |
| `crons.expireLinks` | Cron (1min) | Auto-expire old links |

## What's Different from Supabase Approach

1. **No SQL migrations** — schema is TypeScript, validated at deploy time
2. **No Edge Functions** — replaced by Convex mutations/actions
3. **No Realtime setup** — every `useQuery` auto-updates when data changes
4. **No schema drift** — TypeScript compiler catches mismatches
5. **No separate hosting** — Convex is fully managed
6. **Dashboard is reactive by default** — when a webhook confirms a payment, ALL connected merchant dashboards update instantly without any extra code
