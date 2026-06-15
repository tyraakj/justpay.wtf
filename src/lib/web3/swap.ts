export interface SwapQuoteParams {
  chain: 'ethereum' | 'solana'
  inputToken: string
  outputToken: string
  exactOutputAmount: string // Must output EXACTLY this amount
  decimals: number
  slippageBps?: number
}

export async function getSwapQuote({
  chain,
  inputToken,
  outputToken,
  exactOutputAmount,
  decimals,
  slippageBps = 50 // 0.5%
}: SwapQuoteParams) {
  const amountBase = BigInt(Math.floor(parseFloat(exactOutputAmount) * Math.pow(10, decimals))).toString()

  if (chain === 'solana') {
    // Jupiter V2 API using exactOut
    // Add +0.1% to target amount to ensure absolute delivery after fees
    const adjustedAmount = (BigInt(amountBase) * BigInt(1001)) / BigInt(1000)

    const url = `https://quote-api.jup.ag/v6/quote?inputMint=${inputToken}&outputMint=${outputToken}&amount=${adjustedAmount.toString()}&slippageBps=${slippageBps}&swapMode=ExactOut`
    
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Jupiter quote failed: ${await res.text()}`)
    return res.json()

  } else {
    // 0x API for EVM
    // Query using the ExactOut equivalent in 0x (buyAmount)
    const url = new URL('https://api.0x.org/swap/v1/quote')
    url.searchParams.append('buyToken', outputToken)
    url.searchParams.append('sellToken', inputToken)
    url.searchParams.append('buyAmount', amountBase) // ExactOut
    url.searchParams.append('slippagePercentage', (slippageBps / 10000).toString())

    const res = await fetch(url.toString(), {
      headers: {
        '0x-api-key': process.env.NEXT_PUBLIC_0X_API_KEY || ''
      }
    })
    
    if (!res.ok) throw new Error(`0x quote failed: ${await res.text()}`)
    return res.json()
  }
}

export async function constructSwapCalldata(
  chain: 'ethereum' | 'solana',
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  quoteResponse: any,
  payerAddress: string
) {
  if (chain === 'solana') {
    // Jupiter Swap construction
    const res = await fetch('https://quote-api.jup.ag/v6/swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey: payerAddress,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 'auto'
      })
    })

    if (!res.ok) throw new Error(`Jupiter swap construction failed: ${await res.text()}`)
    const { swapTransaction } = await res.json()
    return swapTransaction // Base64 encoded transaction

  } else {
    // 0x swap construction is already included in the quote response
    return {
      to: quoteResponse.to,
      data: quoteResponse.data,
      value: quoteResponse.value,
      allowanceTarget: quoteResponse.allowanceTarget,
      sellTokenAddress: quoteResponse.sellTokenAddress
    }
  }
}
