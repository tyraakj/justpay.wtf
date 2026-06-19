import { createClient, getQuote, getStatus, getToken, QuoteRequest } from '@lifi/sdk';

export const lifiClient = createClient({
  integrator: 'justpay',
  disableVersionCheck: true,
});

// Helper to convert chain names to LI.FI chain IDs
export const getLifiChainId = (chainName: string): number | string => {
  switch (chainName.toLowerCase()) {
    case 'ethereum': return 1;
    case 'base': return 8453;
    case 'polygon': return 137;
    case 'arbitrum': return 42161;
    case 'optimism': return 10;
    case 'bsc': return 56;
    case 'solana': return 'sol';
    case 'sui': return 'sui';
    // Testnets
    case 'sepolia': return 11155111;
    case 'basesepolia': return 84532;
    case 'solanadevnet': return 'sol';
    case 'suitestnet': return 'sui';
    default: {
      const n = Number(chainName);
      if (!isNaN(n)) return n; // Already a numeric LI.FI chain ID
      return chainName; // Pass through string IDs like 'sol', 'sui'
    }
  }
};

export interface LifiQuoteParams {
  fromChain: number | string;
  toChain: number | string;
  fromToken: string;
  toToken: string;
  fromAddress: string;
  toAddress: string;
  destinationAmountBase: string; // The exact minimum amount we want the recipient to receive
}

export async function fetchLifiQuote(params: LifiQuoteParams) {
  // 1. Fetch token details to get prices and decimals for heuristic
  const [fromTokenInfo, toTokenInfo] = await Promise.all([
    getToken(lifiClient, params.fromChain as any, params.fromToken),
    getToken(lifiClient, params.toChain as any, params.toToken)
  ]);

  const destHuman = Number(params.destinationAmountBase) / Math.pow(10, toTokenInfo.decimals);
  const destUsd = destHuman * parseFloat(toTokenInfo.priceUSD);
  
  // Base heuristic: how much fromToken is equivalent in USD?
  let heuristicFromHuman = destUsd / parseFloat(fromTokenInfo.priceUSD);
  
  // Add 1% initial buffer to account for typical fees and slippage
  heuristicFromHuman = heuristicFromHuman * 1.01;
  let currentFromAmount = BigInt(Math.floor(heuristicFromHuman * Math.pow(10, fromTokenInfo.decimals))).toString();

  let quote;
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    const quoteRequest: QuoteRequest = {
      fromChain: params.fromChain as any,
      toChain: params.toChain as any,
      fromToken: params.fromToken,
      toToken: params.toToken,
      fromAddress: params.fromAddress,
      toAddress: params.toAddress,
      fromAmount: currentFromAmount,
      fee: 0,
    };
    
    quote = await getQuote(lifiClient, quoteRequest);
    
    const toAmountMin = BigInt(quote.estimate.toAmountMin);
    const targetDest = BigInt(params.destinationAmountBase);

    if (toAmountMin >= targetDest) {
      // Success! We found a fromAmount that satisfies the destinationAmount requirement
      break;
    }

    // We fell short. Calculate deficit and increase fromAmount
    const deficit = targetDest - toAmountMin;
    const deficitHuman = Number(deficit) / Math.pow(10, toTokenInfo.decimals);
    const deficitUsd = deficitHuman * parseFloat(toTokenInfo.priceUSD);
    const extraFromHuman = deficitUsd / parseFloat(fromTokenInfo.priceUSD);
    
    // Add 2% buffer to the deficit to ensure we clear it next time
    const extraFromBase = BigInt(Math.ceil(extraFromHuman * Math.pow(10, fromTokenInfo.decimals) * 1.02));
    
    currentFromAmount = (BigInt(currentFromAmount) + extraFromBase).toString();
    attempts++;
  }

  if (!quote || BigInt(quote.estimate.toAmountMin) < BigInt(params.destinationAmountBase)) {
    throw new Error('Failed to find a route that satisfies the exact output amount');
  }

  return { quote, fromAmount: currentFromAmount };
}

export async function fetchRouteStatus(txHash: string, fromChain: number, toChain: number) {
  return await getStatus(lifiClient, {
    txHash,
    fromChain,
    toChain
  });
}
