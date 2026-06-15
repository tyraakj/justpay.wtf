'use client';

import { Save, Wallet } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount } from 'wagmi';

export default function DashboardProfile() {
  const { publicKey } = useWallet();
  const { address: evmAddress } = useAccount();
  
  const solAddressStr = publicKey ? publicKey.toBase58() : '';
  const evmAddressStr = evmAddress || '';

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-white">Profile Settings</h1>
        <p className="text-sm text-gray-400">Manage your connected wallets and API keys.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Connected Wallet Settings */}
        <div className="glass-card p-6 flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="p-2 bg-primary/20 rounded-lg text-primary">
              <Wallet className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Default Settlement Wallet</h2>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="form-label">Solana Address</label>
              <input 
                type="text" 
                value={solAddressStr} 
                placeholder="Connect Solana wallet to view"
                className="input-field font-mono"
                readOnly
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="form-label">EVM Address (Ethereum/Arbitrum/Polygon)</label>
              <input 
                type="text" 
                value={evmAddressStr} 
                placeholder="Connect EVM wallet to view"
                className="input-field font-mono"
                readOnly
              />
            </div>

            <button className="btn-primary mt-2">
              <Save className="w-4 h-4" /> Save Wallet Settings
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
