'use client'

import React, { useState, useEffect } from 'react'
import { createClient, getChains, getTokens, ChainType } from '@lifi/sdk'

const lifiClient = createClient({ integrator: 'justpay', disableVersionCheck: true })

// Popular tokens shown first (by symbol)
const POPULAR_TOKENS = ['ETH', 'USDC', 'USDT', 'DAI', 'WETH', 'WBTC', 'BNB', 'MATIC', 'SOL', 'SUI', 'AVAX', 'FTM', 'ARB', 'OP']

interface ChainInfo {
  id: string
  name: string
  logoURI?: string
  chainType: string
}

interface TokenInfo {
  symbol: string
  name: string
  address: string
  logoURI?: string
}

interface Props {
  selectedChainId: string | null
  selectedToken: string | null
  /** The address in the receive field — used to detect chain type */
  receiverAddress?: string
  connectedChainType?: 'EVM' | 'SVM' | 'MVM' | null
  connectedChainId?: string | null
  onChainSelect: (chainId: string) => void
  onTokenSelect: (token: string) => void
}

/**
 * Detect chain family from a wallet address string.
 * - SUI: 0x followed by 64 hex chars (66 total)
 * - EVM: 0x followed by 40 hex chars (42 total)
 * - SOL: base58, typically 32-44 chars, no 0x prefix
 */
function detectChainTypeFromAddress(addr: string): 'EVM' | 'SVM' | 'MVM' | null {
  if (!addr) return null
  const trimmed = addr.trim()
  if (trimmed.startsWith('0x') && trimmed.length === 66 && /^0x[0-9a-fA-F]{64}$/.test(trimmed)) return 'MVM' // SUI
  if (trimmed.startsWith('0x') && trimmed.length === 42 && /^0x[0-9a-fA-F]{40}$/.test(trimmed)) return 'EVM'
  if (!trimmed.startsWith('0x') && trimmed.length >= 32 && trimmed.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(trimmed)) return 'SVM' // SOL base58
  return null
}

