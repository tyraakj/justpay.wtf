export type NetworkMode = 'mainnet' | 'testnet';

export interface ChainConfig {
  id: string | number; // Wagmi ID or LI.FI string ID
  name: string;
  family: 'ethereum' | 'solana' | 'sui';
  isTestnet: boolean;
  tokens: Record<string, string>; // symbol -> address
}

// Ensure the app knows if testnets are enabled
export const ENABLE_TESTNETS = process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' || process.env.NODE_ENV === 'development';

export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  // Mainnets
  ethereum: {
    id: 1,
    name: 'Ethereum',
    family: 'ethereum',
    isTestnet: false,
    tokens: {
      'ETH': '0x0000000000000000000000000000000000000000',
      'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    }
  },
  base: {
    id: 8453,
    name: 'Base',
    family: 'ethereum',
    isTestnet: false,
    tokens: {
      'ETH': '0x0000000000000000000000000000000000000000',
      'USDC': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
    }
  },
  solana: {
    id: 'sol',
    name: 'Solana',
    family: 'solana',
    isTestnet: false,
    tokens: {
      'SOL': '11111111111111111111111111111111',
      'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
    }
  },
  sui: {
    id: 'sui',
    name: 'Sui',
    family: 'sui',
    isTestnet: false,
    tokens: {
      'SUI': '0x2::sui::SUI',
      'USDC': '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC'
    }
  },

  // Testnets
  sepolia: {
    id: 11155111,
    name: 'Sepolia (ETH)',
    family: 'ethereum',
    isTestnet: true,
    tokens: {
      'ETH': '0x0000000000000000000000000000000000000000',
      'USDC': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' // Circle Testnet USDC
    }
  },
  baseSepolia: {
    id: 84532,
    name: 'Base Sepolia',
    family: 'ethereum',
    isTestnet: true,
    tokens: {
      'ETH': '0x0000000000000000000000000000000000000000',
      'USDC': '0x036CbD53842c5426634e7929541eC2318f3dCF7e' // Circle Testnet USDC
    }
  },
  solanaDevnet: {
    id: 'sol',
    name: 'Solana Devnet',
    family: 'solana',
    isTestnet: true,
    tokens: {
      'SOL': '11111111111111111111111111111111',
      'USDC': '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU' // Devnet USDC
    }
  },
  suiTestnet: {
    id: 'sui',
    name: 'Sui Testnet',
    family: 'sui',
    isTestnet: true,
    tokens: {
      'SUI': '0x2::sui::SUI',
      'USDC': '0xa198f3be41cda8c07b3bf3fee02263526e535d682499806979a111e88a5a8d0f::coin::COIN' // Dummy Testnet USDC
    }
  }
};

export const getChainConfig = (chainKey: string): ChainConfig => {
  const config = SUPPORTED_CHAINS[chainKey];
  if (!config) throw new Error(`Unsupported chain key: ${chainKey}`);
  return config;
};
