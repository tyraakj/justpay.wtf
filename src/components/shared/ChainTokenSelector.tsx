import { useState } from 'react';
import { Check } from 'lucide-react';

export type SupportedChain = 'ethereum' | 'base' | 'solana' | 'sui';

interface ChainTokenSelectorProps {
  selectedChain: SupportedChain;
  selectedToken: string;
  onChainSelect: (chain: SupportedChain) => void;
  onTokenSelect: (token: string) => void;
}

const SUPPORTED_NETWORKS: Record<SupportedChain, { name: string; tokens: string[] }> = {
  ethereum: {
    name: 'Ethereum',
    tokens: ['ETH', 'USDC', 'USDT']
  },
  base: {
    name: 'Base L2',
    tokens: ['ETH', 'USDC']
  },
  solana: {
    name: 'Solana',
    tokens: ['SOL', 'USDC', 'USDT']
  },
  sui: {
    name: 'Sui',
    tokens: ['SUI']
  }
};

export function ChainTokenSelector({ selectedChain, selectedToken, onChainSelect, onTokenSelect }: ChainTokenSelectorProps) {
  // Use a dropdown or pills for network
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-2">
        <label className="form-label">Network</label>
        <div className="flex gap-2 bg-surface p-1 rounded-2xl border border-white/[0.08]">
          {(Object.entries(SUPPORTED_NETWORKS) as [SupportedChain, any][]).filter(([k]) => k === 'base' || k === 'solana' || k === 'sui').map(([key, config]) => (
            <button
              key={key}
              onClick={() => {
                onChainSelect(key);
                if (!config.tokens.includes(selectedToken)) {
                  onTokenSelect(config.tokens[0]); // fallback to first token if current not supported
                }
              }}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                selectedChain === key 
                  ? 'bg-primary/20 text-primary border border-primary/30' 
                  : 'text-zinc-400 hover:text-foreground hover:bg-white/5 border border-transparent'
              }`}
            >
              {config.name}
              {selectedChain === key && <Check className="w-3 h-3" />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="form-label">Token</label>
        <div className="flex gap-2">
          {SUPPORTED_NETWORKS[selectedChain]?.tokens.map((token) => (
            <button
              key={token}
              onClick={() => onTokenSelect(token)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                selectedToken === token
                  ? 'bg-white/10 text-white border-white/20'
                  : 'bg-surface text-zinc-500 border-white/[0.05] hover:border-white/10 hover:text-zinc-300'
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
