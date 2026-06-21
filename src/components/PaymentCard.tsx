'use client';

import { Copy, Check } from "lucide-react";
import { useState } from "react";

const CHAIN_NAMES: Record<string, string> = {
  '1': 'Ethereum', '56': 'BNB Chain', '137': 'Polygon', '42161': 'Arbitrum',
  '10': 'Optimism', '8453': 'Base', '43114': 'Avalanche', '250': 'Fantom',
  '100': 'Gnosis', 'sol': 'Solana', 'sui': 'Sui',
}

const CHAIN_NATIVE: Record<string, string> = {
  '1': 'ETH', '56': 'BNB', '137': 'MATIC', '42161': 'ETH', '10': 'ETH',
  '8453': 'ETH', '43114': 'AVAX', '250': 'FTM', '100': 'xDAI', 'sol': 'SOL', 'sui': 'SUI',
}

function tokenLogoUrl(symbol: string) {
  return `https://img.logo.dev/crypto/${symbol.toLowerCase()}?token=pk_BShsdiwDTuyRVVBW5GadOg`
}

interface PaymentCardProps {
  amount: number;
  tokenSymbol: string;
  destinationChain?: string | null;
  fiatValue?: number;
  recipientAddress: string;
  memo?: string;
}

export function PaymentCard({ amount, tokenSymbol, destinationChain, fiatValue, recipientAddress, memo }: PaymentCardProps) {
  const shortAddress = `${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`;
  const [copied, setCopied] = useState(false);

  const chainName = destinationChain ? CHAIN_NAMES[destinationChain] || `Chain ${destinationChain}` : null;
  const chainNative = destinationChain ? CHAIN_NATIVE[destinationChain] : null;
  const displayToken = tokenSymbol === 'any token' ? (chainNative || 'ANY') : tokenSymbol;
  const hasSpecificToken = tokenSymbol !== 'any token';

  const handleCopy = () => {
    navigator.clipboard.writeText(recipientAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full border-4 border-black bg-[var(--color-section-yellow)] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
      {/* Header */}
      <div className="bg-black px-4 py-2 flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-widest text-[var(--color-section-yellow)]">Payment Request</span>
        <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">justpay.wtf</span>
      </div>

      {/* Amount + Token */}
      <div className="flex flex-col items-center justify-center py-6 px-6 border-b-4 border-black">
        <span className="text-[11px] font-black uppercase tracking-widest text-black/50 mb-3">You are paying</span>

        <div className="flex items-center gap-3 mb-2">
          <img
            src={tokenLogoUrl(displayToken)}
            alt={displayToken}
            className="w-10 h-10 object-contain border-2 border-black bg-white"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div className="flex items-baseline gap-2">
            <span className="text-[48px] font-black leading-none text-black tracking-tighter">
              {amount > 0 ? amount : 'Open'}
            </span>
            <span className="text-[24px] font-black uppercase text-black">{displayToken}</span>
          </div>
        </div>

        {chainName && (
          <div className="flex items-center gap-2 mt-1">
            <img
              src={tokenLogoUrl(chainNative || displayToken)}
              alt={chainName}
              className="w-4 h-4 object-contain rounded-full"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <span className="text-[12px] font-bold text-black/50 uppercase tracking-wider">on {chainName}</span>
          </div>
        )}

        {!amount && hasSpecificToken && (
          <span className="text-[12px] font-bold text-black/40 mt-1">Sender chooses amount</span>
        )}

        {fiatValue && (
          <span className="text-[14px] font-bold text-black/50 mt-2">≈ ${fiatValue.toFixed(2)} USD</span>
        )}
      </div>

      {/* Recipient — highlighted */}
      <div className="px-4 py-4 flex flex-col gap-2 bg-black">
        <span className="text-[11px] font-black uppercase tracking-widest text-white/40">Sending to</span>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--color-section-cyan)] border-2 border-white/20 flex items-center justify-center flex-shrink-0">
            <span className="font-black text-[14px] text-black">{recipientAddress.slice(2, 4).toUpperCase()}</span>
          </div>
          <span className="font-mono font-bold text-[16px] text-white tracking-wide flex-1 truncate">{shortAddress}</span>
          <button
            onClick={handleCopy}
            className="bg-[var(--color-section-cyan)] border-2 border-black p-1.5 hover:bg-[var(--color-section-pink)] transition-colors flex-shrink-0"
            title="Copy full address"
          >
            {copied ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4 text-black" />}
          </button>
        </div>
      </div>

      {/* Memo */}
      {memo && (
        <div className="px-4 py-3 bg-[var(--color-section-pink)]">
          <span className="text-[11px] font-black uppercase tracking-widest text-black/50 block mb-1">Note</span>
          <span className="text-[14px] font-bold text-black">{memo}</span>
        </div>
      )}
    </div>
  );
}
