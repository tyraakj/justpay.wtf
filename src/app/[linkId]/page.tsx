import { supabase } from '@/lib/supabase'
import { PaymentCard } from '@/components/PaymentCard'
import { CheckoutClient } from './CheckoutClient'
import { notFound } from 'next/navigation'

export default async function PaymentPage({ params }: { params: { linkId: string } }) {
  const { data: link } = await supabase
    .from('payment_links')
    .select('*')
    .eq('short_code', params.linkId)
    .single()

  if (!link) {
    notFound()
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 flex flex-col gap-6">
        <PaymentCard 
          amount={link.amount}
          tokenSymbol={link.token_symbol}
          recipientAddress={link.creator_address}
          memo={link.label}
        />

        <div className="glass-card p-6 w-full">
          <CheckoutClient 
            linkId={link.id}
            chain={link.creator_chain}
            recipientAddress={link.creator_address}
            tokenSymbol={link.token_symbol}
            amount={link.amount.toString()}
          />
        </div>
      </div>
    </main>
  )
}
