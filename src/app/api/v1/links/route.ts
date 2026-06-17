import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const apiKey = authHeader.split(' ')[1];
    
    // In MVP, we validate against a static env var.
    // In production, this would look up an api_keys table in Supabase.
    if (!process.env.MERCHANT_API_KEY || apiKey !== process.env.MERCHANT_API_KEY) {
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 403 });
    }

    const body = await req.json();

    if (body.chain === 'sui' || body.creatorChain === 'sui') {
      const suiAddressRegex = /^0x[a-fA-F0-9]{64}$/
      const address = body.recipient_address || body.creatorAddress
      if (!suiAddressRegex.test(address)) {
        return NextResponse.json({ error: 'Invalid Sui address' }, { status: 400 })
      }
    }

    // Proxy the request to the existing create-link edge function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/create-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
