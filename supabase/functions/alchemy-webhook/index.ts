import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyLifiTransaction } from '../shared/lifi-verifier.ts'

// Alchemy Notify payload format
// https://docs.alchemy.com/reference/notify-api

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? ''
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    const payload = await req.json()
    
    // Webhook validation logic (in prod we'd check Alchemy signature header)
    if (!payload.event || !payload.event.activity) {
      return new Response('Invalid payload', { status: 400 })
    }

    for (const activity of payload.event.activity) {
      const txHash = activity.hash
      
      // 1. Strict duplicate check (Find pending transaction)
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('link_id, payment_links(merchant_email)')
        .eq('source_tx_hash', txHash)
        .single()

      if (txError || !txData) {
        console.log(`Transaction ${txHash} not found in our intent logs. Ignoring.`)
        continue
      }

      // 2. Poll LI.FI API and dispatch emails / state updates via shared verifier
      try {
        await verifyLifiTransaction(supabase, resendApiKey, txData)
      } catch (lifiErr) {
        console.error(`Failed to verify LIFI status for tx ${txHash}:`, lifiErr)
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
