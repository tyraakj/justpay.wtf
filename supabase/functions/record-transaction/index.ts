import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    const supabaseClient = createClient(supabaseUrl, supabaseKey)

    const payload = await req.json()
    const { 
      linkId, 
      idempotencyKey, 
      payerAddress, 
      payerChain, 
      txHash, 
      amountPaid, 
      tokenPaid,
      wasSwapped,
      swapFromToken,
      swapProvider,
      bridgeTxHash,
      bridgeProvider
    } = payload

    if (!linkId || !idempotencyKey || !payerAddress || !txHash || !amountPaid || !tokenPaid) {
      throw new Error('Missing required fields')
    }

    const { data, error } = await supabaseClient
      .from('transactions')
      .insert({
        link_id: linkId,
        idempotency_key: idempotencyKey,
        payer_address: payerAddress,
        payer_chain: payerChain,
        tx_hash: txHash,
        amount_paid: amountPaid,
        token_paid: tokenPaid,
        was_swapped: wasSwapped ?? false,
        swap_from_token: swapFromToken,
        swap_provider: swapProvider,
        bridge_tx_hash: bridgeTxHash,
        bridge_provider: bridgeProvider,
        bridge_status: bridgeTxHash ? 'bridging' : null,
        bridge_started_at: bridgeTxHash ? new Date().toISOString() : null,
        status: 'pending' // Awaits webhook confirmation
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
         return new Response(JSON.stringify({ error: 'Idempotency conflict: transaction already recorded' }), {
            status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
         })
      }
      throw error
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
