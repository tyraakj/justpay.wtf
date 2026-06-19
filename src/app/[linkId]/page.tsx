// No 'use client' — this is a Server Component
import { fetchQuery } from 'convex/nextjs'
import { api } from '../../../convex/_generated/api'
import { PaymentCard } from '@/components/PaymentCard'
import { CheckoutClient } from './CheckoutClient'
import { ExpiryBadge } from '@/components/ExpiryBadge'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ linkId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { linkId } = await params
  try {
    const link = await fetchQuery(api.links.getLinkByShortCode, { shortCode: linkId })
    if (!link) return { title: 'Payment Link — justpay.wtf' }

    const tokenPart = link.destinationTokenSymbol ?? 'crypto'
    const chainPart = link.destinationChain ? ` on chain ${link.destinationChain}` : ''
    const amountLabel = link.amount ? `${link.amount} ${tokenPart}` : tokenPart
    const shortAddr = link.receiverAddress.slice(0, 8) + '…'
    return {
      title: `Pay ${amountLabel}${chainPart} — justpay.wtf`,
      description: link.note ?? `Send ${amountLabel} to ${shortAddr}`,
      openGraph: {
        title: `Pay ${amountLabel}`,
        description: link.note ?? `Cross-chain payment powered by justpay.wtf`,
        siteName: 'justpay.wtf',
      },
    }
  } catch {
    return { title: 'Payment Link — justpay.wtf' }
  }
}

export default async function PaymentPage({ params }: Props) {
  const { linkId } = await params
  const link = await fetchQuery(api.links.getLinkByShortCode, { shortCode: linkId })

  if (!link) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-bold text-black uppercase">Payment link not found.</p>
      </main>
    )
  }

  const isExpired = link.expiresAt ? link.expiresAt < Date.now() : false
  const isUnavailable = isExpired || link.status === 'cancelled'

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 flex flex-col gap-6">
        <PaymentCard
          amount={Number(link.amount) || 0}
          tokenSymbol={link.destinationTokenSymbol ?? 'any token'}
          recipientAddress={link.receiverAddress}
          memo={link.note}
        />

        <div className="glass-card p-6 w-full">
          {isUnavailable ? (
            <div className="flex flex-col items-center justify-center text-center gap-4 py-6 border border-error/20 bg-error/5 rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-error/20 flex items-center justify-center mb-2">
                <div className="w-6 h-6 rounded-full bg-error flex items-center justify-center text-white font-bold text-lg">!</div>
              </div>
              <h2 className="text-xl font-bold text-error">Payment Unavailable</h2>
              <p className="text-zinc-400 text-sm max-w-xs">
                {isExpired ? 'This payment link has expired.' : 'This payment link was deactivated by the creator.'}
              </p>
            </div>
          ) : (
            <>
              {link.expiresAt && <ExpiryBadge expiresAt={link.expiresAt} />}
              <CheckoutClient
                linkId={link._id}
                receiverAddress={link.receiverAddress}
                destinationChain={link.destinationChain}
                destinationTokenSymbol={link.destinationTokenSymbol}
                destinationTokenAddress={link.destinationTokenAddress}
                amount={link.amount}
              />
            </>
          )}
        </div>
      </div>
    </main>
  )
}
