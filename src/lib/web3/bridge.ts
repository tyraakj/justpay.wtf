export interface BridgeQuoteParams {
  srcChainId: number // 7565164 for Solana, 1 for ETH, 8453 for Base
  dstChainId: number 
  srcTokenAddress: string // '11111111111111111111111111111111' for SOL, '0x0000000000000000000000000000000000000000' for ETH
  dstTokenAddress: string
  exactOutputAmount: string
  decimals: number
}

// deBridge Chain IDs:
// Solana: 7565164
// Ethereum: 1
// Base: 8453
// Arbitrum: 42161
// Optimism: 10

export async function getBridgeQuote({
  srcChainId,
  dstChainId,
  srcTokenAddress,
  dstTokenAddress,
  exactOutputAmount,
  decimals
}: BridgeQuoteParams) {
  const amountBase = BigInt(Math.floor(parseFloat(exactOutputAmount) * Math.pow(10, decimals))).toString()
  
  // deBridge DLN supports ExactOut by specifying `dstChainTokenOutAmount` 
  const url = new URL('https://dln.debridge.finance/v1.0/dln/order/quote')
  url.searchParams.append('srcChainId', srcChainId.toString())
  url.searchParams.append('srcChainTokenIn', srcTokenAddress)
  url.searchParams.append('dstChainId', dstChainId.toString())
  url.searchParams.append('dstChainTokenOut', dstTokenAddress)
  url.searchParams.append('dstChainTokenOutAmount', amountBase) // EXACT OUT REQUIRED
  url.searchParams.append('prependOperatingExpenses', 'true')
  url.searchParams.append('affiliateFeePercent', '0')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`deBridge quote failed: ${await res.text()}`)
  return res.json()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function buildBridgeTx(
  quoteResponse: any,
  payerAddress: string,
  recipientAddress: string
) {
  const url = new URL('https://dln.debridge.finance/v1.0/dln/order/create-tx')
  url.searchParams.append('srcChainId', quoteResponse.estimation.srcChainId)
  url.searchParams.append('srcChainTokenIn', quoteResponse.estimation.srcChainTokenIn.address)
  url.searchParams.append('srcChainTokenInAmount', quoteResponse.estimation.srcChainTokenIn.amount)
  url.searchParams.append('dstChainId', quoteResponse.estimation.dstChainId)
  url.searchParams.append('dstChainTokenOut', quoteResponse.estimation.dstChainTokenOut.address)
  url.searchParams.append('dstChainTokenOutAmount', quoteResponse.estimation.dstChainTokenOut.amount)
  url.searchParams.append('dstChainTokenOutRecipient', recipientAddress)
  url.searchParams.append('srcChainOrderAuthorityAddress', payerAddress) 
  url.searchParams.append('dstChainOrderAuthorityAddress', recipientAddress)
  
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`deBridge tx creation failed: ${await res.text()}`)
  return res.json()
}
