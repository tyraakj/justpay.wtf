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
      <main className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="border-4 border-black bg-[var(--color-section-pink)] p-12 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-3xl font-black uppercase text-black">Link Not Found</p>
          <p className="font-bold text-black/60 mt-2">This payment link does not exist or was removed.</p>
        </div>
      </main>
    )
  }

  const isExpired = link.expiresAt ? link.expiresAt < Date.now() : false
  const isUnavailable = isExpired || link.status === 'cancelled'

  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-start pt-8 pb-16 px-4 sm:px-6 relative overflow-hidden bg-[var(--color-neutral-primary-soft)]">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_19px,var(--color-border-default)_20px),linear-gradient(90deg,transparent_19px,var(--color-border-default)_20px)] bg-[length:40px_40px] opacity-[0.06] pointer-events-none" />

      <div className="w-full max-w-md z-10 flex flex-col gap-5">
        {/* Brand strip */}
        <div className="flex items-center justify-between border-b-2 border-dashed border-black/20 pb-3">
          <span className="text-[11px] font-black uppercase tracking-widest text-black/40">Powered by</span>
          <span className="text-[13px] font-black uppercase tracking-tighter text-black">justpay.wtf</span>
        </div>

        <PaymentCard
          amount={Number(link.amount) || 0}
          tokenSymbol={link.destinationTokenSymbol ?? 'any token'}
          recipientAddress={link.receiverAddress}
          memo={link.note}
        />

        {isUnavailable ? (
          <div className="border-4 border-black bg-[var(--color-danger)] p-8 flex flex-col items-center gap-4 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-14 h-14 bg-white border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <span className="font-black text-3xl text-black">!</span>
            </div>
            <h2 className="text-2xl font-black uppercase text-white">Link Unavailable</h2>
            <p className="font-bold text-white/80">
              {isExpired ? 'This payment link has expired.' : 'This link was deactivated by its creator.'}
            </p>
          </div>
        ) : (
          <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_var(--color-section-cyan)] flex flex-col">
            {link.expiresAt && (
              <div className="border-b-4 border-black px-4 py-2">
                <ExpiryBadge expiresAt={link.expiresAt} />
              </div>
            )}
            <div className="p-4">
              <CheckoutClient
                linkId={link._id}
                receiverAddress={link.receiverAddress}
                destinationChain={link.destinationChain}
                destinationTokenSymbol={link.destinationTokenSymbol}
                destinationTokenAddress={link.destinationTokenAddress}
                amount={link.amount}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
