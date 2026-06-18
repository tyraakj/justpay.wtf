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
    const links = await ctx.db
      .query("paymentLinks")
      .withIndex("by_merchant", (q) => q.eq("merchantAddress", args.merchantAddress))
      .collect();

    const allTxs = [];
    for (const link of links) {
      const txs = await ctx.db
        .query("transactions")
        .withIndex("by_link", (q) => q.eq("linkId", link._id))
        .collect();
      allTxs.push(...txs);
    }

    return allTxs.sort((a, b) => b._creationTime - a._creationTime);
  },
});
