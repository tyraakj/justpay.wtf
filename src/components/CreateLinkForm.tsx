'use client';

import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletConnectButton } from './shared/WalletConnectButton';
import { createPaymentLink } from '../lib/payment';
import { ZeroFeeBanner } from './shared/ZeroFeeBanner';
import { ChainTokenSelector, SupportedChain } from './shared/ChainTokenSelector';

export function CreateLinkForm() {
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState<'base' | 'solana'>('base');
  const [amount, setAmount] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('USDC');
  const [email, setEmail] = useState('');
  const [memo, setMemo] = useState('');
  const [expiry, setExpiry] = useState('15m');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const { address: evmAddress } = useAccount();
  const { publicKey } = useWallet();
  const connectedAddress = evmAddress || publicKey?.toBase58();

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
        creatorChain: chain === 'base' ? 'ethereum' : 'solana',
        tokenSymbol,
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
        <div className="divider-line"></div>
        <span className="flex-shrink-0 mx-4 form-label text-zinc-500">Or Address</span>
        <div className="divider-line"></div>
      </div>

      <ZeroFeeBanner chain={chain} />

      <ChainTokenSelector 
        selectedChain={chain}
        selectedToken={tokenSymbol}
        onChainSelect={setChain as any}
        onTokenSelect={setTokenSymbol}
      />

      <div className="flex flex-col gap-2">
        <label className="form-label">Destination</label>
        <input 
          type="text" 
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={chain === 'base' ? "0x..." : "Solana address"} 
          className="input-field"
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <label className="form-label">Amount</label>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00" 
            className="input-field"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="form-label">Memo (Optional)</label>
        <input 
          type="text" 
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Invoice #123, Coffee, etc." 
          className="input-field"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <label className="form-label">Email (Optional)</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="For payment notifications" 
            className="input-field"
          />
        </div>
        <div className="flex flex-col gap-2 w-32">
          <label className="form-label">Expiry</label>
          <select 
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="select-field"
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
        className="btn-primary mt-2"
      >
        {isLoading ? 'Creating...' : 'Create Link'}
        {!isLoading && <ArrowRight className="w-4 h-4" />}
      </button>
    </div>
  );
}
