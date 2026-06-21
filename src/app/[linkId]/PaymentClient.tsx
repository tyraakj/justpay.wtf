'use client'

import { useEffect, useCallback, useState, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { EthereumProvider } from '@lifi/widget-provider-ethereum'
import { SolanaProvider } from '@lifi/widget-provider-solana'
import { SuiProvider } from '@lifi/widget-provider-sui'
import { widgetEvents, WidgetEvent } from '@lifi/widget'
import type { Route } from '@lifi/sdk'
import { buildCheckoutWidgetConfig } from '@/lib/web3/lifi-widget-config'
import { useAccount, useSendTransaction, useSwitchChain } from 'wagmi'
import { parseUnits } from 'viem'
import { ArrowRight, Loader2, Check, AlertCircle, Repeat2 } from 'lucide-react'

const LiFiWidget = dynamic(
  () => import('@lifi/widget').then((m) => m.LiFiWidget),
  { ssr: false, loading: () => <WidgetSkeleton /> },
)

function WidgetSkeleton() {
  return (
    <div className="w-full h-[480px] bg-[var(--color-neutral-secondary-soft)] animate-pulse border-[3px] border-black" />
  )
}

// ---------- Chain / Token metadata ----------

const CHAIN_META: Record<string, { name: string; nativeSymbol: string }> = {
  '1': { name: 'Ethereum', nativeSymbol: 'ETH' },
  '56': { name: 'BNB Chain', nativeSymbol: 'BNB' },
  '137': { name: 'Polygon', nativeSymbol: 'MATIC' },
  '42161': { name: 'Arbitrum', nativeSymbol: 'ETH' },
  '10': { name: 'Optimism', nativeSymbol: 'ETH' },
  '8453': { name: 'Base', nativeSymbol: 'ETH' },
  '43114': { name: 'Avalanche', nativeSymbol: 'AVAX' },
  '250': { name: 'Fantom', nativeSymbol: 'FTM' },
  '100': { name: 'Gnosis', nativeSymbol: 'xDAI' },
  'sol': { name: 'Solana', nativeSymbol: 'SOL' },
  'sui': { name: 'Sui', nativeSymbol: 'SUI' },
}

function tokenLogoUrl(symbol: string) {
  return `https://img.logo.dev/crypto/${symbol.toLowerCase()}?token=pk_BShsdiwDTuyRVVBW5GadOg`
}

// ---------- Main PaymentClient ----------

interface PaymentClientProps {
  linkId: Id<'paymentLinks'>
  receiverAddress: string
  destinationChain?: string | null
  destinationTokenSymbol?: string | null
  destinationTokenAddress?: string | null
  amount?: string | null
}

export function PaymentClient({
  linkId,
  receiverAddress,
  destinationChain,
  destinationTokenSymbol,
  destinationTokenAddress,
  amount,
}: PaymentClientProps) {
  const [activeTab, setActiveTab] = useState<'direct' | 'swap'>('direct')
  const [amountWarning, setAmountWarning] = useState<string | null>(null)
  const [isBlocked, setIsBlocked] = useState(false)
  const recordTransaction = useMutation(api.transactions.recordTransaction)

  // Tolerance: route output must be within 10% of the requested amount
  const AMOUNT_TOLERANCE = 0.10

  // Track whether the current route meets the amount requirement.
  // Used by updateTransactionRequestHook to block insufficient transactions.
  const routeSufficientRef = useRef(true)

  const widgetConfig = useMemo(() => buildCheckoutWidgetConfig({
    receiverAddress,
    destinationChain,
    destinationTokenSymbol,
    destinationTokenAddress,
    amount,
  }), [receiverAddress, destinationChain, destinationTokenSymbol, destinationTokenAddress, amount])

  // Memoize the full config + providers to prevent widget remounts
  const fullWidgetConfig = useMemo(() => ({
    ...widgetConfig,
    providers: [EthereumProvider(), SolanaProvider(), SuiProvider()],
  }), [widgetConfig])

  /**
   * Check if a route's output approximately matches the requested amount.
   */
  const isAmountSufficient = useCallback((route: Route): boolean => {
    if (!amount) return true // No amount requirement — always valid

    const requestedAmount = Number(amount)
    if (requestedAmount <= 0) return true

    // Get the estimated output from the route
    const lastStep = route.steps?.[route.steps.length - 1]
    const toAmountRaw = route.toAmount || (lastStep as any)?.execution?.toAmount
    const toTokenDecimals = route.toToken?.decimals ?? 18

    if (toAmountRaw) {
      // Convert from base units to human-readable
      const receivedAmount = Number(toAmountRaw) / Math.pow(10, toTokenDecimals)
      const ratio = receivedAmount / requestedAmount
      return ratio >= (1 - AMOUNT_TOLERANCE)
    }

    // Fallback: check USD values if available
    const toAmountUSD = Number(route.toAmountUSD || 0)
    const fromAmountUSD = Number(route.fromAmountUSD || 0)
    if (toAmountUSD > 0 && fromAmountUSD > 0) {
      return toAmountUSD >= fromAmountUSD * (1 - AMOUNT_TOLERANCE)
    }

    return true // Can't determine — allow
  }, [amount, AMOUNT_TOLERANCE])

  const handleRouteExecutionCompleted = useCallback(async (route: Route) => {
    const firstStep = route?.steps?.[0]
    if (!firstStep?.execution?.process?.[0]?.txHash) return

    const sourceTxHash = firstStep.execution.process[0].txHash
    const sourceChain = firstStep.action?.fromChainId?.toString() ?? 'unknown'
    const sourceToken = (firstStep.action as any)?.fromToken?.address ?? undefined
    const sourceAmount = (firstStep.action as any)?.fromAmount ?? '0'
    const fromAddress = (route as any).fromAddress ?? ''
    const lifiRouteId = (route as any).id ?? undefined

    // Validate: only record if output approximately matches requested amount
    if (!isAmountSufficient(route)) {
      setAmountWarning(
        `Payment received but amount is below the requested ${amount} ${destinationTokenSymbol || 'tokens'}. The receiver may not consider this fulfilled.`
      )
      console.warn('[justpay] Route output below required amount, skipping recording')
      return
    }

    setAmountWarning(null)

    try {
      await recordTransaction({
        linkId,
        payerAddress: fromAddress,
        sourceChain,
        sourceToken,
        sourceTxHash,
        sourceAmount: sourceAmount.toString(),
        lifiRouteId,
      })
    } catch (err) {
      console.error('[justpay] Failed to record transaction to Convex:', err)
    }
  }, [linkId, recordTransaction, isAmountSufficient, amount, destinationTokenSymbol])

  // Monitor available routes for amount validation warnings
  const handleAvailableRoutes = useCallback((routes: Route[]) => {
    if (!amount || routes.length === 0) {
      setAmountWarning(null)
      routeSufficientRef.current = true
      setIsBlocked(false)
      return
    }
    const bestRoute = routes[0]
    if (!isAmountSufficient(bestRoute)) {
      const requestedAmount = Number(amount)
      const toTokenDecimals = bestRoute.toToken?.decimals ?? 18
      const receivedRaw = Number(bestRoute.toAmount || 0)
      const received = receivedRaw / Math.pow(10, toTokenDecimals)
      setAmountWarning(
        `This amount will deliver ~${received.toFixed(4)} ${destinationTokenSymbol || 'tokens'} — below the requested ${requestedAmount}. Increase your input to match.`
      )
      routeSufficientRef.current = false
      setIsBlocked(true)
    } else {
      setAmountWarning(null)
      routeSufficientRef.current = true
      setIsBlocked(false)
    }
  }, [amount, isAmountSufficient, destinationTokenSymbol])

  // Block execution if route output is insufficient
  const handleRouteExecutionStarted = useCallback((route: Route) => {
    if (!isAmountSufficient(route)) {
      routeSufficientRef.current = false
      setIsBlocked(true)
      setAmountWarning(
        `Transaction blocked: output is below the requested ${amount} ${destinationTokenSymbol || 'tokens'}. Increase your input amount.`
      )
    }
  }, [isAmountSufficient, amount, destinationTokenSymbol])

  useEffect(() => {
    widgetEvents.on(WidgetEvent.RouteExecutionCompleted, handleRouteExecutionCompleted)
    widgetEvents.on(WidgetEvent.RouteExecutionStarted, handleRouteExecutionStarted)
    widgetEvents.on(WidgetEvent.AvailableRoutes, handleAvailableRoutes)
    return () => {
      widgetEvents.off(WidgetEvent.RouteExecutionCompleted, handleRouteExecutionCompleted)
      widgetEvents.off(WidgetEvent.RouteExecutionStarted, handleRouteExecutionStarted)
      widgetEvents.off(WidgetEvent.AvailableRoutes, handleAvailableRoutes)
    }
  }, [handleRouteExecutionCompleted, handleRouteExecutionStarted, handleAvailableRoutes])

  const chainMeta = destinationChain ? CHAIN_META[destinationChain] : null
  const tokenSymbol = destinationTokenSymbol || chainMeta?.nativeSymbol || 'TOKEN'

  return (
    <div className="flex flex-col gap-0">
      {/* Tab switcher */}
      <div className="flex border-4 border-black border-b-0">
        <button
          onClick={() => setActiveTab('direct')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 font-black uppercase text-[12px] tracking-wider transition-colors border-r-4 border-black ${activeTab === 'direct'
            ? 'bg-[var(--color-section-green)] text-black'
            : 'bg-white text-black/40 hover:bg-[var(--color-section-green)]/20'
            }`}
        >
          <img
            src={tokenLogoUrl(tokenSymbol)}
            alt={tokenSymbol}
            className="w-5 h-5 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          Pay in {tokenSymbol}
        </button>
        <button
          onClick={() => setActiveTab('swap')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 font-black uppercase text-[12px] tracking-wider transition-colors ${activeTab === 'swap'
            ? 'bg-[var(--color-section-cyan)] text-black'
            : 'bg-white text-black/40 hover:bg-[var(--color-section-cyan)]/20'
            }`}
        >
          <Repeat2 className="w-4 h-4" />
          Any Token
        </button>
      </div>

      {/* Tab content */}
      <div className="border-4 border-black">
        {activeTab === 'direct' ? (
          <DirectPayPanel
            linkId={linkId}
            receiverAddress={receiverAddress}
            destinationChain={destinationChain}
            tokenSymbol={tokenSymbol}
            amount={amount}
          />
        ) : (
          <div className="p-4 flex flex-col gap-3">
            {amountWarning && (
              <div className="flex items-start gap-2 bg-[var(--color-section-yellow)] border-[3px] border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <AlertCircle className="w-5 h-5 text-black shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-black">{amountWarning}</p>
              </div>
            )}
            <div className="relative">
              {/* Overlay on bottom half to block the execute button while allowing amount input changes */}
              {isBlocked && (
                <div className="absolute bottom-0 left-0 right-0 h-1/5 z-50 bg-white/80 backdrop-blur-[2px] flex items-center justify-center pointer-events-auto">
                  <div className="border-4 border-black bg-[var(--color-section-yellow)] px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center max-w-[80%]">
                    <p className="font-black text-xs uppercase text-black">Insufficient amount</p>
                    <p className="text-[11px] font-bold text-black/70 mt-1">Increase input to deliver at least {amount} {destinationTokenSymbol || 'tokens'}</p>
                  </div>
                </div>
              )}
              <LiFiWidget
                integrator="justpay"
                config={fullWidgetConfig}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------- Direct Pay Panel ----------

function DirectPayPanel({
  linkId,
  receiverAddress,
  destinationChain,
  tokenSymbol,
  amount,
}: {
  linkId: Id<'paymentLinks'>
  receiverAddress: string
  destinationChain?: string | null
  tokenSymbol: string
  amount?: string | null
}) {
  const { address, chainId } = useAccount()
  const { sendTransactionAsync } = useSendTransaction()
  const { switchChainAsync } = useSwitchChain()
  const recordTransaction = useMutation(api.transactions.recordTransaction)

  const [status, setStatus] = useState<'idle' | 'switching' | 'sending' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [customAmount, setCustomAmount] = useState(amount || '')

  const destChainId = destinationChain ? Number(destinationChain) : NaN
  const isEvmChain = !isNaN(destChainId)
  const isOnCorrectChain = isEvmChain && chainId === destChainId
  const sendAmount = amount || customAmount
  const canSend = isOnCorrectChain && !!sendAmount && Number(sendAmount) > 0
  const chainMeta = destinationChain ? CHAIN_META[destinationChain] : null

  const handleSwitchChain = async () => {
    if (!isEvmChain) return
    setStatus('switching')
    try {
      await switchChainAsync({ chainId: destChainId })
      setStatus('idle')
    } catch (err: any) {
      setErrorMsg(err?.shortMessage || 'Failed to switch chain')
      setStatus('error')
    }
  }

  const handleDirectPay = async () => {
    if (!address || !sendAmount) return
    setStatus('sending')
    setErrorMsg(null)

    try {
      const hash = await sendTransactionAsync({
        to: receiverAddress as `0x${string}`,
        value: parseUnits(sendAmount, 18),
      })

      setTxHash(hash)
      setStatus('success')

      try {
        await recordTransaction({
          linkId,
          payerAddress: address,
          sourceChain: destChainId.toString(),
          sourceTxHash: hash,
          sourceAmount: sendAmount,
        })
      } catch (err) {
        console.error('[justpay] Failed to record tx:', err)
      }
    } catch (err: any) {
      console.error('[justpay] Direct payment failed:', err)
      setErrorMsg(err?.shortMessage || err?.message || 'Transaction failed')
      setStatus('error')
    }
  }

  if (!address) {
    return (
      <div className="p-6 flex flex-col items-center gap-4 text-center bg-[var(--color-neutral-secondary-soft)]">
        <AlertCircle className="w-10 h-10 text-black/30" />
        <p className="font-bold text-black/50 text-sm">Connect your wallet to pay directly</p>
      </div>
    )
  }

  if (!isEvmChain) {
    return (
      <div className="p-6 flex flex-col items-center gap-4 text-center bg-[var(--color-neutral-secondary-soft)]">
        <p className="font-bold text-black/50 text-sm">
          Direct payment is available for EVM chains. Use the &ldquo;Any Token&rdquo; tab for this chain.
        </p>
      </div>
    )
  }

  return (
    <div className="p-5 flex flex-col gap-4">
      {/* Token & Chain display */}
      <div className="flex items-center gap-3 bg-white border-[3px] border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
        <div className="relative">
          <img
            src={tokenLogoUrl(tokenSymbol)}
            alt={tokenSymbol}
            className="w-10 h-10 object-contain border-2 border-black bg-white"
            onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect fill="%23eee" width="40" height="40"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="16" font-weight="bold">?</text></svg>' }}
          />
          {chainMeta && (
            <img
              src={tokenLogoUrl(chainMeta.nativeSymbol)}
              alt={chainMeta.name}
              className="w-5 h-5 object-contain absolute -bottom-1 -right-1 border border-black bg-white rounded-full"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-black text-lg text-black leading-tight">{tokenSymbol}</span>
          <span className="text-[11px] font-bold text-black/50 uppercase tracking-wider">
            {chainMeta?.name || `Chain ${destinationChain}`}
          </span>
        </div>
        <div className="ml-auto">
          <span className="text-[11px] font-black uppercase tracking-widest text-black bg-[var(--color-section-green)] border-2 border-black px-2 py-1">
            No fees
          </span>
        </div>
      </div>

      {/* Amount */}
      {amount ? (
        <div className="flex items-center justify-between bg-white border-[3px] border-black p-3">
          <span className="text-[11px] font-black uppercase tracking-widest text-black/50">Amount</span>
          <span className="text-2xl font-black text-black">{amount} {tokenSymbol}</span>
        </div>
      ) : (
        <div className="flex items-center border-[3px] border-black bg-white">
          <input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="0.0"
            className="flex-1 px-3 py-3 font-black text-xl text-black bg-transparent outline-none placeholder:text-black/20"
          />
          <span className="px-3 py-3 font-black text-black/40 border-l-[3px] border-black bg-[var(--color-neutral-secondary-soft)]">
            {tokenSymbol}
          </span>
        </div>
      )}

      {/* Chain switch or pay button */}
      {!isOnCorrectChain ? (
        <button
          onClick={handleSwitchChain}
          disabled={status === 'switching'}
          className="w-full flex items-center justify-center gap-2 border-4 border-black bg-[var(--color-section-yellow)] text-black px-4 py-3 font-black uppercase text-base hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-60"
        >
          {status === 'switching' ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Switching...</>
          ) : (
            <>Switch to {chainMeta?.name || `Chain ${destChainId}`}</>
          )}
        </button>
      ) : status === 'success' ? (
        <div className="flex items-center gap-2 bg-[var(--color-section-green)] border-4 border-black px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Check className="w-6 h-6 text-black" strokeWidth={3} />
          <span className="font-black text-black uppercase">Payment Sent!</span>
          {txHash && (
            <a
              href={`https://blockscan.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-xs font-bold underline text-black/60 hover:text-black"
            >
              View tx
            </a>
          )}
        </div>
      ) : status === 'error' ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-[var(--color-danger)] border-4 border-black px-4 py-3">
            <AlertCircle className="w-5 h-5 text-white" />
            <span className="font-bold text-white text-sm">{errorMsg}</span>
          </div>
          <button
            onClick={handleDirectPay}
            className="w-full flex items-center justify-center gap-2 border-4 border-black bg-black text-white px-4 py-3 font-black uppercase text-base hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] transition-all"
          >
            Try Again <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <button
          onClick={handleDirectPay}
          disabled={status === 'sending' || !canSend}
          className="w-full flex items-center justify-center gap-2 border-4 border-black bg-black text-white px-4 py-4 font-black uppercase text-lg hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--color-section-green)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'sending' ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
          ) : (
            <>
              <img src={tokenLogoUrl(tokenSymbol)} alt="" className="w-5 h-5 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              Pay {sendAmount || '...'} {tokenSymbol} <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      )}
    </div>
  )
}
