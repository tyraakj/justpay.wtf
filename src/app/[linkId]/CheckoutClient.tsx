'use client'

import { useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { EthereumProvider } from '@lifi/widget-provider-ethereum'
import { SolanaProvider } from '@lifi/widget-provider-solana'
import { widgetEvents, WidgetEvent } from '@lifi/widget'
import type { Route } from '@lifi/sdk'
import { buildCheckoutWidgetConfig } from '@/lib/web3/lifi-widget-config'

// Dynamic import — widget requires browser APIs, must not SSR
const LiFiWidget = dynamic(
  () => import('@lifi/widget').then((m) => m.LiFiWidget),
  { ssr: false, loading: () => <WidgetSkeleton /> },
)

function WidgetSkeleton() {
  return (
    <div className="w-full h-[480px] rounded-2xl bg-white/5 animate-pulse border border-white/8" />
  )
}

interface CheckoutClientProps {
  linkId: Id<'paymentLinks'>
  receiverAddress: string
  destinationChain?: string | null
  destinationTokenSymbol?: string | null
  destinationTokenAddress?: string | null
  amount?: string | null
}

export function CheckoutClient({
  linkId,
  receiverAddress,
  destinationChain,
  destinationTokenSymbol,
  destinationTokenAddress,
  amount,
}: CheckoutClientProps) {
  const recordTransaction = useMutation(api.transactions.recordTransaction)

  const widgetConfig = buildCheckoutWidgetConfig({
    receiverAddress,
    destinationChain,
    destinationTokenSymbol,
    destinationTokenAddress,
    amount,
  })

  const handleRouteExecutionCompleted = useCallback(async (route: Route) => {
    const firstStep = route?.steps?.[0]
    if (!firstStep?.execution?.process?.[0]?.txHash) return

    const sourceTxHash = firstStep.execution.process[0].txHash
    const sourceChain = firstStep.action?.fromChainId?.toString() ?? 'unknown'
    const sourceToken = (firstStep.action as any)?.fromToken?.address ?? undefined
    const sourceAmount = (firstStep.action as any)?.fromAmount ?? '0'
    const fromAddress = (route as any).fromAddress ?? ''
    const lifiRouteId = (route as any).id ?? undefined

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
  }, [linkId, recordTransaction])

  useEffect(() => {
    widgetEvents.on(WidgetEvent.RouteExecutionCompleted, handleRouteExecutionCompleted)
    return () => {
      widgetEvents.off(WidgetEvent.RouteExecutionCompleted, handleRouteExecutionCompleted)
    }
  }, [handleRouteExecutionCompleted])

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">
        Pay from any chain or token
      </p>
      <LiFiWidget
        integrator="justpay"
        config={{
          ...widgetConfig,
          providers: [EthereumProvider(), SolanaProvider()],
        }}
      />
    </div>
  )
}
