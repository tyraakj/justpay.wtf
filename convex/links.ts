import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function generateShortCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function computeLinkIdHash(shortCode: string): string {
  // Simple hash for on-chain reference - will be replaced with proper crypto hash when we add smart contracts
  let hash = 0;
  for (let i = 0; i < shortCode.length; i++) {
    const char = shortCode.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return "0x" + Math.abs(hash).toString(16).padStart(64, "0");
}

export const createLink = mutation({
  args: {
    merchantAddress: v.string(),
    destinationChain: v.string(),
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
