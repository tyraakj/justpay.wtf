import { v4 as uuidv4 } from 'uuid';

export type PaymentLinkRequest = {
  creatorAddress: string;
  creatorChain: string;
  tokenSymbol: string;
  tokenAddress?: string;
  amount: string;
  creatorEmail?: string;
  label?: string;
  memo?: string;
  expiresAt?: string;
};

export async function createPaymentLink(params: PaymentLinkRequest) {
  // Generate a client-side idempotency key to prevent double-submissions
  const idempotencyKey = uuidv4();

  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      'x-idempotency-key': idempotencyKey
    },
    body: JSON.stringify({
      ...params,
      idempotencyKey
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to create link: ${response.statusText}`);
  }

  return response.json();
}
