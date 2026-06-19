# Checkout Screen — LI.FI Widget Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Convex schema to reflect the "receiver not merchant" model with fully optional destination preferences, then replace the custom swap/bridge UI in `CheckoutClient.tsx` with the embedded `@lifi/widget` pre-configured from link data.

**Architecture:** A payment link represents a receiver's payment preferences — only `receiverAddress` is required. `destinationChain`, `destinationTokenSymbol`, and `amount` are all optional. If a receiver sets them, the checkout widget locks those fields for the sender. If not set, the sender picks freely. The `/[linkId]` page fetches link data from Convex (server-side via `fetchQuery` for fast initial render + OG metadata), then renders the LI.FI Widget configured from whatever preferences the receiver chose. On route completion the widget calls the existing `recordTransaction` Convex mutation. No custom quote-fetching, no 0x API.

**Why `@lifi/widget` over raw `@lifi/sdk`:** The widget is the same engine powering Jumper.xyz — 4x audited, handles EVM + Solana (+ Sui via future provider), shows route previews, gas costs, progress tracking, and bridge/swap aggregation across 50+ protocols. It replaces ~400 lines of custom routing code in `SmartButton.tsx` + `lifi.ts`. Funds flow **directly** from sender to receiver's wallet — no escrow, no custodian, fully non-custodial. Revenue comes from LI.FI's integrator fee split: set `fee` + `feeRecipient` in widget config and LI.FI routes a percentage of every swap/bridge to justpay's wallet automatically.

**Tech Stack:** `@lifi/widget` v3, `@lifi/widget-provider-ethereum` (uses existing `wagmi` v3), `@lifi/widget-provider-solana` (needs `bs58`), Convex mutations (existing), Next.js `dynamic()` import with `ssr: false`

---

## File Map

| File                                           | Action      | Purpose                                                                                                                  |
| ---------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| `convex/schema.ts`                             | **Modify**  | Redesign `paymentLinks` table — optional destination fields, receiver naming, drop linkType/label                        |
| `convex/links.ts`                              | **Modify**  | Update `createLink` mutation args + handler; improve shortCode collision handling                                        |
| `src/components/ExpiryPicker.tsx`              | **Create**  | Expiry selector: sliding preset tabs, custom datetime panel, ∞ toggle                                                    |
| `src/components/ExpiryBadge.tsx`               | **Create**  | Live countdown badge shown on checkout page when link has an expiry                                                      |
| `src/components/CreateLinkForm.tsx`            | **Modify**  | Replace raw expiry select with `<ExpiryPicker>`; update mutation args; make chain/token/amount optional                  |
| `src/app/globals.css`                          | **Modify**  | Add transitions.dev CSS: `t-tabs`, `t-panel-slide`, `t-icon-swap`, `t-text-swap`                                         |
| `src/lib/config/network.ts`                    | **Modify**  | Keep only non-EVM special config (Solana, Sui); EVM chains come from LI.FI SDK at runtime                                |
| `src/components/shared/ChainTokenSelector.tsx` | **Modify**  | Replace hardcoded chain list with LI.FI SDK `getChains()` — searchable, covers all 40+ LI.FI-supported chains            |
| `src/lib/config/chain-policy.ts`               | **Delete**  | Gas sponsorship stubs with no implementation. Not needed.                                                                |
| `src/app/[linkId]/CheckoutClient.tsx`          | **Replace** | Embed LI.FI Widget; handle optional chain/token in widget config                                                         |
| `src/lib/web3/lifi-widget-config.ts`           | **Create**  | Pure function: maps optional `{ destinationChain, tokenSymbol, tokenAddress, receiverAddress, amount }` → `WidgetConfig` |
| `src/app/[linkId]/page.tsx`                    | **Modify**  | Server component with `generateMetadata` for OG previews; use new field names; add `<ExpiryBadge>`                       |
| `.env`                                         | **Modify**  | Remove unused keys                                                                                                       |

**Files intentionally left alone:**

- `src/components/SmartButton.tsx` — no longer needed for checkout; delete in a follow-up cleanup PR
- `src/lib/web3/router/lifi.ts` — no longer needed; delete in a follow-up cleanup PR
- `src/lib/web3/directTransfer.ts` — no longer needed; widget handles same-chain transfers; delete in a follow-up cleanup PR
- `convex/transactions.ts` — already has `recordTransaction` mutation, no changes needed

---

## Task 0: Redesign Convex Schema

**Files:**

- Modify: `convex/schema.ts`
- Modify: `convex/links.ts`
- Modify: `src/components/CreateLinkForm.tsx`

### Design decisions baked in here

| Decision                          | Rationale                                                                                                                                                                                                                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Drop `linkType`                   | Behavior is fully derivable: has `amount`? fixed-amount link. has `expiresAt`? expiring link. No need for an explicit type enum — it adds a field that must be kept in sync with the data it supposedly describes.                                                           |
| Drop `label`                      | Was always hardcoded to `'justpay.wtf Payment'` in the form — identical for every link. Zero information value. Dropped.                                                                                                                                                     |
| Rename `memo` → `note`            | `note` is what users actually think of when describing a payment ("Coffee for the meetup"). `memo` is jargon.                                                                                                                                                                |
| `merchant*` → `receiver*`         | justpay is for any Web3 user sharing a payment link, not just merchants. Naming should reflect that.                                                                                                                                                                         |
| `destinationChain` optional       | Receiver may not care which chain they receive on. Widget runs in open mode; sender picks freely.                                                                                                                                                                            |
| `destinationTokenSymbol` optional | Same. Receiver might just want "whatever token you have".                                                                                                                                                                                                                    |
| Drop `status: 'expired'`          | Checking `expiresAt < Date.now()` at read time is sufficient. A separate `expired` status requires a background cron to flip it — unnecessary complexity.                                                                                                                    |
| Drop `linkIdHash`                 | Was only proposed for on-chain escrow contract matching. No escrow → no contracts → no on-chain link identity needed. Removed entirely.                                                                                                                                      |
| Expiry defaults to `none`         | Receiver-controlled. Form should default to no expiry — links should last forever unless the receiver explicitly sets a deadline.                                                                                                                                            |
| shortCode lookup approach         | 7-char alphanumeric slug (36⁷ ≈ 78B combinations) with a Convex B-tree index. Sub-millisecond lookups at any realistic scale. Collision probability at 1M links is ~0.001% — low, but the mutation should retry up to 5 times. No better alternative for user-friendly URLs. |

