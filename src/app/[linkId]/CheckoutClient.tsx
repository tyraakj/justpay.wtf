'use client'

import { useState } from 'react'
import { WalletConnectButton } from '@/components/shared/WalletConnectButton'
import { SmartButton } from '@/components/SmartButton'
import { ConnectButton } from '@mysten/dapp-kit'
import { getChainConfig } from '@/lib/config/network'

interface CheckoutClientProps {
  linkId: string
  chain: 'ethereum' | 'solana' | 'sui'
  recipientAddress: string
  tokenSymbol: string
  amount: string
}

export function CheckoutClient({ linkId, chain, recipientAddress, tokenSymbol, amount }: CheckoutClientProps) {
  // If destination is a testnet, default the payer to the same testnet family
  const isDestTestnet = getChainConfig(chain)?.isTestnet;
  
  const [payerChain, setPayerChain] = useState<string>(
    chain === 'ethereum' || chain === 'base' || chain === 'sepolia' || chain === 'baseSepolia' 
      ? chain 
      : (isDestTestnet ? 'sepolia' : 'ethereum')
  )
  const [isSuccess, setIsSuccess] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<{ type: 'expired' | 'failed_slippage' | 'failed_reverted' | 'unknown', message: string } | null>(null)

  const getDestinationTokenAddress = () => {
    try {
      const config = getChainConfig(chain);
      if (tokenSymbol === 'ETH' || tokenSymbol === 'SOL' || tokenSymbol === 'SUI') return null; // Native
      return config.tokens[tokenSymbol] || null;
    } catch {
      return null;
    }
  }

  const getInputTokenAddress = () => {
    try {
      // Defaulting to USDC for EVM/Solana or SUI for Sui
      const config = getChainConfig(payerChain);
      if (payerChain === 'sui' || payerChain === 'suiTestnet') return null; // Native SUI
      return config.tokens['USDC'] || null;
    } catch {
      return null;
    }
  }

  if (isSuccess) {
    return (
      <div className="glass-card p-8 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-2">
          <div className="w-8 h-8 rounded-full bg-success" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Payment Sent!</h2>
        <p className="text-zinc-400 text-sm max-w-xs">
          Your transaction is confirming via LI.FI network. The merchant will be notified automatically.
        </p>
        {txHash && (
          <div className="mt-4 status-box w-full">
            <p className="form-label text-zinc-500 mb-1">Transaction Hash</p>
            <p className="text-sm font-mono text-foreground truncate">{txHash}</p>
          </div>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card p-8 flex flex-col items-center justify-center text-center gap-4 border-error/20 bg-error/5">
        <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mb-2">
          <div className="w-8 h-8 rounded-full bg-error flex items-center justify-center text-white font-bold text-xl">!</div>
        </div>
        <h2 className="text-2xl font-bold text-error">Payment Failed</h2>
        <p className="text-zinc-400 text-sm max-w-xs">
          {error.type === 'expired' && "This payment link has expired."}
          {error.type === 'failed_slippage' && "Transaction failed due to high slippage. Please try again."}
          {error.type === 'failed_reverted' && "The transaction reverted on-chain. Check your wallet balance and try again."}
          {error.type === 'unknown' && error.message}
        </p>
        <button 
          onClick={() => setError(null)}
          className="btn-secondary mt-4 w-full max-w-[200px]"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-zinc-400">Pay with Wallet</label>
        <div className="flex gap-2">
          <button 
            onClick={() => setPayerChain(isDestTestnet ? 'sepolia' : 'ethereum')}
            className={payerChain === 'ethereum' || payerChain === 'sepolia' || payerChain === 'base' || payerChain === 'baseSepolia' ? 'btn-secondary-lg-active' : 'btn-secondary-lg'}
          >
            EVM (Base/Eth)
          </button>
          <button 
            onClick={() => setPayerChain(isDestTestnet ? 'solanaDevnet' : 'solana')}
            className={payerChain === 'solana' || payerChain === 'solanaDevnet' ? 'btn-secondary-lg-active' : 'btn-secondary-lg'}
          >
            Solana
          </button>
          <button 
            onClick={() => setPayerChain(isDestTestnet ? 'suiTestnet' : 'sui')}
            className={payerChain === 'sui' || payerChain === 'suiTestnet' ? 'btn-secondary-lg-active' : 'btn-secondary-lg'}
          >
            Sui
          </button>
        </div>
      </div>

      {payerChain === 'sui' || payerChain === 'suiTestnet' ? (
        <div className="flex justify-center w-full">
          <ConnectButton connectText="Connect Sui Wallet" />
        </div>
      ) : (
        <WalletConnectButton variant="form" />
      )}

      <SmartButton 
        linkId={linkId}
        chain={chain}
        recipientAddress={recipientAddress}
        tokenAddress={getDestinationTokenAddress()}
        payerChain={payerChain}
        inputTokenAddress={getInputTokenAddress()}
        amount={amount}
        decimals={tokenSymbol === 'USDC' ? 6 : 18}
        onSuccess={(hash) => {
          setTxHash(hash)
          setIsSuccess(true)
        }}
        onError={(err: any) => {
          const msg = err?.message || '';
          if (msg.includes('expired')) setError({ type: 'expired', message: msg });
          else if (msg.includes('slippage')) setError({ type: 'failed_slippage', message: msg });
          else if (msg.includes('revert') || msg.includes('insufficient')) setError({ type: 'failed_reverted', message: msg });
          else if (msg.includes('No available quotes') || msg.includes('404')) {
            setError({ 
              type: 'unknown', 
              message: 'Route not supported or amount is too low for bridge minimums. Try increasing the amount or using a different chain.' 
            });
          }
          else setError({ type: 'unknown', message: msg || 'An unknown error occurred' });
        }}
      />
    </div>
  )
}
