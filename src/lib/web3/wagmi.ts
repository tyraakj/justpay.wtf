import { http, createConfig } from 'wagmi'
import { base, mainnet, sepolia, baseSepolia } from 'wagmi/chains'

const endpointBase = typeof window !== 'undefined' ? '/api/rpc/base' : 'https://mainnet.base.org';

export const config = createConfig({
  chains: [mainnet, base, sepolia, baseSepolia],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(endpointBase),
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
  },
})
