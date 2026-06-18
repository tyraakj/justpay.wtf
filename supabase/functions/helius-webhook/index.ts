import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { verifyLifiTransaction } from '../shared/lifi-verifier.ts'

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
        .select('link_id, payment_links(merchant_email)')
        .or(`source_tx_hash.eq.${txHash},bridge_tx_hash.eq.${txHash}`)
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
