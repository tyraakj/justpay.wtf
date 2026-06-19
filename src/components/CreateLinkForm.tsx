'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Wallet, ClipboardPaste } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { WalletConnectButton } from './shared/WalletConnectButton';
import { ChainTokenSelector } from './shared/ChainTokenSelector';
import { ExpiryPicker, ExpiryValue, expiryValueToTimestamp } from './ExpiryPicker';
import { motion, AnimatePresence } from 'framer-motion';

const TOKEN_DOMAINS: Record<string, string> = {
  'ETH': 'ethereum.org',
  'USDC': 'circle.com',
  'USDT': 'tether.to',
  'SOL': 'solana.com',
  'SUI': 'sui.io'
};

export function CreateLinkForm() {
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [memo, setMemo] = useState('');
  const [expiry, setExpiry] = useState<ExpiryValue>({ type: 'never' });
  const [isLoading, setIsLoading] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const router = useRouter();

  const { address: evmAddress, chainId: evmChainId } = useAccount();
  const { publicKey } = useWallet();
  const suiAccount = useCurrentAccount();
  const connectedAddress = evmAddress || publicKey?.toBase58() || suiAccount?.address;
  const createLinkMutation = useMutation(api.links.createLink);

  useEffect(() => {
    if (evmAddress && evmChainId) {
      // Auto-fill address AND the specific EVM chain the wallet is currently on
      if (!address) setAddress(evmAddress);
      if (!chain) setChain(evmChainId.toString());
    } else if (publicKey) {
      if (!address) setAddress(publicKey.toBase58());
      if (!chain) setChain('sol');
    } else if (suiAccount?.address) {
      if (!address) setAddress(suiAccount.address);
      if (!chain) setChain('sui');
    }
  }, [evmAddress, evmChainId, publicKey, suiAccount?.address]);

  const handleCreate = async () => {
    const finalAddress = address || connectedAddress;
    if (!finalAddress) return;
    setIsLoading(true);

    try {
      const expiresAt = expiryValueToTimestamp(expiry)

      const result = await createLinkMutation({
        receiverAddress: finalAddress,
        destinationChain: chain ?? undefined,
        destinationTokenSymbol: tokenSymbol ?? undefined,
        destinationTokenAddress: undefined,
        amount: amount ? amount : undefined,
        receiverEmail: email || undefined,
        note: memo || undefined,
        expiresAt,
      });

      const existingStr = localStorage.getItem('justpay_links');
      let links = existingStr ? JSON.parse(existingStr) : [];
      links.unshift({ shortCode: result.shortCode, createdAt: new Date().toISOString() });
      if (links.length > 5) links = links.slice(0, 5);
      localStorage.setItem('justpay_links', JSON.stringify(links));

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
      {/* Main Widget Box */}
      <div className="flex flex-col gap-4 relative z-10 transition-transform">

        {/* Destination Address Input (Top Priority) */}
        <div className="flex flex-col gap-2 relative">
          <label className="text-[12px] font-black uppercase tracking-wider text-black bg-[var(--color-section-yellow)] px-2 py-1 inline-block w-max border-2 border-black -mb-3 relative z-10 ml-2">Receive to Address</label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={connectedAddress ? `Connected: ${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}` : (chain === 'sui' ? "0x... (64 hex chars)" : chain === 'sol' ? "Solana address" : "Wallet address")}
              className="w-full bg-white border-[3px] border-black px-4 py-4 pr-32 text-[16px] font-bold text-black placeholder:text-black/40 outline-none focus:bg-[var(--color-brand-softer)] transition-colors"
            />
            <div className="absolute right-3 flex items-center gap-2">
              <span className="t-tt-wrap">
                <button
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) setAddress(text.trim());
                    } catch (err) {
                      console.error('Failed to read clipboard', err);
                    }
                  }}
                  className="bg-[var(--color-section-yellow)] border-2 border-black p-2 hover:bg-[var(--color-section-pink)] transition-colors group hidden md:block t-tt-trigger"
                >
                  <ClipboardPaste className="w-5 h-5 text-black group-hover:scale-110 transition-transform" />
                </button>
                <span className="t-tt bg-[var(--color-section-yellow)]" role="tooltip">Paste Address</span>
              </span>

              {connectedAddress && !address ? (
                <span className="t-tt-wrap">
                  <button
                    onClick={() => setAddress(connectedAddress)}
                    className="bg-[var(--color-section-cyan)] border-2 border-black p-2 hover:bg-[var(--color-section-green)] transition-colors group hidden md:block t-tt-trigger"
                  >
                    <Wallet className="w-5 h-5 text-black group-hover:scale-110 transition-transform" />
                  </button>
                  <span className="t-tt bg-[var(--color-section-cyan)]" role="tooltip">Autofill Wallet</span>
                </span>
              ) : (
                <span className="t-tt-wrap">
                  <WalletConnectButton variant="input" />
                  <span className="t-tt" role="tooltip">{connectedAddress ? "Disconnect Wallet" : "Connect Wallet"}</span>
                </span>
              )}
            </div>
          </div>
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
              {/* Token & Network Selection */}
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-[12px] font-black uppercase tracking-wider text-black bg-[var(--color-section-cyan)] px-2 py-1 inline-block w-max border-2 border-black -mb-3 relative z-10 ml-2">Network & Asset</label>
                <div className="bg-white border-[3px] border-black p-3 pt-4 hover:bg-slate-50 transition-colors">
                  <ChainTokenSelector
                    selectedChainId={chain}
                    selectedToken={tokenSymbol}
                    onChainSelect={setChain}
                    onTokenSelect={setTokenSymbol}
                  />
                </div>
              </div>

              {/* Amount Input */}
              <div className="flex flex-col gap-2 relative group mt-2">
                <label className="text-[12px] font-black uppercase tracking-wider text-black bg-[var(--color-section-pink)] px-2 py-1 inline-block w-max border-2 border-black -mb-3 relative z-10 ml-2 transition-transform group-focus-within:-translate-y-1">Amount to Request</label>
                <div className="bg-white border-[3px] border-black flex items-center p-2 focus-within:bg-[var(--color-brand-softer)] transition-colors">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-transparent px-2 py-3 text-[32px] md:text-[40px] font-black text-black placeholder:text-black/20 outline-none"
                  />
                  <div className="flex items-center gap-2 pr-4 bg-white px-3 py-2 border-2 border-black">
                    {tokenSymbol && TOKEN_DOMAINS[tokenSymbol] && (
                      <img src={`https://img.logo.dev/${TOKEN_DOMAINS[tokenSymbol]}?token=pk_BShsdiwDTuyRVVBW5GadOg&bg=transparent`} alt={tokenSymbol} className="w-6 h-6 object-contain bg-transparent" />
                    )}
                    <span className="text-xl font-black">{tokenSymbol ?? 'ANY'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1 mt-2">
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
              </div>

              <ExpiryPicker value={expiry} onChange={setExpiry} />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleCreate}
          disabled={isLoading || (!address && !connectedAddress)}
          className="w-full mt-4 flex items-center justify-center gap-2 border-[4px] border-black bg-black px-6 py-4 text-[22px] font-black uppercase text-white shadow-[6px_6px_0px_0px_var(--color-section-yellow)] hover:shadow-[10px_10px_0px_0px_var(--color-section-yellow)] hover:-translate-y-1 hover:translate-x-1 active:translate-y-0 active:translate-x-0 active:shadow-[0px_0px_0px_0px_var(--color-section-yellow)] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isLoading ? 'Creating...' : 'Create Payment Link'}
          {!isLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={3} />}
        </button>
      </div>
    </div>
  );
}
