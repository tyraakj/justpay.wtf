'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Copy, Link2, Plus } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

const CHAINS = [
  { id: 'base', label: 'Base', color: 'var(--color-section-blue, #3B82F6)' },
  { id: 'solana', label: 'Solana', color: 'var(--color-section-green)' },
  { id: 'sui', label: 'Sui', color: 'var(--color-section-cyan)' },
] as const;

const TOKENS: Record<string, string[]> = {
  base: ['USDC', 'ETH'],
  solana: ['USDC', 'SOL'],
  sui: ['USDC', 'SUI'],
};

export function HeroPaymentWidget() {
  const [chain, setChain] = useState('base');
  const [token, setToken] = useState('USDC');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [showMemo, setShowMemo] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [resultCode, setResultCode] = useState('');
  const [copied, setCopied] = useState(false);

  const createLink = useMutation(api.links.createLink);

  // Auto-fill from connected wallets
  const { address: evmAddress } = useAccount();
  const { publicKey: solanaKey } = useWallet();
  const suiAccount = useCurrentAccount();

  useEffect(() => {
    if (address) return; // Don't overwrite manual input
    if (chain === 'base' && evmAddress) setAddress(evmAddress);
    else if (chain === 'solana' && solanaKey) setAddress(solanaKey.toBase58());
    else if (chain === 'sui' && suiAccount?.address) setAddress(suiAccount.address);
  }, [chain, evmAddress, solanaKey, suiAccount, address]);

  // Reset token when chain changes
  useEffect(() => {
    setToken('USDC');
  }, [chain]);

  const handleCreate = async () => {
    if (!address) return;
    setStatus('loading');
    try {
      const result = await createLink({
        merchantAddress: address,
        destinationChain: chain,
        destinationTokenSymbol: token,
        amount: amount || undefined,
        memo: memo || undefined,
      });
      setResultCode(result.shortCode);
      setStatus('success');
    } catch {
      setStatus('idle');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/${resultCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setStatus('idle');
    setResultCode('');
    setAmount('');
    setMemo('');
    setShowMemo(false);
  };

  const chainIndex = CHAINS.findIndex(c => c.id === chain);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-[400px] bg-white border-4 border-black p-0 relative"
      style={{ boxShadow: '8px 8px 0px 0px #000' }}
    >
      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 flex flex-col items-center gap-4"
          >
            {/* Checkmark */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
              className="w-16 h-16 bg-[var(--color-section-green)] border-4 border-black flex items-center justify-center"
            >
              <Check className="w-8 h-8 text-black" strokeWidth={4} />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="font-black text-lg uppercase tracking-wider text-black"
            >
              Link Created
            </motion.p>

            {/* Link display */}
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full border-4 border-black p-3 flex items-center gap-2 bg-[var(--color-neutral-tertiary-medium,#f5f5f5)]"
            >
              <Link2 className="w-4 h-4 text-black shrink-0" strokeWidth={3} />
              <span className="font-bold text-sm text-black truncate flex-1">
                justpay.wtf/{resultCode}
              </span>
              <button
                onClick={handleCopy}
                className="shrink-0 bg-black text-white p-1.5 hover:bg-gray-800 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="w-full flex gap-3 mt-2"
            >
              <a
                href={`/${resultCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-black text-white font-bold text-sm uppercase tracking-wider py-3 text-center border-4 border-black hover:translate-y-[-2px] transition-transform"
                style={{ boxShadow: '4px 4px 0px 0px #000' }}
              >
                View Link
              </a>
              <button
                onClick={handleReset}
                className="flex-1 bg-white text-black font-bold text-sm uppercase tracking-wider py-3 text-center border-4 border-black hover:translate-y-[-2px] transition-transform"
                style={{ boxShadow: '4px 4px 0px 0px #000' }}
              >
                Create Another
              </button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Header */}
            <div className="border-b-4 border-black px-5 py-4">
              <h3 className="font-black text-[18px] uppercase tracking-wider text-black m-0">
                Create Payment Link
              </h3>
              <p className="text-[11px] font-bold text-black/50 uppercase tracking-widest mt-0.5">
                No signup required
              </p>
            </div>

            <div className="p-5 space-y-4">
              {/* Chain pills */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-1.5 block">
                  Network
                </label>
                <div className="relative flex border-4 border-black bg-[var(--color-neutral-tertiary-medium,#f5f5f5)] p-1">
                  <motion.div
                    className="absolute top-1 bottom-1 bg-black"
                    style={{ width: `calc(${100 / CHAINS.length}% - 4px)` }}
                    animate={{ left: `calc(${chainIndex * (100 / CHAINS.length)}% + 2px)` }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    layoutId="activeChain"
                  />
                  {CHAINS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setChain(c.id)}
                      className={`relative z-10 flex-1 py-2 text-[12px] font-black uppercase tracking-wider transition-colors ${
                        chain === c.id ? 'text-white' : 'text-black'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Token pills */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <label className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-1.5 block">
                  Token
                </label>
                <div className="flex gap-2">
                  {TOKENS[chain].map(t => (
                    <button
                      key={t}
                      onClick={() => setToken(t)}
                      className={`px-4 py-2 text-[12px] font-black uppercase tracking-wider border-[3px] border-black transition-all ${
                        token === t
                          ? 'bg-black text-white shadow-[3px_3px_0px_0px_#000]'
                          : 'bg-white text-black hover:translate-y-[-1px]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Address input */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-1.5 block">
                  Receive to
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Wallet address..."
                  className="w-full border-[3px] border-black px-3 py-2.5 text-[13px] font-bold text-black placeholder:text-black/30 outline-none focus:shadow-[4px_4px_0px_0px_#000] transition-shadow bg-white"
                />
              </motion.div>

              {/* Amount input */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <label className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-1.5 block">
                  Amount
                </label>
                <div className="flex border-[3px] border-black">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00 (optional)"
                    className="flex-1 px-3 py-2.5 text-[13px] font-bold text-black placeholder:text-black/30 outline-none bg-white"
                  />
                  <div className="bg-black text-white px-3 flex items-center text-[11px] font-black uppercase tracking-wider">
                    {token}
                  </div>
                </div>
              </motion.div>

              {/* Memo toggle */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {!showMemo ? (
                  <button
                    onClick={() => setShowMemo(true)}
                    className="flex items-center gap-1 text-[11px] font-bold text-black/50 hover:text-black transition-colors uppercase tracking-wider"
                  >
                    <Plus className="w-3 h-3" strokeWidth={3} /> Add memo
                  </button>
                ) : (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                    <label className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-1.5 block">
                      Memo
                    </label>
                    <input
                      type="text"
                      value={memo}
                      onChange={e => setMemo(e.target.value)}
                      placeholder="e.g. Invoice #123"
                      className="w-full border-[3px] border-black px-3 py-2.5 text-[13px] font-bold text-black placeholder:text-black/30 outline-none focus:shadow-[4px_4px_0px_0px_#000] transition-shadow bg-white"
                    />
                  </motion.div>
                )}
              </motion.div>

              {/* CTA Button */}
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                onClick={handleCreate}
                disabled={!address || status === 'loading'}
                whileHover={{ translateY: -2 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-black text-white font-black text-[14px] uppercase tracking-wider py-4 border-4 border-black flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-transform"
                style={{ boxShadow: '6px 6px 0px 0px #000' }}
              >
                {status === 'loading' ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    Generate Link <ArrowRight className="w-4 h-4" strokeWidth={3} />
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
