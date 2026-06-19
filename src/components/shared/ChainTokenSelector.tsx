'use client'

import { useState, useEffect } from 'react'
import { createClient, getChains } from '@lifi/sdk'

const lifiClient = createClient({ integrator: 'justpay', disableVersionCheck: true })

interface ChainInfo {
  id: string
  name: string
  logoURI?: string
  chainType: string
}

interface Props {
  selectedChainId: string | null
  selectedToken: string | null
  onChainSelect: (chainId: string) => void
  onTokenSelect: (token: string) => void
}

export function ChainTokenSelector({ selectedChainId, selectedToken, onChainSelect, onTokenSelect }: Props) {
  const [chains, setChains] = useState<ChainInfo[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getChains(lifiClient)
      .then((result: any[]) => {
        const mapped: ChainInfo[] = result.map((c: any) => ({
          id: c.id.toString(),
          name: c.name,
          logoURI: c.logoURI,
          chainType: c.chainType ?? 'EVM',
        }))
        mapped.sort((a, b) => {
          const aEvm = a.chainType === 'EVM' ? 0 : 1
          const bEvm = b.chainType === 'EVM' ? 0 : 1
          return aEvm - bEvm || a.name.localeCompare(b.name)
        })
        setChains(mapped)
      })
      .catch(() => {
        // Fallback: show a handful of popular chains if SDK call fails
        setChains([
          { id: '1',     name: 'Ethereum', chainType: 'EVM' },
          { id: '8453',  name: 'Base',     chainType: 'EVM' },
          { id: '42161', name: 'Arbitrum', chainType: 'EVM' },
          { id: '10',    name: 'Optimism', chainType: 'EVM' },
          { id: '137',   name: 'Polygon',  chainType: 'EVM' },
          { id: 'sol',   name: 'Solana',   chainType: 'SVM' },
          { id: 'sui',   name: 'Sui',      chainType: 'MVM' },
        ])
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = chains.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-3 w-full">
      <label className="form-label">RECEIVE ON</label>

      <input
        type="text"
        placeholder="SEARCH CHAIN..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="input-field"
      />

      {loading ? (
        <div className="w-full h-10 bg-black/10 animate-pulse border-[3px] border-black" />
      ) : (
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
          {filtered.map(chain => (
            <button
              key={chain.id}
              type="button"
              onClick={() => onChainSelect(chain.id)}
              className={`flex items-center gap-2 px-3 py-2 border-[3px] border-black text-[13px] font-black uppercase transition-all ${
                selectedChainId === chain.id
                  ? 'bg-[var(--color-section-cyan)] shadow-[4px_4px_0px_0px_#000] -translate-y-[2px] translate-x-[2px]'
                  : 'bg-white hover:bg-[var(--color-section-yellow)] shadow-[2px_2px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:-translate-y-[2px] hover:translate-x-[2px]'
              }`}
            >
              {chain.logoURI && (
                <img src={chain.logoURI} alt="" className="w-4 h-4 rounded-full" />
              )}
              {chain.name}
            </button>
          ))}
        </div>
      )}

      {selectedChainId && (
        <div className="flex flex-col gap-2">
          <label className="form-label">TOKEN (OPTIONAL)</label>
          <input
            type="text"
            placeholder="e.g. USDC, ETH, or token address"
            value={selectedToken ?? ''}
            onChange={e => onTokenSelect(e.target.value)}
            className="input-field"
          />
          <p className="text-[11px] font-bold text-black/50 uppercase">Leave blank to accept any token</p>
        </div>
      )}
    </div>
  )
}
