'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ConnectWallet } from './ConnectWallet';

export function CreateLinkForm() {
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState<'ethereum' | 'solana'>('ethereum');
  const [amount, setAmount] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('USDC');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    if (!address || !amount) return;
    setIsLoading(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-link`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({
          creatorAddress: address,
          creatorChain: chain,
          tokenSymbol,
          amount,
          creatorEmail: email || undefined,
          label: 'justpay.wtf Payment',
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      
      // Save to localStorage LRU
      const existingStr = localStorage.getItem('justpay_links');
      let links = existingStr ? JSON.parse(existingStr) : [];
      links.unshift({ shortCode: data.short_code, createdAt: new Date().toISOString() });
      if (links.length > 5) links = links.slice(0, 5);
      localStorage.setItem('justpay_links', JSON.stringify(links));

      // Redirect to payment page
      router.push(`/${data.short_code}`);
    } catch (error) {
      console.error(error);
      alert('Failed to create link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <ConnectWallet chain={chain} />

      <div className="relative flex items-center py-2">
        <div className="divider-line"></div>
        <span className="flex-shrink-0 mx-4 form-label text-zinc-500">Or Address</span>
        <div className="divider-line"></div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={() => setChain('ethereum')}
          className={chain === 'ethereum' ? 'btn-secondary-active' : 'btn-secondary'}
        >
          Ethereum
        </button>
        <button 
          onClick={() => setChain('solana')}
          className={chain === 'solana' ? 'btn-secondary-active' : 'btn-secondary'}
        >
          Solana
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <label className="form-label">Destination</label>
        <input 
          type="text" 
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={chain === 'ethereum' ? "0x..." : "Solana address"} 
          className="input-field"
        />
      </div>

      <div className="flex gap-4">
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
        <div className="flex flex-col gap-2 w-32">
          <label className="form-label">Token</label>
          <select 
            value={tokenSymbol}
            onChange={(e) => setTokenSymbol(e.target.value)}
            className="select-field"
          >
            <option value="USDC">USDC</option>
            <option value="USDT">USDT</option>
            <option value={chain === 'ethereum' ? 'ETH' : 'SOL'}>{chain === 'ethereum' ? 'ETH' : 'SOL'}</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="form-label">Email (Optional)</label>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="For payment notifications" 
          className="input-field"
        />
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
