import { useState } from 'react';
import { Check } from 'lucide-react';

import { ENABLE_TESTNETS } from '@/lib/config/network';

export type SupportedChain = 'ethereum' | 'base' | 'solana' | 'sui' | 'sepolia' | 'baseSepolia' | 'solanaDevnet' | 'suiTestnet';

interface ChainTokenSelectorProps {
  selectedChain: SupportedChain;
  selectedToken: string;
  onChainSelect: (chain: SupportedChain) => void;
  onTokenSelect: (token: string) => void;
}

const SUPPORTED_NETWORKS: Record<string, { name: string; tokens: string[], isTestnet?: boolean }> = {
  ethereum: { name: 'Ethereum', tokens: ['ETH', 'USDC', 'USDT'] },
  base: { name: 'Base L2', tokens: ['ETH', 'USDC'] },
  solana: { name: 'Solana', tokens: ['SOL', 'USDC', 'USDT'] },
  sui: { name: 'Sui', tokens: ['SUI'] },
  
  // Testnets
  sepolia: { name: 'Sepolia (ETH)', tokens: ['ETH', 'USDC'], isTestnet: true },
  baseSepolia: { name: 'Base Sepolia', tokens: ['ETH', 'USDC'], isTestnet: true },
  solanaDevnet: { name: 'Solana Devnet', tokens: ['SOL', 'USDC'], isTestnet: true },
  suiTestnet: { name: 'Sui Testnet', tokens: ['SUI'], isTestnet: true }
};

export function ChainTokenSelector({ selectedChain, selectedToken, onChainSelect, onTokenSelect }: ChainTokenSelectorProps) {
  // Use a dropdown or pills for network
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-2">
        <label className="text-[14px] font-black uppercase tracking-wider text-black bg-[var(--color-section-yellow)] px-2 py-1 inline-block w-max border-2 border-black">Network</label>
        <div className="flex flex-wrap gap-4 mt-2">
          {Object.entries(SUPPORTED_NETWORKS)
            .filter(([_, config]) => ENABLE_TESTNETS ? true : !config.isTestnet)
            .filter(([k]) => ['base', 'solana', 'sui'].includes(k)) // Currently enabled networks
            .map(([key, config]) => (
            <button
              key={key}
              onClick={() => {
                onChainSelect(key as SupportedChain);
                if (!config.tokens.includes(selectedToken)) {
                  onTokenSelect(config.tokens[0]); // fallback to first token if current not supported
                }
              }}
              className={`flex-1 min-w-[100px] py-3 px-4 text-[16px] font-black uppercase transition-all flex items-center justify-center gap-2 border-[3px] border-black ${
                selectedChain === key 
                  ? 'bg-[var(--color-section-cyan)] text-black shadow-[4px_4px_0px_0px_#000] -translate-y-[2px] translate-x-[2px]' 
                  : 'bg-white text-black shadow-[2px_2px_0px_0px_#000] hover:bg-[var(--color-section-yellow)] hover:shadow-[4px_4px_0px_0px_#000] hover:-translate-y-[2px] hover:translate-x-[2px]'
              }`}
            >
              {config.name}
              {selectedChain === key && <Check className="w-5 h-5" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[14px] font-black uppercase tracking-wider text-black bg-[var(--color-section-yellow)] px-2 py-1 inline-block w-max border-2 border-black">Token</label>
        <div className="flex gap-2">
          {SUPPORTED_NETWORKS[selectedChain]?.tokens.map((token) => (
            <button
              key={token}
              onClick={() => onTokenSelect(token)}
              className={`px-6 py-3 text-[16px] font-black uppercase transition-all border-[3px] border-black ${
                selectedToken === token
                  ? 'bg-[var(--color-section-green)] text-black shadow-[4px_4px_0px_0px_#000] -translate-y-[2px] translate-x-[2px]'
                  : 'bg-white text-black shadow-[2px_2px_0px_0px_#000] hover:bg-[var(--color-section-yellow)] hover:shadow-[4px_4px_0px_0px_#000] hover:-translate-y-[2px] hover:translate-x-[2px]'
              }`}
            >
              {token}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
