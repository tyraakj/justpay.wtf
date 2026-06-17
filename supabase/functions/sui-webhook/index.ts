import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const SUI_RPC = 'https://fullnode.testnet.sui.io:443'
const MIST_PER_SUI = 1_000_000_000

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const payload = await req.json()
  const { link_id, tx_digest, recipient_address, expected_amount } = payload

  if (!link_id || !tx_digest || !recipient_address || !expected_amount) {
    return new Response(JSON.stringify({ error: 'Missing required params' }), { status: 400, headers: corsHeaders })
  }

  try {
    // Poll Sui RPC to verify transaction (no push webhook available)
    const rpcResponse = await fetch(SUI_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'sui_getTransactionBlock',
        params: [tx_digest, { showBalanceChanges: true, showEffects: true }],
      }),
    })

    const rpcData = await rpcResponse.json()
    const tx = rpcData.result

    if (!tx || tx.effects?.status?.status !== 'success') {
      return new Response(
        JSON.stringify({ error: 'Transaction not confirmed on Sui' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Sum positive balance changes destined for recipient
    const totalMist = (tx.balanceChanges ?? [])
      .filter(
        (c: any) =>
          Number(c.amount) > 0 &&
          c.owner?.AddressOwner === recipient_address
      )
      .reduce((sum: number, c: any) => sum + Number(c.amount), 0)

    const amountReceived = totalMist / MIST_PER_SUI

    // Validate with 0.1% buffer (mirrors helius-webhook logic)
    if (amountReceived < expected_amount * 0.999) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient amount received',
          received: amountReceived,
          expected: expected_amount,
        }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Idempotency guard + status update (same pattern as alchemy-webhook / helius-webhook)
    // payment_links schema has no transaction_hash or completed_at columns —
    // only update status. The tx hash is stored in the transactions table below.
    const { error: updateError } = await supabase
      .from('payment_links')
      .update({ status: 'completed' })
      .eq('id', link_id)
      .eq('status', 'pending')

    if (updateError) throw updateError

    // Log to transactions table — column names match actual schema
    // (payer_chain, amount_paid, token_paid — NOT chain/amount_received)
    await supabase.from('transactions').insert({
      link_id,
      payer_chain: 'sui',
      payer_address: tx.transaction?.data?.sender ?? null,
      tx_hash: tx_digest,
      amount_paid: amountReceived,
      token_paid: 'SUI',
      was_swapped: false,
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    })

    // Supabase Realtime broadcasts automatically to the frontend —
    // no extra work needed here, same as other webhook handlers.

    return new Response(
      JSON.stringify({ success: true, amount_received: amountReceived }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Sui verification error:', err)
    return new Response(
      JSON.stringify({ error: 'Verification failed', detail: String(err) }),
      { status: 500, headers: corsHeaders }
    )
  }
})
