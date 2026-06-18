'use client';

import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { FeeDisclosureBanner } from './shared/FeeDisclosureBanner';
import { ChainTokenSelector, SupportedChain } from './shared/ChainTokenSelector';
import { motion, AnimatePresence } from 'framer-motion';

export function CreateLinkForm() {
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState<SupportedChain>('base');
  const [amount, setAmount] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('USDC');
  const [email, setEmail] = useState('');
  const [memo, setMemo] = useState('');
  const [expiry, setExpiry] = useState('15m');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const router = useRouter();

  const { address: evmAddress } = useAccount();
  const { publicKey } = useWallet();
  const suiAccount = useCurrentAccount();
  const connectedAddress = evmAddress || publicKey?.toBase58() || suiAccount?.address;
  const createLinkMutation = useMutation(api.links.createLink);

  useEffect(() => {
    if (connectedAddress) {
      if (!address) {
        setAddress(connectedAddress);
      }
      const savedExpiry = localStorage.getItem(`justpay_expiry_${connectedAddress}`);
      if (savedExpiry) {
        setExpiry(savedExpiry);
      }
    }
  }, [connectedAddress]);

  const handleCreate = async () => {
    // If not connected and no manual address, prevent create
    const finalAddress = address || connectedAddress;
    if (!finalAddress || !amount) return;
    setIsLoading(true);

    try {
      let expiresAt: number | undefined;
      const now = Date.now();
      if (expiry === '15m') expiresAt = now + 15 * 60 * 1000;
      else if (expiry === '1h') expiresAt = now + 60 * 60 * 1000;
      else if (expiry === '24h') expiresAt = now + 24 * 60 * 60 * 1000;
      else if (expiry === '7d') expiresAt = now + 7 * 24 * 60 * 60 * 1000;
      else if (expiry === 'none') expiresAt = undefined;

      const result = await createLinkMutation({
        merchantAddress: finalAddress,
        destinationChain: chain,
        destinationTokenSymbol: tokenSymbol,
        destinationTokenAddress: chain === 'sui' || chain === 'suiTestnet' ? '0x2::sui::SUI' : undefined,
        amount,
        merchantEmail: email || undefined,
        memo: memo || undefined,
        label: 'justpay.wtf Payment',
        expiresAt,
        linkType: 'invoice',
      });

      // Save to localStorage LRU
      const existingStr = localStorage.getItem('justpay_links');
      let links = existingStr ? JSON.parse(existingStr) : [];
      links.unshift({ shortCode: result.shortCode, createdAt: new Date().toISOString() });
      if (links.length > 5) links = links.slice(0, 5);
      localStorage.setItem('justpay_links', JSON.stringify(links));

      // Redirect to payment page
      router.push(`/${result.shortCode}`);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to create link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <FeeDisclosureBanner chain={chain} />

      {/* Main Widget Box */}
      <div className="bg-white border-4 border-black p-4 shadow-[8px_8px_0_0_#000] flex flex-col gap-4 relative z-10 transition-transform hover:-translate-y-1 hover:shadow-[12px_12px_0_0_#000]">

        {/* Token & Network Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-black uppercase tracking-wider text-black bg-[var(--color-section-cyan)] px-2 py-1 inline-block w-max border-2 border-black -mb-3 relative z-10 ml-2">Network & Asset</label>
          <div className="bg-white border-[3px] border-black p-3 pt-4">
            <ChainTokenSelector
              selectedChain={chain}
              selectedToken={tokenSymbol}
              onChainSelect={setChain as any}
              onTokenSelect={setTokenSymbol}
            />
          </div>
        </div>

        {/* Amount Input */}
        <div className="flex flex-col gap-2 relative group">
          <label className="text-[12px] font-black uppercase tracking-wider text-black bg-[var(--color-section-pink)] px-2 py-1 inline-block w-max border-2 border-black -mb-3 relative z-10 ml-2 transition-transform group-focus-within:-translate-y-1">Amount to Request</label>
          <div className="bg-white border-[3px] border-black flex items-center p-2 focus-within:bg-[var(--color-brand-softer)] transition-colors">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="w-full bg-transparent px-2 py-3 text-[32px] md:text-[40px] font-black text-black placeholder:text-black/20 outline-none"
            />
            <span className="text-2xl font-black pr-4">{tokenSymbol}</span>
          </div>
        </div>

        {/* Destination Address Input */}
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-black uppercase tracking-wider text-black bg-[var(--color-section-yellow)] px-2 py-1 inline-block w-max border-2 border-black -mb-3 relative z-10 ml-2">Receive to Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={connectedAddress ? `Connected: ${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}` : (chain === 'base' ? "0x... (EVM)" : chain === 'sui' ? "0x... (64 hex chars)" : "Solana address")}
            className="w-full bg-white border-[3px] border-black px-4 py-4 text-[16px] font-bold text-black placeholder:text-black/40 outline-none focus:bg-[var(--color-section-yellow)] transition-colors"
          />
        </div>

        {/* Advanced Options Toggle */}
        <button
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="text-[12px] font-bold uppercase tracking-wider text-zinc-600 hover:text-black bg-transparent border-t-2 border-dashed border-black/30 hover:border-black/100 pt-3 pb-2 mt-2 transition-all w-full text-center"
        >
          {isAdvancedOpen ? "- Hide Advanced Options" : "+ Show Advanced Options"}
        </button>

        <AnimatePresence>
          {isAdvancedOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
              animate={{ height: 'auto', opacity: 1, overflow: 'visible' }}
              exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-4 border-[3px] border-black border-dashed p-3 mt-2"
            >
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-black uppercase tracking-wider text-black">Memo (Optional)</label>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="Invoice #123, Coffee, etc."
                  className="w-full border-2 border-black bg-white px-3 py-2 text-sm font-bold text-black placeholder:text-black/40 outline-none focus:bg-[var(--color-section-yellow)] transition-colors"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-[12px] font-black uppercase tracking-wider text-black">Email (Receipts)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full border-2 border-black bg-white px-3 py-2 text-sm font-bold text-black placeholder:text-black/40 outline-none focus:bg-[var(--color-section-cyan)] transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1 w-28">
                  <label className="text-[12px] font-black uppercase tracking-wider text-black">Expiry</label>
                  <select
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full border-2 border-black bg-white px-2 py-2 text-sm font-bold text-black outline-none cursor-pointer focus:bg-[var(--color-section-green)] transition-colors"
                  >
                    <option value="15m">15 Mins</option>
                    <option value="1h">1 Hour</option>
                    <option value="24h">24 Hrs</option>
                    <option value="7d">7 Days</option>
                    <option value="none">Never</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleCreate}
          disabled={isLoading || (!address && !connectedAddress) || !amount}
          className="w-full mt-4 flex items-center justify-center gap-2 border-[4px] border-black bg-black px-6 py-4 text-[22px] font-black uppercase text-white shadow-[6px_6px_0px_0px_var(--color-section-yellow)] hover:shadow-[10px_10px_0px_0px_var(--color-section-yellow)] hover:-translate-y-1 hover:translate-x-1 active:translate-y-0 active:translate-x-0 active:shadow-[0px_0px_0px_0px_var(--color-section-yellow)] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isLoading ? 'Creating...' : 'Create Payment Link'}
          {!isLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={3} />}
        </button>
      </div>
    </div>
  );
}
