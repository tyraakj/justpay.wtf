'use client';

import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface PaymentCardProps {
  amount: number;
  tokenSymbol: string;
  fiatValue?: number;
  recipientAddress: string;
  memo?: string;
}

export function PaymentCard({ amount, tokenSymbol, fiatValue, recipientAddress, memo }: PaymentCardProps) {
  const shortAddress = `${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(recipientAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full border-4 border-black bg-[var(--color-section-yellow)] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
      {/* Header tag */}
      <div className="bg-black px-4 py-2 flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-widest text-[var(--color-section-yellow)]">Payment Request</span>
        <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">justpay.wtf</span>
      </div>

      {/* Amount */}
      <div className="flex flex-col items-center justify-center py-8 px-6 border-b-4 border-black">
        <span className="text-[11px] font-black uppercase tracking-widest text-black/50 mb-2">You are paying</span>
        <div className="flex items-baseline gap-3">
          <span className="text-[64px] font-black leading-none text-black tracking-tighter">
            {amount > 0 ? amount : "ANY"}
          </span>
          {amount > 0 && (
            <span className="text-[28px] font-black uppercase text-black">{tokenSymbol}</span>
          )}
        </div>
        {amount === 0 && (
          <span className="text-[20px] font-black uppercase text-black mt-1">{tokenSymbol}</span>
        )}
        {fiatValue && (
          <span className="text-[14px] font-bold text-black/50 mt-2">≈ ${fiatValue.toFixed(2)} USD</span>
        )}
      </div>

      {/* Recipient */}
      <div className="px-4 py-3 flex items-center justify-between border-b-4 border-black bg-white">
        <span className="text-[11px] font-black uppercase tracking-widest text-black/50">To</span>
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-[14px] text-black">{shortAddress}</span>
          <button
            onClick={handleCopy}
            className="bg-[var(--color-section-cyan)] border-2 border-black p-1 hover:bg-[var(--color-section-pink)] transition-colors"
            title="Copy full address"
          >
            {copied ? <Check className="w-3 h-3 text-black" /> : <Copy className="w-3 h-3 text-black" />}
          </button>
        </div>
      </div>

      {/* Memo */}
      {memo && (
        <div className="px-4 py-3 bg-[var(--color-section-pink)] border-b-4 border-black">
          <span className="text-[11px] font-black uppercase tracking-widest text-black/50 block mb-1">Note</span>
          <span className="text-[14px] font-bold text-black">{memo}</span>
        </div>
      )}
    </div>
  );
}
