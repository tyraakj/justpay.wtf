import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Helius Enhanced Transaction payload format
// https://docs.helius.dev/webhooks-and-websockets/what-are-webhooks

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? ''
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Helius sends an array of transactions
    const payload = await req.json()
    
    if (!Array.isArray(payload)) {
      return new Response('Invalid payload', { status: 400 })
    }

    for (const transaction of payload) {
      const txHash = transaction.signature
      
      // 1. Strict duplicate check (Find pending transaction)
      // Check both regular tx_hash and bridge_tx_hash (for deBridge Sol source -> EVM dest)
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('link_id, payment_links(email_alert)')
        .or(`tx_hash.eq.${txHash},bridge_tx_hash.eq.${txHash}`)
        .single()

      if (txError || !txData) {
        console.log(`Transaction ${txHash} not found in our intent logs. Ignoring.`)
        continue
      }

      // 2. Mark payment link as completed
      const { error: updateError } = await supabase
        .from('payment_links')
        .update({ status: 'completed' })
        .eq('id', txData.link_id)
        .eq('status', 'active') // Only update if still active (idempotency lock)

      if (updateError) {
        console.error(`Failed to update link ${txData.link_id} or already completed.`)
        continue
      }

      // 3. Dispatch Email Alert
      const merchantEmail = txData.payment_links.email_alert
      if (merchantEmail && resendApiKey) {
        // Idempotency for email to prevent double-sends
        const { error: logError } = await supabase
          .from('email_logs')
          .insert({
            link_id: txData.link_id,
            sent_to: merchantEmail,
            event_type: 'payment_received'
          })

        if (!logError) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'justpay.wtf <notifications@justpay.wtf>',
              to: [merchantEmail],
              subject: 'Payment Received!',
              html: `<p>Your payment link has been successfully fulfilled via Solana.</p><p>Transaction: ${txHash}</p>`
            })
          })
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
