'use client'

import { useState } from 'react'
import { WalletConnectButton } from '@/components/shared/WalletConnectButton'
import { SmartButton } from '@/components/SmartButton'
import { useSignAndExecuteTransaction, useCurrentAccount, ConnectButton } from '@mysten/dapp-kit'
import { buildSuiTransferTx, getSuiExplorerUrl, getSuiBalance } from '@/lib/web3/executeSui'

interface CheckoutClientProps {
  linkId: string
  chain: 'ethereum' | 'solana' | 'sui'
  recipientAddress: string
  tokenSymbol: string
  amount: string
}

export function CheckoutClient({ linkId, chain, recipientAddress, tokenSymbol, amount }: CheckoutClientProps) {
  const [payerChain, setPayerChain] = useState<'ethereum' | 'solana'>('ethereum')
  const [isSuccess, setIsSuccess] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<{ type: 'expired' | 'failed_slippage' | 'failed_reverted' | 'unknown', message: string } | null>(null)

  const suiAccount = useCurrentAccount()
  const { mutateAsync: signAndExecuteSui } = useSignAndExecuteTransaction()

  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'submitted' | 'completed' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Very basic token mapping for V1 mockup purposes
  const getDestinationTokenAddress = () => {
    if (chain === 'ethereum') {
      if (tokenSymbol === 'USDC') return '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // Base USDC
      return null // Native ETH
    } else if (chain === 'solana') {
      if (tokenSymbol === 'USDC') return 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // Solana USDC
      return null // Native SOL
    }
    return null
  }

  const getInputTokenAddress = () => {
    if (payerChain === 'ethereum') {
      return '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // Default paying with USDC on Base
    } else if (payerChain === 'solana') {
      return 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // Default paying with USDC on Solana
    }
    return null
  }

  const handleSuiPayment = async () => {
    if (!suiAccount) return
    setPaymentStatus('pending')
    setError(null)
    setErrorMessage(null)

    try {
      const balance = await getSuiBalance(suiAccount.address)
      if (balance < Number(amount) + 0.01) {
        throw new Error('Insufficient SUI balance (including gas)')
      }

      const tx = buildSuiTransferTx(recipientAddress, Number(amount))
      const result = await signAndExecuteSui({ transaction: tx })

      setTxHash(result.digest)
      setPaymentStatus('submitted')

      const verification = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/sui-webhook`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            link_id: linkId,
            tx_digest: result.digest,
            recipient_address: recipientAddress,
            expected_amount: Number(amount),
          }),
        }
      )

      if (!verification.ok) {
        const errData = await verification.json()
        throw new Error(errData.error ?? 'Verification failed')
      }

      setPaymentStatus('completed')
      setIsSuccess(true)
    } catch (err: any) {
      console.error('Sui payment error:', err)
      setPaymentStatus('error')
      setErrorMessage(err.message ?? 'Transaction failed')
      setError({ type: 'unknown', message: err.message ?? 'Transaction failed' })
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
          Your transaction is confirming. The merchant will be notified automatically.
        </p>
        {txHash && (
          <div className="mt-4 status-box w-full">
            <p className="form-label text-zinc-500 mb-1">Transaction Hash</p>
            {chain === 'sui' ? (
              <a href={getSuiExplorerUrl(txHash)} target="_blank" rel="noreferrer" className="text-sm font-mono text-primary hover:underline truncate">
                {txHash}
              </a>
            ) : (
              <p className="text-sm font-mono text-foreground truncate">{txHash}</p>
            )}
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
          onClick={() => {
            setError(null)
            setPaymentStatus('idle')
            setErrorMessage(null)
          }}
          className="btn-secondary mt-4 w-full max-w-[200px]"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (chain === 'sui') {
    return (
      <div className="flex flex-col gap-6">
        <div className="glass-card p-6 flex flex-col items-center justify-center text-center gap-4">
          {!suiAccount ? (
            <ConnectButton connectText="Connect Sui Wallet" />
          ) : (
            <button
              className="btn-primary w-full"
              onClick={handleSuiPayment}
              disabled={['pending', 'submitted'].includes(paymentStatus)}
            >
              {paymentStatus === 'pending'  ? 'Confirm in wallet...' :
               paymentStatus === 'submitted' ? 'Verifying on chain...' :
               `Pay ${amount} SUI`}
            </button>
          )}

          {paymentStatus === 'completed' && txHash && (
            <a
              href={getSuiExplorerUrl(txHash)}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary hover:underline mt-2"
            >
              ✅ Payment confirmed — View on Sui Explorer →
            </a>
          )}

          {paymentStatus === 'error' && errorMessage && (
            <p className="text-sm text-error mt-2">{errorMessage}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-zinc-400">Pay with Wallet</label>
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

      <WalletConnectButton variant="form" />

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
          else setError({ type: 'unknown', message: msg || 'An unknown error occurred' });
        }}
      />
    </div>
  )
}
