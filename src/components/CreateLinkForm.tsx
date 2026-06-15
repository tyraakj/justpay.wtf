'use client';

import { useState } from 'react';
import { ArrowRight, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CreateLinkForm() {
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState<'ethereum' | 'solana'>('ethereum');
  const [amount, setAmount] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('USDC');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    if (!address || !amount) return;
    setIsLoading(true);
    
    try {
      const response = await fetch('https://[YOUR_SUPABASE_PROJECT_ID].supabase.co/functions/v1/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorAddress: address,
          creatorChain: chain,
          tokenSymbol,
          amount,
          label: 'Envoy Payment',
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      
      // Save to localStorage LRU
      const existingStr = localStorage.getItem('envoy_links');
      let links = existingStr ? JSON.parse(existingStr) : [];
      links.unshift({ shortCode: data.short_code, createdAt: new Date().toISOString() });
      if (links.length > 5) links = links.slice(0, 5);
      localStorage.setItem('envoy_links', JSON.stringify(links));

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
      <button className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-3 px-4 rounded-xl transition-all">
        <Wallet className="w-5 h-5 text-gray-400" />
        Connect Wallet
      </button>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-white/10"></div>
        <span className="flex-shrink-0 mx-4 text-xs text-gray-500 uppercase tracking-wider font-semibold">Or Address</span>
        <div className="flex-grow border-t border-white/10"></div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={() => setChain('ethereum')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${chain === 'ethereum' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-black/20 text-gray-400 border border-white/5 hover:bg-black/40'}`}
        >
          Ethereum
        </button>
        <button 
          onClick={() => setChain('solana')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${chain === 'solana' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-black/20 text-gray-400 border border-white/5 hover:bg-black/40'}`}
        >
          Solana
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Destination</label>
        <input 
          type="text" 
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={chain === 'ethereum' ? "0x..." : "Solana address"} 
          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</label>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00" 
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <div className="flex flex-col gap-2 w-32">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Token</label>
          <select 
            value={tokenSymbol}
            onChange={(e) => setTokenSymbol(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
          >
            <option value="USDC">USDC</option>
            <option value="USDT">USDT</option>
            <option value={chain === 'ethereum' ? 'ETH' : 'SOL'}>{chain === 'ethereum' ? 'ETH' : 'SOL'}</option>
          </select>
        </div>
      </div>

      <button 
        onClick={handleCreate}
        disabled={isLoading || !address || !amount}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-hover hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all mt-2 shadow-lg shadow-primary/25"
      >
        {isLoading ? 'Creating...' : 'Create Link'}
        {!isLoading && <ArrowRight className="w-4 h-4" />}
      </button>
    </div>
  );
}
