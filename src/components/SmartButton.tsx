'use client'

import { useState, useEffect } from 'react'
import { useAccount, useSendTransaction } from 'wagmi'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { executeEVMTransfer } from '@/lib/web3/executeEVM'
import { executeSolanaTransfer } from '@/lib/web3/executeSolana'
import { getSwapQuote, constructSwapCalldata } from '@/lib/web3/swap'
import { getBridgeQuote, buildBridgeTx } from '@/lib/web3/bridge'
import { Loader2 } from 'lucide-react'
import { VersionedTransaction } from '@solana/web3.js'

interface SmartButtonProps {
  linkId: string
  chain: 'ethereum' | 'solana'
  recipientAddress: string
  tokenAddress: string | null
  payerChain: 'ethereum' | 'solana'
  inputTokenAddress: string | null
  amount: string
  decimals?: number
  onSuccess: (txHash: string, isBridge?: boolean) => void
}

export function SmartButton({ 
  linkId, 
  chain, 
  recipientAddress, 
  tokenAddress, 
  payerChain,
  inputTokenAddress,
  amount, 
  decimals = 18,
  onSuccess 
}: SmartButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [swapPhase, setSwapPhase] = useState<'IDLE' | 'SWAP_COMPLETE'>('IDLE')
  
  const { address: evmAddress } = useAccount()
  const { sendTransactionAsync } = useSendTransaction()
  const wallet = useWallet()
  const { connection } = useConnection()

  const payerAddress = payerChain === 'ethereum' ? evmAddress : wallet.publicKey?.toBase58()

  // 2-Phase Recovery Mechanism
  useEffect(() => {
    if (payerAddress) {
      const state = sessionStorage.getItem(`envoy_swap:${linkId}:${payerAddress}`)
      if (state === 'SWAP_COMPLETE') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSwapPhase('SWAP_COMPLETE')
      }
    }
  }, [linkId, payerAddress])

  const handleExecute = async () => {
    setIsLoading(true)
    try {
      let txHash: string
      const isBridge = payerChain !== chain
      let wasSwapped = false

      if (isBridge) {
        // CROSS-CHAIN EXECUTION (deBridge)
        const srcChainId = payerChain === 'solana' ? 7565164 : 8453 // Assuming Base for EVM payer for now
        const dstChainId = chain === 'solana' ? 7565164 : 8453
        
        const quote = await getBridgeQuote({
          srcChainId,
          dstChainId,
          srcTokenAddress: inputTokenAddress || (payerChain === 'solana' ? '11111111111111111111111111111111' : '0x0000000000000000000000000000000000000000'),
          dstTokenAddress: tokenAddress || (chain === 'solana' ? '11111111111111111111111111111111' : '0x0000000000000000000000000000000000000000'),
          exactOutputAmount: amount,
          decimals
        })

        const bridgeTx = await buildBridgeTx(quote, payerAddress!, recipientAddress)

        if (payerChain === 'solana') {
          const swapTransactionBuf = Buffer.from(bridgeTx.tx.data, 'hex')
          const transaction = VersionedTransaction.deserialize(swapTransactionBuf)
          txHash = await wallet.sendTransaction(transaction, connection)
        } else {
          txHash = await sendTransactionAsync({
            to: bridgeTx.tx.to as `0x${string}`,
            data: bridgeTx.tx.data as `0x${string}`,
            value: BigInt(bridgeTx.tx.value || 0),
          })
        }

      } else {
        // SAME-CHAIN EXECUTION (Direct or Swap)
        const isSwapRequired = inputTokenAddress && inputTokenAddress !== tokenAddress

        if (isSwapRequired && swapPhase === 'IDLE') {
          // Phase 1: Execute Swap
          wasSwapped = true
          const quote = await getSwapQuote({
            chain,
            inputToken: inputTokenAddress!,
            outputToken: tokenAddress || 'NATIVE',
            exactOutputAmount: amount,
            decimals
          })

          const calldata = await constructSwapCalldata(chain, quote, payerAddress!)

          if (chain === 'solana') {
            const swapTransactionBuf = Buffer.from(calldata, 'base64')
            const transaction = VersionedTransaction.deserialize(swapTransactionBuf)
            txHash = await wallet.sendTransaction(transaction, connection)
          } else {
            txHash = await sendTransactionAsync({
              to: calldata.to as `0x${string}`,
              data: calldata.data as `0x${string}`,
              value: BigInt(calldata.value || 0),
            })
          }

          sessionStorage.setItem(`envoy_swap:${linkId}:${payerAddress}`, 'SWAP_COMPLETE')
          setSwapPhase('SWAP_COMPLETE')
          await new Promise(resolve => setTimeout(resolve, 5000))
        }

        // Phase 2: Direct Payment
        if (chain === 'ethereum') {
          if (!evmAddress) throw new Error('EVM Wallet not connected')
          txHash = await executeEVMTransfer({
            sendTransactionAsync,
            tokenAddress,
            recipientAddress: recipientAddress as `0x${string}`,
            amount,
            decimals
          })
        } else {
          if (!wallet.publicKey) throw new Error('Solana Wallet not connected')
          txHash = await executeSolanaTransfer({
            wallet,
            connection,
            tokenAddress,
            recipientAddress,
            amount,
            decimals
          })
        }
      }

      sessionStorage.removeItem(`envoy_swap:${linkId}:${payerAddress}`)

      // Record the transaction intent
      const idempotencyKey = crypto.randomUUID()
      await fetch('https://[YOUR_SUPABASE_PROJECT_ID].supabase.co/functions/v1/record-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkId,
          idempotencyKey,
          payerAddress,
          payerChain,
          txHash,
          amountPaid: parseFloat(amount),
          tokenPaid: inputTokenAddress || tokenAddress || 'NATIVE',
          wasSwapped,
          bridgeTxHash: isBridge ? txHash : null, // DLN uses the source tx hash as the order ID
          bridgeProvider: isBridge ? 'deBridge' : null
        })
      })

      onSuccess(txHash, isBridge)
      
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : 'Transaction failed')
    } finally {
      setIsLoading(false)
    }
  }

  const isReady = !!payerAddress

  return (
    <button
      onClick={handleExecute}
      disabled={isLoading || !isReady}
      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-hover hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg shadow-primary/25"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          {payerChain !== chain ? 'Bridging & Paying...' : (swapPhase === 'IDLE' && inputTokenAddress !== tokenAddress ? 'Swapping & Paying...' : 'Confirming Payment...')}
        </>
      ) : (
        swapPhase === 'SWAP_COMPLETE' ? `Complete Payment` : `Pay ${amount} ${payerChain !== chain ? 'Cross-Chain' : ''}`
      )}
    </button>
  )
}
