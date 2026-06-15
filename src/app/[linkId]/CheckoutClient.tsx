'use client'

import { useState } from 'react'
import { ConnectWallet } from '@/components/ConnectWallet'
import { SmartButton } from '@/components/SmartButton'

interface CheckoutClientProps {
  linkId: string
  chain: 'ethereum' | 'solana'
  recipientAddress: string
  tokenSymbol: string
  amount: string
}

export function CheckoutClient({ linkId, chain, recipientAddress, tokenSymbol, amount }: CheckoutClientProps) {
  const [payerChain, setPayerChain] = useState<'ethereum' | 'solana'>('ethereum')
  const [isSuccess, setIsSuccess] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)

  // Very basic token mapping for V1 mockup purposes
  const getDestinationTokenAddress = () => {
    if (chain === 'ethereum') {
      if (tokenSymbol === 'USDC') return '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // Base USDC
      return null // Native ETH
    } else {
      if (tokenSymbol === 'USDC') return 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // Solana USDC
      return null // Native SOL
    }
  }

  const getInputTokenAddress = () => {
    if (payerChain === 'ethereum') {
      return '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // Default paying with USDC on Base
    } else {
      return 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // Default paying with USDC on Solana
    }
  }

  if (isSuccess) {
    return (
      <div className="glass-card p-8 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-2">
          <div className="w-8 h-8 rounded-full bg-success" />
        </div>
        <h2 className="text-2xl font-bold text-white">Payment Sent!</h2>
        <p className="text-gray-400 text-sm max-w-xs">
          Your transaction is confirming. The merchant will be notified automatically.
        </p>
        {txHash && (
          <div className="mt-4 status-box w-full">
            <p className="form-label text-gray-500 mb-1">Transaction Hash</p>
            <p className="text-sm font-mono text-white truncate">{txHash}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-400">Pay with Wallet</label>
        <div className="flex gap-2">
          <button 
            onClick={() => setPayerChain('ethereum')}
            className={payerChain === 'ethereum' ? 'btn-secondary-lg-active' : 'btn-secondary-lg'}
          >
            EVM (Base/Eth)
          </button>
          <button 
            onClick={() => setPayerChain('solana')}
            className={payerChain === 'solana' ? 'btn-secondary-lg-active' : 'btn-secondary-lg'}
          >
            Solana
          </button>
        </div>
      </div>

      <ConnectWallet chain={payerChain} />

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
      />
    </div>
  )
}
