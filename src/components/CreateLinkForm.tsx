'use client';

import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { WalletConnectButton } from './shared/WalletConnectButton';
import { createPaymentLink } from '../lib/payment';
import { FeeDisclosureBanner } from './shared/FeeDisclosureBanner';
import { ChainTokenSelector, SupportedChain } from './shared/ChainTokenSelector';

export function CreateLinkForm() {
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState<SupportedChain>('base');
  const [amount, setAmount] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('USDC');
  const [email, setEmail] = useState('');
  const [memo, setMemo] = useState('');
  const [expiry, setExpiry] = useState('15m');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const { address: evmAddress } = useAccount();
  const { publicKey } = useWallet();
  const suiAccount = useCurrentAccount();
  const connectedAddress = evmAddress || publicKey?.toBase58() || suiAccount?.address;

  useEffect(() => {
    if (connectedAddress) {
      const savedExpiry = localStorage.getItem(`justpay_expiry_${connectedAddress}`);
      if (savedExpiry) {
        setExpiry(savedExpiry);
      }
    }
  }, [connectedAddress]);

  const handleCreate = async () => {
    if (!address || !amount) return;
    setIsLoading(true);
    
    try {
      let expiresAt: string | undefined;
      const now = new Date();
      if (expiry === '15m') expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
      else if (expiry === '1h') expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
      else if (expiry === '24h') expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      else if (expiry === '7d') expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      else if (expiry === 'none') expiresAt = undefined;

      const data = await createPaymentLink({
        creatorAddress: address,
        creatorChain: chain,
        tokenSymbol,
        tokenAddress: chain === 'sui' || chain === 'suiTestnet' ? '0x2::sui::SUI' : undefined,
        amount,
        creatorEmail: email || undefined,
        memo: memo || undefined,
        expiresAt,
        label: 'justpay.wtf Payment',
      });
      
      // Save to localStorage LRU
      const existingStr = localStorage.getItem('justpay_links');
      let links = existingStr ? JSON.parse(existingStr) : [];
      links.unshift({ shortCode: data.short_code, createdAt: new Date().toISOString() });
      if (links.length > 5) links = links.slice(0, 5);
      localStorage.setItem('justpay_links', JSON.stringify(links));

      // Redirect to payment page
      router.push(`/${data.short_code}`);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to create link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <WalletConnectButton variant="form" />
      <div className="relative flex items-center py-2">
        <div className="flex-1 border-t-4 border-black border-dashed"></div>
        <span className="flex-shrink-0 mx-4 text-[14px] font-black uppercase tracking-wider text-black bg-[var(--color-section-yellow)] px-2 py-1 inline-block w-max border-2 border-black">Or Address</span>
        <div className="flex-1 border-t-4 border-black border-dashed"></div>
      </div>

      <FeeDisclosureBanner chain={chain} />

      <ChainTokenSelector 
        selectedChain={chain}
        selectedToken={tokenSymbol}
        onChainSelect={setChain as any}
        onTokenSelect={setTokenSymbol}
      />

      <div className="flex flex-col gap-2">
        <label className="text-[14px] font-black uppercase tracking-wider text-black bg-[var(--color-section-yellow)] px-2 py-1 inline-block w-max border-2 border-black">Destination</label>
        <input 
          type="text" 
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={chain === 'base' ? "0x..." : chain === 'sui' ? "0x... (64 hex chars)" : "Solana address"} 
          className="w-full border-[3px] border-black bg-white px-4 py-3 text-[16px] font-bold text-black placeholder:text-black/40 shadow-[4px_4px_0px_0px_#000] outline-none focus:-translate-y-[2px] focus:translate-x-[2px] focus:shadow-[6px_6px_0px_0px_#000] transition-all"
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-[14px] font-black uppercase tracking-wider text-black bg-[var(--color-section-yellow)] px-2 py-1 inline-block w-max border-2 border-black">Amount</label>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00" 
            className="w-full border-[3px] border-black bg-white px-4 py-3 text-[16px] font-bold text-black placeholder:text-black/40 shadow-[4px_4px_0px_0px_#000] outline-none focus:-translate-y-[2px] focus:translate-x-[2px] focus:shadow-[6px_6px_0px_0px_#000] transition-all"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[14px] font-black uppercase tracking-wider text-black bg-[var(--color-section-yellow)] px-2 py-1 inline-block w-max border-2 border-black">Memo (Optional)</label>
        <input 
          type="text" 
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Invoice #123, Coffee, etc." 
          className="w-full border-[3px] border-black bg-white px-4 py-3 text-[16px] font-bold text-black placeholder:text-black/40 shadow-[4px_4px_0px_0px_#000] outline-none focus:-translate-y-[2px] focus:translate-x-[2px] focus:shadow-[6px_6px_0px_0px_#000] transition-all"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-[14px] font-black uppercase tracking-wider text-black bg-[var(--color-section-yellow)] px-2 py-1 inline-block w-max border-2 border-black">Email (Optional)</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="For payment notifications" 
            className="w-full border-[3px] border-black bg-white px-4 py-3 text-[16px] font-bold text-black placeholder:text-black/40 shadow-[4px_4px_0px_0px_#000] outline-none focus:-translate-y-[2px] focus:translate-x-[2px] focus:shadow-[6px_6px_0px_0px_#000] transition-all"
          />
        </div>
        <div className="flex flex-col gap-2 w-32">
          <label className="text-[14px] font-black uppercase tracking-wider text-black bg-[var(--color-section-yellow)] px-2 py-1 inline-block w-max border-2 border-black">Expiry</label>
          <select 
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="w-full border-[3px] border-black bg-white px-4 py-3 text-[16px] font-bold text-black shadow-[4px_4px_0px_0px_#000] outline-none focus:-translate-y-[2px] focus:translate-x-[2px] focus:shadow-[6px_6px_0px_0px_#000] transition-all cursor-pointer"
          >
            <option value="15m">15 Mins</option>
            <option value="1h">1 Hour</option>
            <option value="24h">24 Hours</option>
            <option value="7d">7 Days</option>
            <option value="none">Never</option>
          </select>
        </div>
      </div>

      <button 
        onClick={handleCreate}
        disabled={isLoading || !address || !amount}
        className="w-full flex items-center justify-center gap-2 border-4 border-black bg-[var(--color-section-pink)] px-6 py-4 text-[20px] font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] hover:-translate-y-[2px] hover:translate-x-[2px] hover:shadow-[6px_6px_0px_0px_#000] transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Creating...' : 'Create Link'}
        {!isLoading && <ArrowRight className="w-4 h-4" />}
      </button>
    </div>
  );
}