export function ChainTokenSelector({ selectedChainId, selectedToken, receiverAddress, connectedChainType, connectedChainId, onChainSelect, onTokenSelect }: Props) {
  const [chains, setChains] = useState<ChainInfo[]>([])
  const [tokens, setTokens] = useState<TokenInfo[]>([])
  const [chainSearch, setChainSearch] = useState('')
  const [tokenSearch, setTokenSearch] = useState('')
  const [loadingChains, setLoadingChains] = useState(true)
  const [loadingTokens, setLoadingTokens] = useState(false)

  // Fetch chains — include all chain types (EVM, SVM, MVM, UTXO, TVM)
  useEffect(() => {
    getChains(lifiClient, {
      chainTypes: [ChainType.EVM, ChainType.SVM, ChainType.MVM, ChainType.UTXO, ChainType.TVM],
    })
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
        setChains([
          { id: '1', name: 'Ethereum', chainType: 'EVM' },
          { id: '8453', name: 'Base', chainType: 'EVM' },
          { id: '42161', name: 'Arbitrum', chainType: 'EVM' },
          { id: '10', name: 'Optimism', chainType: 'EVM' },
          { id: '137', name: 'Polygon', chainType: 'EVM' },
          { id: 'sol', name: 'Solana', chainType: 'SVM' },
          { id: 'sui', name: 'Sui', chainType: 'MVM' },
        ])
      })
      .finally(() => setLoadingChains(false))
  }, [])

  // Fetch tokens when chain changes
  useEffect(() => {
    if (!selectedChainId) {
      setTokens([])
      return
    }
    setLoadingTokens(true)
    setTokenSearch('')

    const chainIdParam = isNaN(Number(selectedChainId)) ? selectedChainId : Number(selectedChainId)

    getTokens(lifiClient, { chains: [chainIdParam as number] })
      .then((result: any) => {
        // LiFi returns tokens keyed by numeric chain ID even for non-EVM chains
        // (e.g. 'sui' → key 9270000000000000, 'sol' → key 1151111081099710)
        // So grab the first (and only) key from the result.
        const tokenKeys = Object.keys(result.tokens || {})
        const chainTokens = tokenKeys.length > 0 ? result.tokens[tokenKeys[0]] : []
        const mapped: TokenInfo[] = (chainTokens || []).map((t: any) => ({
          symbol: t.symbol,
          name: t.name,
          address: t.address,
          logoURI: t.logoURI,
        }))
        // Sort: popular tokens first, then alphabetical
        mapped.sort((a, b) => {
          const aPopIdx = POPULAR_TOKENS.indexOf(a.symbol)
          const bPopIdx = POPULAR_TOKENS.indexOf(b.symbol)
          const aPopular = aPopIdx !== -1 ? aPopIdx : 999
          const bPopular = bPopIdx !== -1 ? bPopIdx : 999
          if (aPopular !== bPopular) return aPopular - bPopular
          return a.symbol.localeCompare(b.symbol)
        })
        setTokens(mapped)
      })
      .catch(() => setTokens([]))
      .finally(() => setLoadingTokens(false))
  }, [selectedChainId])

  // Determine effective chain type from wallet connection OR address
  const addressChainType = receiverAddress ? detectChainTypeFromAddress(receiverAddress) : null
  const effectiveChainType = connectedChainType || addressChainType

  // Filter chains by detected chain type
  const compatibleChains = effectiveChainType
    ? chains.filter(c => c.chainType === effectiveChainType)
    : chains

  // Reset chain when address is cleared or doesn't match any chain type
  useEffect(() => {
    if (!receiverAddress && !connectedChainType && selectedChainId) {
      onChainSelect('')
      onTokenSelect('')
    }
  }, [receiverAddress, connectedChainType, selectedChainId, onChainSelect, onTokenSelect])

  // For single-chain ecosystems (SUI, SOL), auto-select immediately
  // For multi-chain (EVM), show the picker — don't auto-select
  useEffect(() => {
    if (!chains.length || selectedChainId) return
    if (!effectiveChainType) return

    const compatible = chains.filter(c => c.chainType === effectiveChainType)
    if (compatible.length === 1) {
      onChainSelect(compatible[0].id)
    }
  }, [chains, effectiveChainType, selectedChainId, onChainSelect])

  const filteredChains = compatibleChains.filter(c =>
    c.name.toLowerCase().includes(chainSearch.toLowerCase())
  )

  const filteredTokens = tokens.filter(t =>
    t.symbol.toLowerCase().includes(tokenSearch.toLowerCase()) ||
    t.name.toLowerCase().includes(tokenSearch.toLowerCase())
  )

  const selectedChainInfo = selectedChainId ? chains.find(c => c.id === selectedChainId) : null
  // Show compact display when chain is selected AND it's a single-chain ecosystem
  // For EVM (multi-chain), show compact with "Change" button
  const isSingleChainEcosystem = compatibleChains.length <= 1
  const showCompact = !!selectedChainId && (!!selectedChainInfo || isSingleChainEcosystem)
  const canChangeChain = !isSingleChainEcosystem

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Chain selector */}
      <label className="form-label">Network</label>

      {showCompact ? (
        /* Compact selected chain display */
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 border-[3px] border-black bg-[var(--color-section-cyan)] shadow-[4px_4px_0px_0px_#000] text-[13px] font-black uppercase flex-1">
            {selectedChainInfo?.logoURI && (
              <img src={selectedChainInfo.logoURI} alt="" className="w-4 h-4 rounded-full" />
            )}
            {selectedChainInfo?.name || selectedChainId?.toUpperCase()}
          </div>
          {canChangeChain && (
            <button
              type="button"
              onClick={() => {
                onChainSelect('')
                onTokenSelect('')
              }}
              className="px-3 py-2 border-[3px] border-black bg-white hover:bg-[var(--color-section-pink)] text-[13px] font-black uppercase transition-all shadow-[2px_2px_0px_0px_#000]"
            >
              Change
            </button>
          )}
        </div>
      ) : (
        /* Full chain picker */
        <>
          <input
            type="text"
            placeholder="SEARCH CHAIN..."
            value={chainSearch}
            onChange={e => setChainSearch(e.target.value)}
            className="input-field"
          />

          {loadingChains ? (
            <div className="w-full h-10 bg-black/10 animate-pulse border-[3px] border-black" />
          ) : (
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {filteredChains.map(chain => (
                <button
                  key={chain.id}
                  type="button"
                  onClick={() => {
                    onChainSelect(chain.id)
                    onTokenSelect('')  // Reset token when chain changes
                  }}
                  className={`flex items-center gap-2 px-3 py-2 border-[3px] border-black text-[13px] font-black uppercase transition-all ${selectedChainId === chain.id
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
        </>
      )}

      {/* Token selector — shown after chain is selected */}
      {selectedChainId && (
        <div className="flex flex-col gap-2 mt-2">
          <label className="form-label">Token</label>
          <input
            type="text"
            placeholder="SEARCH TOKEN..."
            value={tokenSearch}
            onChange={e => setTokenSearch(e.target.value)}
            className="input-field"
          />

          {loadingTokens ? (
            <div className="w-full h-10 bg-black/10 animate-pulse border-[3px] border-black" />
          ) : (
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {filteredTokens.slice(0, 50).map(token => (
                <button
                  key={token.address}
                  type="button"
                  onClick={() => onTokenSelect(token.symbol)}
                  className={`flex items-center gap-2 px-3 py-2 border-[3px] border-black text-[13px] font-black uppercase transition-all ${selectedToken === token.symbol
                    ? 'bg-[var(--color-section-pink)] shadow-[4px_4px_0px_0px_#000] -translate-y-[2px] translate-x-[2px]'
                    : 'bg-white hover:bg-[var(--color-section-yellow)] shadow-[2px_2px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:-translate-y-[2px] hover:translate-x-[2px]'
                    }`}
                >
                  {token.logoURI && (
                    <img src={token.logoURI} alt="" className="w-4 h-4 rounded-full" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  )}
                  {token.symbol}
                </button>
              ))}
              {filteredTokens.length > 50 && (
                <span className="text-[11px] font-bold text-black/40 px-2 py-2">+{filteredTokens.length - 50} more — search to find</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
