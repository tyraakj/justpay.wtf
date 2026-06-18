'use client'

import { useParams } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { PaymentCard } from '@/components/PaymentCard'
import { CheckoutClient } from './CheckoutClient'

export default function PaymentPage() {
  const params = useParams()
  const linkId = params.linkId as string

  const link = useQuery(api.links.getLinkByShortCode, { shortCode: linkId })

  if (link === undefined) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-bold text-black uppercase animate-pulse">Loading...</p>
      </main>
    )
  }

  if (link === null) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-bold text-black uppercase">Payment link not found.</p>
      </main>
    )
  }

  const isExpired = link.expiresAt ? link.expiresAt < Date.now() : false
  const isCancelled = link.status === 'cancelled'

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 flex flex-col gap-6">
        <PaymentCard 
          amount={Number(link.amount) || 0}
          tokenSymbol={link.destinationTokenSymbol}
          recipientAddress={link.merchantAddress}
          memo={link.label}
        />

        <div className="glass-card p-6 w-full">
          {isExpired || isCancelled ? (
            <div className="flex flex-col items-center justify-center text-center gap-4 py-6 border border-error/20 bg-error/5 rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-error/20 flex items-center justify-center mb-2">
                <div className="w-6 h-6 rounded-full bg-error flex items-center justify-center text-white font-bold text-lg">!</div>
              </div>
              <h2 className="text-xl font-bold text-error">Payment Unavailable</h2>
              <p className="text-zinc-400 text-sm max-w-xs">
                {isExpired ? "This payment link has expired." : "This payment link was deactivated by the creator."}
              </p>
            </div>
          ) : (
            <CheckoutClient 
              linkId={link._id}
              chain={link.destinationChain}
              recipientAddress={link.merchantAddress}
              tokenSymbol={link.destinationTokenSymbol}
              amount={(link.amount || '0').toString()}
            />
          )}
        </div>
      </div>
    </main>
  )
}
