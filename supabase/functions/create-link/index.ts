import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { nanoid } from 'https://esm.sh/nanoid@4.0.2'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const STRICT_TOKEN_LIST = [
  'USDC', 'USDT', 'DAI', 'WETH', 'WSOL', 'EURC', 'USDe', 'ETH', 'SOL', 'SUI'
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    const supabaseClient = createClient(supabaseUrl, supabaseKey)

    const payload = await req.json()
    const { creatorAddress, creatorChain, creatorEmail, tokenSymbol, tokenAddress, amount, label, memo } = payload

    if (!creatorAddress || !creatorChain || !tokenSymbol || !amount) {
      throw new Error('Missing required fields')
    }

    if (parseFloat(amount) < 1) {
      return new Response(JSON.stringify({ error: 'Minimum link amount is $1.00 to prevent spam' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    if (creatorChain === 'sui') {
      const suiAddressRegex = /^0x[a-fA-F0-9]{64}$/
      if (!suiAddressRegex.test(creatorAddress)) {
        return new Response(
          JSON.stringify({ error: 'Invalid Sui address format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (tokenSymbol !== 'SUI' || tokenAddress !== '0x2::sui::SUI') {
        return new Response(
          JSON.stringify({ error: 'Token not supported on Sui testnet' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const clientIp = req.headers.get('x-forwarded-for') || 'unknown'

    // Rate Limiting Check (Max 10 per minute per address OR IP)
    const { count } = await supabaseClient
      .from('payment_links')
      .select('*', { count: 'exact', head: true })
      .or(`creator_address.eq.${creatorAddress},creator_ip.eq.${clientIp}`)
      .gte('created_at', new Date(Date.now() - 60_000).toISOString())

    if (count && count >= 10) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { 
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // StrictTokenList validation
    if (!STRICT_TOKEN_LIST.includes(tokenSymbol)) {
      return new Response(JSON.stringify({ error: 'Token not supported. Strict Token List enforced.' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Generate short URL and idempotency key
    const shortCode = nanoid(8)
    const idempotencyKey = crypto.randomUUID()

    // Insert payment link
    const { data, error } = await supabaseClient
      .from('payment_links')
      .insert({
        short_code: shortCode,
        idempotency_key: idempotencyKey,
        creator_address: creatorAddress,
        creator_chain: creatorChain,
        creator_email: creatorEmail,
        creator_ip: clientIp,
        token_symbol: tokenSymbol,
        token_address: tokenAddress,
        amount: amount,
        label: label,
        memo: memo,
        expires_at: payload.expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString() // default 15 mins
      })
      .select()
      .single()

    if (error) {
      // Idempotency conflict usually throws a unique constraint error
      if (error.code === '23505') {
         return new Response(JSON.stringify({ error: 'Idempotency conflict or shortcode collision' }), {
            status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
         })
      }
      throw error
    }

    // TODO: Register webhook via Alchemy/Helius (Phase 6 Asynchronous Fulfillment)
    
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