- [ ] **Step 1: Rewrite `convex/schema.ts`**

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  paymentLinks: defineTable({
    // Lookup key (used as URL slug: justpay.wtf/abc1234)
    shortCode: v.string(),

    // Receiver identity — the only required field
    receiverAddress: v.string(),
    receiverEmail: v.optional(v.string()),

    // Payment preferences — all optional.
    // If not set, sender chooses freely in the widget.
    destinationChain: v.optional(v.string()),
    destinationTokenAddress: v.optional(v.string()),
    destinationTokenSymbol: v.optional(v.string()),
    amount: v.optional(v.string()), // human-readable (e.g. "10.5")

    // Optional description shown on the checkout page
    note: v.optional(v.string()),

    // Lifecycle
    status: v.union(
      v.literal("active"),
      v.literal("completed"), // single-use fixed-amount links after payment
      v.literal("cancelled"), // receiver manually deactivated
    ),
    expiresAt: v.optional(v.number()), // ms epoch. undefined = never expires.
  })
    .index("by_shortCode", ["shortCode"])
    .index("by_receiver", ["receiverAddress"]),

  transactions: defineTable({
    linkId: v.id("paymentLinks"),
    payerAddress: v.string(),
    sourceChain: v.string(),
    sourceToken: v.optional(v.string()),
    sourceTxHash: v.string(),
    sourceAmount: v.string(),
    destinationTxHash: v.optional(v.string()),
    destinationAmount: v.optional(v.string()),
    lifiRouteId: v.optional(v.string()),
    bridgeUsed: v.optional(v.string()),
    protocolFee: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("bridging"),
      v.literal("confirmed"),
      v.literal("failed"),
      v.literal("refunded"),
    ),
    confirmedAt: v.optional(v.number()),
  })
    .index("by_link", ["linkId"])
    .index("by_sourceTxHash", ["sourceTxHash"]),
});
```

- [ ] **Step 2: Rewrite `convex/links.ts` — `createLink` mutation**

Update the mutation args and handler to match the new schema. Add shortCode collision retry:

```ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function generateUniqueShortCode(ctx: any): Promise<string> {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  for (let attempt = 0; attempt < 5; attempt++) {
    let code = "";
    for (let i = 0; i < 7; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    const existing = await ctx.db
      .query("paymentLinks")
      .withIndex("by_shortCode", (q: any) => q.eq("shortCode", code))
      .unique();
    if (!existing) return code;
  }
  throw new Error("Failed to generate unique short code after 5 attempts");
}

export const createLink = mutation({
  args: {
    receiverAddress: v.string(),
    receiverEmail: v.optional(v.string()),
    destinationChain: v.optional(v.string()),
    destinationTokenSymbol: v.optional(v.string()),
    destinationTokenAddress: v.optional(v.string()),
    amount: v.optional(v.string()),
    note: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const shortCode = await generateUniqueShortCode(ctx);
    const id = await ctx.db.insert("paymentLinks", {
      shortCode,
      receiverAddress: args.receiverAddress,
      receiverEmail: args.receiverEmail,
      destinationChain: args.destinationChain,
      destinationTokenSymbol: args.destinationTokenSymbol,
      destinationTokenAddress: args.destinationTokenAddress,
      amount: args.amount,
      note: args.note,
      status: "active",
      expiresAt: args.expiresAt,
    });
    return { id, shortCode };
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

export const getLinksByReceiver = query({
  args: { receiverAddress: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("paymentLinks")
      .withIndex("by_receiver", (q) =>
        q.eq("receiverAddress", args.receiverAddress),
      )
      .collect();
  },
});
```

- [ ] **Step 3: Update `CreateLinkForm.tsx` to use new field names**

In `src/components/CreateLinkForm.tsx`, update the `createLinkMutation` call:

```ts
// Remove: linkType, label
// Rename: merchantAddress → receiverAddress, merchantEmail → receiverEmail, memo → note
// Make chain/token/amount optional (don't pass if empty)
// Change default expiry to 'none'

// In state initialization:
const [expiry, setExpiry] = useState("none"); // default: never expires

// In handleCreate:
const result = await createLinkMutation({
  receiverAddress: finalAddress,
  receiverEmail: email || undefined,
  destinationChain: chain || undefined, // optional
  destinationTokenSymbol: tokenSymbol || undefined, // optional
  destinationTokenAddress: /* same logic as before */ undefined,
  amount: amount ? amount : undefined,
  note: memo || undefined,
  expiresAt,
});
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | grep -E "Type error|error TS"
```

Expected: No errors. If Convex complains about schema drift, run `npx convex dev --once` to push the new schema.

- [ ] **Step 5: Verify Convex schema push**

```bash
npx convex dev --once 2>&1 | tail -10
```

Expected: Schema pushes successfully. Convex will show which tables were modified.

- [ ] **Step 6: Commit**

```bash
git add convex/schema.ts convex/links.ts src/components/CreateLinkForm.tsx
git commit -m "feat: redesign schema — receiver naming, optional destination fields, drop linkType/label"
```

---

## Task 0b: Expiry Picker UI Component

**Files:**

- Create: `src/components/ExpiryPicker.tsx`
- Create: `src/components/ExpiryBadge.tsx`
- Modify: `src/components/CreateLinkForm.tsx`
- Modify: `src/app/globals.css`

### Design decisions

| Decision                                 | Rationale                                                                                                                                    |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Default expiry = 15 minutes              | Most links are created for immediate use. 15 min is safe. Receiver can change it.                                                            |
| ∞ toggle collapses the entire preset bar | Binary choice — either the link expires or it doesn't. The toggle at the top controls the mode; the presets only appear when expiring is on. |
| Sliding tab pill for presets             | Mutually-exclusive options with a moving highlight = `t-tabs` from transitions.dev                                                           |
| Custom option reveals a datetime panel   | `t-panel-slide` from transitions.dev — slides + cross-blurs in on "Custom" selection                                                         |
| Clock ↔ ∞ icon swap on toggle            | `t-icon-swap` from transitions.dev — cross-fades with blur+scale                                                                             |
| Expiry countdown on checkout page        | `t-text-swap` on each tick update — old number exits up blurred, new enters from below                                                       |
| Brutalist styling throughout             | Heavy borders, uppercase labels, hard shadows matching existing `.form-label` / `.input-field` patterns                                      |

### Transitions.dev CSS to add

- [ ] **Step 1: Add transition CSS variables and classes to `src/app/globals.css`**

Append the following to the end of `src/app/globals.css` (after the existing tooltip block):

```css
/* ─── transitions.dev: Tabs Sliding (t-tabs) ─────────────────────────────── */
:root {
  --tabs-dur: 250ms;
  --tabs-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --tabs-text-muted: rgba(0, 0, 0, 0.45);
  --tabs-text-active: #000000;
  --tabs-bar-bg: transparent;
  --tabs-pill-bg: #000000;
}
.dark {
  --tabs-text-muted: rgba(255, 255, 255, 0.45);
  --tabs-text-active: #ffffff;
  --tabs-pill-bg: #ffffff;
}
.t-tabs {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0;
  padding: 0;
  background: var(--tabs-bar-bg);
  width: 100%;
}
.t-tab {
  position: relative;
  appearance: none;
  border: 0;
  border-bottom: 3px solid black;
  background: transparent;
  height: 36px;
  padding: 0 10px;
  flex: 1;
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--tabs-text-muted);
  cursor: pointer;
  z-index: 1;
  transition: color var(--tabs-dur) var(--tabs-ease);
}
.t-tab[aria-selected="true"] {
  color: var(--tabs-text-active);
}
.t-tabs-pill {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 0;
  background: var(--tabs-pill-bg);
  transform: translateX(0);
  transition:
    transform var(--tabs-dur) var(--tabs-ease),
    width var(--tabs-dur) var(--tabs-ease);
  will-change: transform, width;
  z-index: 2;
}
@media (prefers-reduced-motion: reduce) {
  .t-tabs-pill {
    transition: none !important;
  }
  .t-tab {
    transition: none !important;
  }
}

/* ─── transitions.dev: Panel Reveal (t-panel-slide) ──────────────────────── */
:root {
  --panel-open-dur: 350ms;
  --panel-close-dur: 280ms;
  --panel-translate-y: 12px;
  --panel-blur: 2px;
  --panel-ease: cubic-bezier(0.22, 1, 0.36, 1);
}
.t-panel-slide {
  transform: translateY(var(--panel-translate-y));
  opacity: 0;
  filter: blur(var(--panel-blur));
  pointer-events: none;
  max-height: 0;
  overflow: hidden;
  transition:
    transform var(--panel-close-dur) var(--panel-ease),
    opacity var(--panel-close-dur) var(--panel-ease),
    filter var(--panel-close-dur) var(--panel-ease),
    max-height var(--panel-close-dur) var(--panel-ease);
  will-change: transform, opacity, filter;
}
.t-panel-slide[data-open="true"] {
  transform: translateY(0);
  opacity: 1;
  filter: blur(0);
  pointer-events: auto;
  max-height: 120px;
  transition:
    transform var(--panel-open-dur) var(--panel-ease),
    opacity var(--panel-open-dur) var(--panel-ease),
    filter var(--panel-open-dur) var(--panel-ease),
    max-height var(--panel-open-dur) var(--panel-ease);
}
@media (prefers-reduced-motion: reduce) {
  .t-panel-slide {
    transition: none !important;
  }
}

/* ─── transitions.dev: Icon Swap (t-icon-swap) ───────────────────────────── */
:root {
  --icon-swap-dur: 220ms;
  --icon-swap-blur: 3px;
  --icon-swap-start-scale: 0.3;
  --icon-swap-ease: ease-in-out;
}
.t-icon-swap {
  position: relative;
  display: inline-grid;
}
.t-icon-swap .t-icon {
  grid-area: 1 / 1;
  transition:
    opacity var(--icon-swap-dur) var(--icon-swap-ease),
    filter var(--icon-swap-dur) var(--icon-swap-ease),
    transform var(--icon-swap-dur) var(--icon-swap-ease);
  will-change: opacity, filter, transform;
}
.t-icon-swap[data-state="a"] .t-icon[data-icon="a"],
.t-icon-swap[data-state="b"] .t-icon[data-icon="b"] {
  opacity: 1;
  filter: blur(0);
  transform: scale(1);
}
.t-icon-swap[data-state="a"] .t-icon[data-icon="b"],
.t-icon-swap[data-state="b"] .t-icon[data-icon="a"] {
  opacity: 0;
  filter: blur(var(--icon-swap-blur));
  transform: scale(var(--icon-swap-start-scale));
}
@media (prefers-reduced-motion: reduce) {
  .t-icon-swap .t-icon {
    transition: none !important;
  }
}

/* ─── transitions.dev: Text Swap (t-text-swap) ───────────────────────────── */
:root {
  --text-swap-dur: 150ms;
  --text-swap-translate-y: 4px;
  --text-swap-blur: 2px;
  --text-swap-ease: ease-in-out;
}
.t-text-swap {
  display: inline-block;
  transform: translateY(0);
  filter: blur(0);
  opacity: 1;
  transition:
    transform var(--text-swap-dur) var(--text-swap-ease),
    filter var(--text-swap-dur) var(--text-swap-ease),
    opacity var(--text-swap-dur) var(--text-swap-ease);
  will-change: transform, filter, opacity;
}
.t-text-swap.is-exit {
  transform: translateY(calc(var(--text-swap-translate-y) * -1));
  filter: blur(var(--text-swap-blur));
  opacity: 0;
}
.t-text-swap.is-enter-start {
  transform: translateY(var(--text-swap-translate-y));
  filter: blur(var(--text-swap-blur));
  opacity: 0;
  transition: none;
}
@media (prefers-reduced-motion: reduce) {
  .t-text-swap {
    transition: none !important;
  }
}
```

- [ ] **Step 2: Create `src/components/ExpiryPicker.tsx`**

```tsx
"use client";

import { useRef, useEffect, useCallback } from "react";

export type ExpiryValue =
  | { type: "preset"; minutes: 15 | 60 | 1440 | 10080 | 44640 }
  | { type: "custom"; isoDate: string } // datetime-local value
  | { type: "never" };

const PRESETS: { label: string; minutes: 15 | 60 | 1440 | 10080 | 44640 }[] = [
  { label: "15 MIN", minutes: 15 },
  { label: "1 HR", minutes: 60 },
  { label: "1 DAY", minutes: 1440 },
  { label: "7 DAYS", minutes: 10080 },
  { label: "31 DAYS", minutes: 44640 },
];

interface Props {
  value: ExpiryValue;
  onChange: (v: ExpiryValue) => void;
}

export function ExpiryPicker({ value, onChange }: Props) {
  const pillRef = useRef<HTMLSpanElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const isNever = value.type === "never";
  const isCustom = value.type === "custom";
  const activeMinutes = value.type === "preset" ? value.minutes : null;

  // Slide the pill to the active tab
  const syncPill = useCallback(() => {
    const pill = pillRef.current;
    const bar = tabsRef.current;
    if (!pill || !bar) return;
    const activeTab = bar.querySelector<HTMLButtonElement>(
      '[aria-selected="true"]',
    );
    if (!activeTab) {
      pill.style.width = "0";
      return;
    }
    pill.style.width = `${activeTab.offsetWidth}px`;
    pill.style.transform = `translateX(${activeTab.offsetLeft}px)`;
  }, []);

  useEffect(() => {
    // Snap on mount (no animation)
    const pill = pillRef.current;
    if (pill) {
      pill.style.transition = "none";
      syncPill();
      void pill.offsetWidth; // force reflow
      pill.style.transition = "";
    }
  }, [value.type, activeMinutes, syncPill]);

  useEffect(() => {
    window.addEventListener("resize", syncPill);
    return () => window.removeEventListener("resize", syncPill);
  }, [syncPill]);

  return (
    <div className="flex flex-col gap-3">
      {/* Header row: label + ∞ toggle */}
      <div className="flex items-center justify-between">
        <span className="form-label">EXPIRES</span>

        <button
          type="button"
          aria-label={isNever ? "Set expiry" : "Make permanent"}
          aria-pressed={isNever}
          onClick={() =>
            onChange(
              isNever ? { type: "preset", minutes: 15 } : { type: "never" },
            )
          }
          className="flex items-center gap-2 border-[3px] border-black px-3 py-1 text-[12px] font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] hover:-translate-y-[1px] hover:translate-x-[1px] hover:shadow-[4px_4px_0px_0px_#000] transition-all select-none"
          style={{
            background: isNever ? "black" : "white",
            color: isNever ? "white" : "black",
          }}
        >
          {/* Icon swap: clock (a) ↔ ∞ (b) */}
          <span className="t-icon-swap" data-state={isNever ? "b" : "a"}>
            {/* Clock icon */}
            <span className="t-icon" data-icon="a">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
            {/* Infinity icon */}
            <span className="t-icon" data-icon="b">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M12 12c-2-2.5-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.5 6-4zm0 0c2 2.5 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.5-6 4z" />
              </svg>
            </span>
          </span>
          {isNever ? "NO EXPIRY" : "SET EXPIRY"}
        </button>
      </div>

      {/* Preset tab bar + custom panel — hidden when isNever */}
      <div className="t-panel-slide" data-open={(!isNever).toString()}>
        <div
          className="t-tabs"
          ref={tabsRef}
          role="tablist"
          aria-label="Link expiry"
        >
          <span className="t-tabs-pill" ref={pillRef} aria-hidden="true" />
          {PRESETS.map((p) => (
            <button
              key={p.minutes}
              role="tab"
              type="button"
              aria-selected={
                (activeMinutes === p.minutes && !isCustom).toString() as
                  | "true"
                  | "false"
              }
              onClick={() => {
                onChange({ type: "preset", minutes: p.minutes });
                // syncPill fires via useEffect dependency on activeMinutes
              }}
              className="t-tab"
            >
              {p.label}
            </button>
          ))}
          <button
            role="tab"
            type="button"
            aria-selected={isCustom.toString() as "true" | "false"}
            onClick={() => onChange({ type: "custom", isoDate: "" })}
            className="t-tab"
          >
            CUSTOM
          </button>
        </div>

        {/* Custom datetime panel — reveals only when custom tab active */}
        <div
          className="t-panel-slide mt-3"
          data-open={isCustom.toString()}
          style={{ "--panel-translate-y": "8px" } as React.CSSProperties}
        >
          <input
            type="datetime-local"
            className="input-field"
            value={value.type === "custom" ? value.isoDate : ""}
            min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
            onChange={(e) =>
              onChange({ type: "custom", isoDate: e.target.value })
            }
          />
        </div>
      </div>
    </div>
  );
}

/** Convert an ExpiryValue to a UNIX ms timestamp or undefined (never) */
export function expiryValueToTimestamp(v: ExpiryValue): number | undefined {
  if (v.type === "never") return undefined;
  if (v.type === "preset") return Date.now() + v.minutes * 60_000;
  if (v.type === "custom" && v.isoDate) return new Date(v.isoDate).getTime();
  return undefined;
}
```

- [ ] **Step 3: Create `src/components/ExpiryBadge.tsx`**

This shows a live countdown on the checkout page when the link has an expiry. It uses `t-text-swap` to animate each second tick. Renders nothing if no expiry.

```tsx
"use client";

import { useState, useEffect, useRef } from "react";

interface Props {
  expiresAt: number | undefined; // ms epoch, or undefined = never
}

function formatCountdown(msLeft: number): string {
  if (msLeft <= 0) return "EXPIRED";
  const s = Math.floor(msLeft / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

export function ExpiryBadge({ expiresAt }: Props) {
  const [label, setLabel] = useState<string>("");
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!expiresAt) return;

    function tick() {
      const msLeft = expiresAt! - Date.now();
      const next = formatCountdown(msLeft);
      const el = spanRef.current;
      if (!el || el.textContent === next) return;

      // Three-phase t-text-swap
      el.classList.add("is-exit");
      setTimeout(() => {
        setLabel(next);
        el.classList.remove("is-exit");
        el.classList.add("is-enter-start");
        void el.offsetWidth; // force reflow
        el.classList.remove("is-enter-start");
      }, 150);
    }

    tick(); // immediate first paint
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt) return null;

  return (
    <div className="flex items-center gap-2 border-[3px] border-black px-3 py-2 shadow-[3px_3px_0px_0px_#000] w-fit">
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span className="text-[12px] font-black uppercase tracking-wider">
        LINK EXPIRES IN{" "}
        <span ref={spanRef} className="t-text-swap">
          {label}
        </span>
      </span>
    </div>
  );
}
```

- [ ] **Step 4: Update `CreateLinkForm.tsx` to use `<ExpiryPicker>`**

In `src/components/CreateLinkForm.tsx`:

```tsx
// Add import:
import { ExpiryPicker, ExpiryValue, expiryValueToTimestamp } from './ExpiryPicker'

// Replace expiry state:
// OLD: const [expiry, setExpiry] = useState('none')
// NEW:
const [expiry, setExpiry] = useState<ExpiryValue>({ type: 'preset', minutes: 15 })

// In handleCreate, replace the expiry calculation block:
// OLD: if (expiry === '15m') expiresAt = ...
// NEW:
expiresAt = expiryValueToTimestamp(expiry)

// In the JSX, replace the old expiry select/radio with:
<ExpiryPicker value={expiry} onChange={setExpiry} />
```

- [ ] **Step 5: Add `<ExpiryBadge>` to the checkout page**

In `src/app/[linkId]/page.tsx`, add the badge above the `<CheckoutClient>` block (only shown when link is active):

```tsx
import { ExpiryBadge } from "@/components/ExpiryBadge";

// In the JSX, before <CheckoutClient>:
{
  !isUnavailable && <ExpiryBadge expiresAt={link.expiresAt} />;
}
```

- [ ] **Step 6: Verify TypeScript + visual smoke test**

```bash
pnpm build 2>&1 | grep -E "Type error|error TS"
```

Expected: No errors.

```bash
pnpm dev
```

Open the link creation form. Expected:

- Default state: "EXPIRES" label + "SET EXPIRY" button + preset tab bar showing **15 MIN** highlighted
- Clicking **CUSTOM** reveals the datetime input with a panel-slide animation
- Clicking **NO EXPIRY** toggle: tab bar collapses, button flips to ∞ icon, label reads "NO EXPIRY"
- Clicking **SET EXPIRY** again: tab bar slides back in, returns to 15 MIN default
- On a link checkout page with an expiry: ExpiryBadge shows live countdown
- `prefers-reduced-motion` disables all animations

- [ ] **Step 7: Commit**

```bash
git add src/components/ExpiryPicker.tsx src/components/ExpiryBadge.tsx \
        src/components/CreateLinkForm.tsx src/app/globals.css
git commit -m "feat: ExpiryPicker component with sliding tabs, custom panel, ∞ toggle + ExpiryBadge countdown"
```

---

## Task 0c: All-Chain Support

**Files:**

- Modify: `src/lib/config/network.ts`
- Modify: `src/components/shared/ChainTokenSelector.tsx`
- Delete: `src/lib/config/chain-policy.ts`

### Why this matters

The current `ChainTokenSelector` has a hard filter `['base', 'solana', 'sui']` and `network.ts` manually lists 4 chains. This is unnecessary — LI.FI's widget already handles the **sender** side for 100+ chains with zero extra code. The only gap is the **receiver** side: when creating a link, the receiver needs to pick which chain they want to receive on. That list should come from LI.FI's supported chain registry, not a hand-maintained enum.

**Key architectural decision:** Store `destinationChain` as the raw LI.FI chain ID directly in the database (e.g., `"8453"` for Base, `"42161"` for Arbitrum, `"sol"` for Solana). This means:

- No mapping table to maintain. New chains added to LI.FI automatically work.
- `lifi-widget-config.ts` just parses the stored ID and passes it through.
- The schema (`destinationChain: v.optional(v.string())`) already supports this unchanged.

- [ ] **Step 1: Update `src/lib/config/network.ts`**

Remove EVM chain definitions entirely (LI.FI SDK is the source of truth for those). Keep only the non-EVM special configs that the widget can't resolve on its own:

```ts
// src/lib/config/network.ts
// EVM chains: stored + resolved as LI.FI chain IDs (e.g. "8453", "42161").
// Non-EVM chains use LI.FI's string IDs: "sol" and "sui".
// This file only defines constants used outside the widget (e.g., Solana RPC).

export const SOLANA_NATIVE_TOKEN =
  "So11111111111111111111111111111111111111112";
export const SUI_NATIVE_TOKEN = "0x2::sui::SUI";

// These chain IDs match LI.FI's string identifiers for non-EVM chains
export const NON_EVM_CHAIN_IDS = ["sol", "sui"] as const;
export type NonEvmChainId = (typeof NON_EVM_CHAIN_IDS)[number];

/**
 * Returns the native token address for a given LI.FI chain ID.
 * All EVM chains use the zero address convention.
 * Non-EVM chains have explicit native mints.
 */
export function getNativeTokenAddress(chainId: string): string {
  if (chainId === "sol") return SOLANA_NATIVE_TOKEN;
  if (chainId === "sui") return SUI_NATIVE_TOKEN;
  return "0x0000000000000000000000000000000000000000"; // All EVM chains
}

/**
 * Parse a stored destinationChain value into what LI.FI widget expects.
 * EVM: stored as numeric string "8453" → widget wants number 8453
 * Non-EVM: stored as "sol" / "sui" → widget wants it as-is
 */
export function parseChainIdForWidget(chainId: string): number | string {
  const n = Number(chainId);
  return isNaN(n) ? chainId : n;
}
```

- [ ] **Step 2: Rewrite `src/components/shared/ChainTokenSelector.tsx`**

Replace the static list with a live fetch from LI.FI's `getChains()`. This gives all 40+ supported chains automatically. Use a searchable input so the list stays usable.

```tsx
"use client";

import { useState, useEffect } from "react";
import { getChains, createClient } from "@lifi/sdk";

// Re-use the existing LI.FI client from lifi.ts, or inline a lightweight one
const lifiClient = createClient({ integrator: "justpay" });

interface ChainInfo {
  id: string; // stored value: "8453", "42161", "sol", etc.
  name: string;
  logoURI?: string;
  chainType: string; // 'EVM' | 'SVM' | 'MVM'
}

interface Props {
  selectedChainId: string | null;
  selectedToken: string | null;
  onChainSelect: (chainId: string) => void;
  onTokenSelect: (token: string) => void;
}

export function ChainTokenSelector({
  selectedChainId,
  selectedToken,
  onChainSelect,
  onTokenSelect,
}: Props) {
  const [chains, setChains] = useState<ChainInfo[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChains(lifiClient)
      .then((result) => {
        const mapped: ChainInfo[] = result.map((c: any) => ({
          id: c.id.toString(), // store numeric IDs as strings
          name: c.name,
          logoURI: c.logoURI,
          chainType: c.chainType,
        }));
        // Sort: EVM first, then Solana/Sui, alphabetical within groups
        mapped.sort((a, b) => {
          const aEvm = a.chainType === "EVM" ? 0 : 1;
          const bEvm = b.chainType === "EVM" ? 0 : 1;
          return aEvm - bEvm || a.name.localeCompare(b.name);
        });
        setChains(mapped);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = chains.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-3 w-full">
      <label className="form-label">RECEIVE ON</label>

      <input
        type="text"
        placeholder="SEARCH CHAIN..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-field"
      />

      {loading ? (
        <div className="w-full h-10 bg-black/10 animate-pulse border-[3px] border-black" />
      ) : (
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
          {filtered.map((chain) => (
            <button
              key={chain.id}
              type="button"
              onClick={() => onChainSelect(chain.id)}
              className={`flex items-center gap-2 px-3 py-2 border-[3px] border-black text-[13px] font-black uppercase transition-all ${
                selectedChainId === chain.id
                  ? "bg-[var(--color-section-cyan)] shadow-[4px_4px_0px_0px_#000] -translate-y-[2px] translate-x-[2px]"
                  : "bg-white hover:bg-[var(--color-section-yellow)] shadow-[2px_2px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:-translate-y-[2px] hover:translate-x-[2px]"
              }`}
            >
              {chain.logoURI && (
                <img
                  src={chain.logoURI}
                  alt=""
                  className="w-4 h-4 rounded-full"
                />
              )}
              {chain.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

> **Note on token selection:** When the receiver selects a chain, token selection is now also open — the receiver can type in any token symbol or address. LI.FI's widget will validate at checkout whether a route exists. Remove the hardcoded token list from `ChainTokenSelector` and replace with a free-text token input (or leave token as optional — receiver can specify "I want USDC" by typing the symbol, and the widget resolves the address from LI.FI's token registry).

- [ ] **Step 3: Delete `src/lib/config/chain-policy.ts`**

```bash
git rm src/lib/config/chain-policy.ts
```

Verify nothing imports it:

```bash
grep -r "chain-policy" src/ --include="*.ts" --include="*.tsx"
```

Expected: no references.

- [ ] **Step 4: Update `lifi-widget-config.ts` to use direct chain IDs**

Remove the `toLifiChainId` switch table and `NATIVE_TOKEN` map. Replace with the two lean helpers from `network.ts`:

```ts
// In src/lib/web3/lifi-widget-config.ts
import {
  parseChainIdForWidget,
  getNativeTokenAddress,
} from "@/lib/config/network";

// Replace toLifiChainId(chain) calls with:
//   parseChainIdForWidget(chain)
// Replace NATIVE_TOKEN[chain] lookups with:
//   getNativeTokenAddress(chain)
```

- [ ] **Step 5: Update `CreateLinkForm.tsx` — pass chain ID directly**

The form's `chain` state was `SupportedChain` (a hardcoded string union). Update to `string | null`:

```ts
// OLD:
const [chain, setChain] = useState<SupportedChain>('base')
// NEW:
const [chain, setChain] = useState<string | null>(null)  // null = no preference

// In createLinkMutation call, destinationChain is already the LI.FI chain ID:
destiationChain: chain ?? undefined,
```

- [ ] **Step 6: Verify TypeScript + build**

```bash
pnpm build 2>&1 | grep -E "Type error|error TS"
```

Expected: No errors. If `SupportedChain` is referenced elsewhere, update those call sites to use `string`.

- [ ] **Step 7: Smoke-test chain picker in browser**

```bash
pnpm dev
```

Open link creation form. Expected:

- "RECEIVE ON" section shows a search input
- Typing "arb" shows Arbitrum; "poly" shows Polygon; "opt" shows Optimism, etc.
- Selecting any chain stores its LI.FI chain ID (e.g., `"42161"` for Arbitrum)
- On the checkout page for a link with `destinationChain: "42161"`, the widget shows Arbitrum as the locked destination

- [ ] **Step 8: Commit**

```bash
git add src/lib/config/network.ts src/components/shared/ChainTokenSelector.tsx \
        src/lib/config/chain-policy.ts src/lib/web3/lifi-widget-config.ts \
        src/components/CreateLinkForm.tsx
git commit -m "feat: all-chain support via LI.FI SDK — replace hardcoded chain list with live registry"
```

---

## Task 1: Install LI.FI Widget Packages

**Files:**

- Modify: `package.json` (via pnpm)

- [ ] **Step 1: Install core widget + EVM provider**

```bash
pnpm add @lifi/widget @lifi/widget-provider-ethereum
```

Expected: `@lifi/widget` and `@lifi/widget-provider-ethereum` appear in `package.json`. `wagmi` and `@tanstack/react-query` are peer deps already satisfied.

- [ ] **Step 2: Install Solana provider + its peer dep**

```bash
pnpm add @lifi/widget-provider-solana bs58
pnpm add -D @types/bs58
```

- [ ] **Step 3: Verify no peer dependency conflicts**

```bash
pnpm install 2>&1 | grep -E "WARN|ERR"
```

Expected: No unresolved peer dependency errors. Ignore any version range warnings.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "deps: add @lifi/widget, widget-provider-ethereum, widget-provider-solana"
```

---

## Task 2: Create Widget Config Helper

**Files:**

- Create: `src/lib/web3/lifi-widget-config.ts`

This file owns all the logic for translating our internal chain/token representation into LI.FI Widget config. Keeping it isolated means `CheckoutClient` stays clean and the config is testable.

- [ ] **Step 1: Create the helper file**

```ts
// src/lib/web3/lifi-widget-config.ts
import type { WidgetConfig } from "@lifi/widget";

/** Maps our internal chain keys to LI.FI numeric/string chain IDs */
// NOTE: toLifiChainId is no longer a switch table.
// destinationChain is now stored as the LI.FI chain ID directly
// ("8453" for Base, "42161" for Arbitrum, "sol" for Solana, etc.)
// Use parseChainIdForWidget() from @/lib/config/network instead.
export { parseChainIdForWidget as toLifiChainId } from "@/lib/config/network";

/** Native token addresses per chain */
// NOTE: NATIVE_TOKEN map is no longer needed.
// Use getNativeTokenAddress() from @/lib/config/network instead.
import { getNativeTokenAddress } from "@/lib/config/network";

export interface CheckoutWidgetOptions {
  /** Required — where the funds go */
  receiverAddress: string;
  /** Optional — if set, locks the destination chain in the widget */
  destinationChain?: string | null;
  /** Optional — if set, locks the destination token in the widget */
  destinationTokenSymbol?: string | null;
  destinationTokenAddress?: string | null;
  /** Optional — if set, pre-fills and locks the amount */
  amount?: string | null;
}

/**
 * Builds the LI.FI WidgetConfig for a payment checkout.
 *
 * If the receiver specified preferences, those fields are locked.
 * If not, the widget runs in open mode — sender picks source AND destination freely.
 */
export function buildCheckoutWidgetConfig(
  opts: CheckoutWidgetOptions,
): WidgetConfig {
  const hasChainPreference = !!opts.destinationChain;
  const hasTokenPreference = !!(
    opts.destinationTokenSymbol || opts.destinationTokenAddress
  );

  const toChainId = hasChainPreference
    ? parseChainIdForWidget(opts.destinationChain!)
    : undefined;
  const toTokenAddr = hasTokenPreference
    ? (opts.destinationTokenAddress ??
      getNativeTokenAddress(opts.destinationChain ?? ""))
    : undefined;

  const config: WidgetConfig = {
    toAddress: {
      address: opts.receiverAddress,
    },

    // Only set toChain/toToken if the receiver specified them
    ...(toChainId !== undefined ? { toChain: toChainId as any } : {}),
    ...(toTokenAddr !== undefined ? { toToken: toTokenAddr } : {}),

    // Pre-fill amount for fixed links; leave undefined for open links
    ...(opts.amount && Number(opts.amount) > 0
      ? { toAmount: opts.amount }
      : {}),

    // Lock whatever the receiver specified — don't lock what they didn't
    disableToChain: hasChainPreference,
    disableToToken: hasTokenPreference,

    // UI presentation
    variant: "compact",
    appearance: "dark",
    theme: {
      palette: {
        primary: { main: "#ffffff" },
        secondary: { main: "#a3a3a3" },
        background: { default: "transparent", paper: "#111111" },
        text: { primary: "#ffffff", secondary: "#a3a3a3" },
      },
      shape: { borderRadius: 12, borderRadiusSecondary: 8 },
      typography: { fontFamily: '"Darker Grotesque", sans-serif' },
      container: {
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        background: "transparent",
      },
    },

    // Explicitly allow all bridges and exchanges (LI.FI defaults)
    // No chain/token allowlists — let payer choose their source freely

    integrator: "justpay",
    // Revenue model: LI.FI integrator fee split.
    // Set fee: 0.005 and feeRecipient: 'YOUR_WALLET' to collect 0.5% of every
    // swap/bridge automatically. LI.FI deducts and routes it during execution.
    // Direct same-chain same-token transfers have no fee opportunity (no routing).
    fee: 0, // set to 0.005 when ready to activate fee collection
    // feeRecipient: '0xYOUR_TREASURY_WALLET',
  };

  return config;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build 2>&1 | grep -E "Type error|error TS"
```

Expected: No errors from the new file.

- [ ] **Step 3: Commit**

```bash
git add src/lib/web3/lifi-widget-config.ts
git commit -m "feat: add lifi-widget-config helper for checkout payment config"
```

---

## Task 3: Replace CheckoutClient with Widget Embed

**Files:**

- Replace: `src/app/[linkId]/CheckoutClient.tsx`

The existing file has ~170 lines of chain-select buttons, wallet-connect logic, SmartButton wiring, and error handling. All of that is replaced by the widget. The widget handles wallet connection internally. We keep the success/error display since the widget fires callbacks.

> **Note on SSR:** `@lifi/widget` uses browser APIs and must be client-side only. We use Next.js `dynamic()` with `{ ssr: false }` to avoid hydration errors.

- [ ] **Step 1: Rewrite CheckoutClient.tsx**

```tsx
"use client";

import dynamic from "next/dynamic";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { EthereumProvider } from "@lifi/widget-provider-ethereum";
import { SolanaProvider } from "@lifi/widget-provider-solana";
import { buildCheckoutWidgetConfig } from "@/lib/web3/lifi-widget-config";
import type { RouteExecutionUpdate } from "@lifi/widget";

// Dynamic import — widget requires browser APIs, must not SSR
const LiFiWidget = dynamic(
  () => import("@lifi/widget").then((m) => m.LiFiWidget),
  { ssr: false, loading: () => <WidgetSkeleton /> },
);

function WidgetSkeleton() {
  return (
    <div className="w-full h-[480px] rounded-2xl bg-white/5 animate-pulse border border-white/8" />
  );
}

interface CheckoutClientProps {
  linkId: Id<"paymentLinks">;
  receiverAddress: string;
  destinationChain?: string | null;
  destinationTokenSymbol?: string | null;
  destinationTokenAddress?: string | null;
  amount?: string | null;
}

export function CheckoutClient({
  linkId,
  receiverAddress,
  destinationChain,
  destinationTokenSymbol,
  destinationTokenAddress,
  amount,
}: CheckoutClientProps) {
  const recordTransaction = useMutation(api.transactions.recordTransaction);

  const widgetConfig = buildCheckoutWidgetConfig({
    receiverAddress,
    destinationChain,
    destinationTokenSymbol,
    destinationTokenAddress,
    amount,
  });

  // Called by the widget when a route completes (bridge/swap finishes)
  const handleRouteExecutionCompleted = async (
    update: RouteExecutionUpdate,
  ) => {
    const route = update.route;
    const firstStep = route.steps[0];
    if (!firstStep?.execution?.process?.[0]?.txHash) return;

    const sourceTxHash = firstStep.execution.process[0].txHash;
    const sourceChain = firstStep.action.fromChainId?.toString() ?? "unknown";
    const sourceToken = firstStep.action.fromToken?.address ?? undefined;
    const sourceAmount = firstStep.action.fromAmount ?? "0";
    const fromAddress = route.fromAddress ?? "";
    const lifiRouteId = route.id ?? undefined;

    try {
      await recordTransaction({
        linkId,
        payerAddress: fromAddress,
        sourceChain,
        sourceToken,
        sourceTxHash,
        sourceAmount,
        lifiRouteId,
      });
    } catch (err) {
      // Non-fatal: tx already on-chain, just log
      console.error("[justpay] Failed to record transaction to Convex:", err);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">
        Pay from any chain or token
      </p>
      <LiFiWidget
        integrator="justpay"
        config={{
          ...widgetConfig,
          providers: [EthereumProvider(), SolanaProvider()],
        }}
        onRouteExecutionCompleted={handleRouteExecutionCompleted}
      />
    </div>
  );
}
```

- [ ] **Step 2: Update page.tsx to pass new field names**

In `src/app/[linkId]/page.tsx`, update the `<CheckoutClient>` usage:

```tsx
<CheckoutClient
  linkId={link._id}
  receiverAddress={link.receiverAddress}
  destinationChain={link.destinationChain}
  destinationTokenSymbol={link.destinationTokenSymbol}
  destinationTokenAddress={link.destinationTokenAddress}
  amount={link.amount}
/>
```

- [ ] **Step 3: Verify the page compiles**

```bash
pnpm build 2>&1 | grep -E "Type error|error TS|failed"
```

Expected: No TypeScript or build errors.

- [ ] **Step 4: Smoke-test in browser**

```bash
pnpm dev
```

Open `http://localhost:3000/[any-test-link-shortcode]`. Expected:

- Widget skeleton shows briefly while loading
- LI.FI Widget renders showing token/chain picker for payer
- Destination chain + token fields are locked (not editable)
- Connecting an EVM or Solana wallet works

- [ ] **Step 5: Commit**

```bash
git add src/app/[linkId]/CheckoutClient.tsx src/app/[linkId]/page.tsx
git commit -m "feat: replace CheckoutClient with @lifi/widget embed for cross-chain payments"
```

---

## Task 4: Add Open Graph Metadata to Payment Page

**Files:**

- Modify: `src/app/[linkId]/page.tsx`

When a payment link is shared on Telegram/Twitter/iMessage, the preview should show the merchant address, amount, and token — not a blank card. This requires a server component that generates metadata.

The current `page.tsx` is `'use client'` because it uses `useQuery`. To support `generateMetadata` (which must run on the server), split the page into:

- `page.tsx` — Server Component, fetches link via `fetchQuery` from `convex/nextjs`, exports `generateMetadata`, renders shell + passes props to client component
- `CheckoutClient.tsx` — stays as the client boundary (already `'use client'`)

> **Prerequisite:** Check if `convex/nextjs` is available. Run: `node -e "require('convex/nextjs')"`. If it throws, use a fallback metadata (static title with no link data).

- [ ] **Step 1: Convert page.tsx to a Server Component with metadata**

Replace `src/app/[linkId]/page.tsx` with:

```tsx
// No 'use client' — this is a Server Component
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { PaymentCard } from "@/components/PaymentCard";
import { CheckoutClient } from "./CheckoutClient";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ linkId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { linkId } = await params;
  try {
    const link = await fetchQuery(api.links.getLinkByShortCode, {
      shortCode: linkId,
    });
    if (!link) return { title: "Payment Link — justpay.wtf" };

    const tokenPart = link.destinationTokenSymbol ?? "crypto";
    const chainPart = link.destinationChain
      ? ` on ${link.destinationChain}`
      : "";
    const amountLabel = link.amount ? `${link.amount} ${tokenPart}` : tokenPart;
    const shortAddr = link.receiverAddress.slice(0, 8) + "…";
    return {
      title: `Pay ${amountLabel}${chainPart} — justpay.wtf`,
      description: link.note ?? `Send ${amountLabel} to ${shortAddr}`,
      openGraph: {
        title: `Pay ${amountLabel}`,
        description: link.note ?? `Cross-chain payment powered by justpay.wtf`,
        siteName: "justpay.wtf",
      },
    };
  } catch {
    return { title: "Payment Link — justpay.wtf" };
  }
}

export default async function PaymentPage({ params }: Props) {
  const { linkId } = await params;
  // Server-side fetch for the initial render (avoids loading flash for SSR)
  const link = await fetchQuery(api.links.getLinkByShortCode, {
    shortCode: linkId,
  });

  if (!link) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-bold text-black uppercase">
          Payment link not found.
        </p>
      </main>
    );
  }

  const isExpired = link.expiresAt ? link.expiresAt < Date.now() : false;
  const isUnavailable = isExpired || link.status === "cancelled";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 flex flex-col gap-6">
        <PaymentCard
          amount={Number(link.amount) || 0}
          tokenSymbol={link.destinationTokenSymbol ?? "any token"}
          recipientAddress={link.receiverAddress}
          memo={link.note}
        />

        <div className="glass-card p-6 w-full">
          {isUnavailable ? (
            <div className="flex flex-col items-center justify-center text-center gap-4 py-6 border border-error/20 bg-error/5 rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-error/20 flex items-center justify-center mb-2">
                <div className="w-6 h-6 rounded-full bg-error flex items-center justify-center text-white font-bold text-lg">
                  !
                </div>
              </div>
              <h2 className="text-xl font-bold text-error">
                Payment Unavailable
              </h2>
              <p className="text-zinc-400 text-sm max-w-xs">
                {isExpired
                  ? "This payment link has expired."
                  : "This payment link was deactivated by the creator."}
              </p>
            </div>
          ) : (
            <CheckoutClient
              linkId={link._id}
              receiverAddress={link.receiverAddress}
              destinationChain={link.destinationChain}
              destinationTokenSymbol={link.destinationTokenSymbol}
              destinationTokenAddress={link.destinationTokenAddress}
              amount={link.amount}
            />
          )}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
pnpm build 2>&1 | grep -E "Type error|error TS|failed|Error"
```

Expected: Builds cleanly. If `fetchQuery` from `convex/nextjs` throws a module-not-found error, revert page.tsx to the original client-component version (the `generateMetadata` is a nice-to-have, not blocking).

- [ ] **Step 3: Commit**

```bash
git add src/app/[linkId]/page.tsx
git commit -m "feat: add OG metadata to payment page, convert to RSC with fetchQuery"
```

---

## Task 5: Clean Up Env Variables

**Files:**

- Modify: `.env`
- Modify: `.env.example` (if it exists — check with `ls .env*`)

The `NEXT_PUBLIC_0X_API_KEY` key is no longer needed — the LI.FI Widget handles all routing internally. `MERCHANT_API_KEY` is a Phase 4 feature (API access for premium merchants) and has no implementation yet — remove it to avoid confusion.

- [ ] **Step 1: Check for env references**

```bash
grep -r "0X_API_KEY\|MERCHANT_API_KEY" src/ --include="*.ts" --include="*.tsx"
```

Expected: No references found. If any exist, update them before removing the keys.

- [ ] **Step 2: Update .env with correct documented keys**

Replace `.env` content with:

```dotenv
# Convex — backend database and functions
NEXT_PUBLIC_CONVEX_URL=https://dependable-beagle-477.convex.cloud/

# Web3 RPC (Server-side only — never expose to client)
# Used for Solana transaction verification when reading on-chain state
HELIUS_RPC=https://mainnet.helius-rpc.com/?api-key=your_api_key
# Note: ALCHEMY_BASE_RPC removed — not Base-specific anymore.
# If EVM RPC access is needed later, add a generic EVM_RPC or per-chain keys.
```

> Note: `NEXT_PUBLIC_0X_API_KEY` removed (routing now handled by @lifi/widget).  
> Note: `MERCHANT_API_KEY` removed (Phase 4 premium API — add back when implementing).

- [ ] **Step 3: Verify app still starts**

```bash
pnpm dev 2>&1 | head -20
```

Expected: App starts, no "missing env var" errors.

- [ ] **Step 4: Commit**

```bash
git add .env
git commit -m "chore: remove unused env keys (0x API, merchant API key)"
```

---

## What the Widget Replaces (Reference)

| Old code                                      | Widget equivalent                                                              |
| --------------------------------------------- | ------------------------------------------------------------------------------ |
| Chain selector buttons (EVM/Solana/Sui)       | Built into widget's from-chain selector                                        |
| `<WalletConnectButton>` per ecosystem         | Widget manages wallet connection internally                                    |
| `<ConnectButton>` from @mysten/dapp-kit       | Not needed for checkout (widget handles Solana; Sui provider added in Phase 2) |
| `SmartButton` + `fetchLifiQuote()`            | Widget handles quote fetch + route execution                                   |
| Error states (slippage, reverted, etc.)       | Widget shows inline route errors                                               |
| `getChainConfig()` + `getInputTokenAddress()` | Widget handles source token selection                                          |

## Checkout Behavior by Link Configuration

| Receiver set...        | Widget behavior                                                                   |
| ---------------------- | --------------------------------------------------------------------------------- |
| Nothing (bare link)    | Fully open — sender picks source chain, source token, AND destination chain+token |
| Chain only             | Destination chain locked, sender picks any token on that chain                    |
| Chain + token          | Destination chain and token locked, sender picks source freely                    |
| Chain + token + amount | Everything locked, sender just approves and signs                                 |

This is what makes justpay.wtf a genuine "wallet address extension" — a bare link is just a way to receive _anything_, while a configured link is a structured payment request.

## Scope Notes

**Sui payer support in Phase 1:** The LI.FI Widget's Sui provider requires `@mysten/dapp-kit-react` which conflicts with the project's existing `@mysten/dapp-kit` installation. Defer Sui as a payer ecosystem to Phase 2. Phase 1 covers EVM + Solana payers, which covers the majority of real users.

**Direct same-chain payments:** The widget handles same-chain swaps natively (e.g., sender has USDT on Arbitrum, receiver wants USDC on Arbitrum — widget swaps inline). No special case needed. Works for all 40+ LI.FI-supported chains.

**Non-custodial by design:** Funds flow directly from sender → receiver wallet via LI.FI's routing. justpay.wtf never holds funds at any point. No escrow contracts. No custodial risk. This is the permanent architecture — not a temporary Phase 1 compromise.

**Revenue without custody:** LI.FI's integrator fee system lets you collect a percentage of every swap/bridge by setting `fee` + `feeRecipient` in the widget config. No contract deployment needed. To activate: set `fee: 0.005` and `feeRecipient` to a treasury wallet address in `buildCheckoutWidgetConfig`. Test on a small fee (0.1%) first to verify the split works as expected.

**Scale note:** Convex B-tree index on `by_shortCode` handles billions of links with sub-millisecond lookup latency. The shortCode collision retry loop (5 attempts) makes the mutation safe under high write concurrency. No caching layer needed — Convex query subscriptions serve repeat visitors from in-memory cache.
