'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config, connectors } from '@/lib/web3/wagmi'
import { useSyncWagmiConfig } from '@lifi/widget-provider-ethereum'
import { EthereumProvider } from '@lifi/widget-provider-ethereum'
import { SolanaProvider } from '@lifi/widget-provider-solana'
import { WalletManagementProviders } from '@lifi/wallet-management'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { getChains, createClient, ChainType } from '@lifi/sdk'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

// Solana wallet adapter — kept for backward compat with dashboard/auth components
// that use useWallet() from @solana/wallet-adapter-react
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import '@solana/wallet-adapter-react-ui/styles.css'

// Sui — kept separate: @lifi/widget-provider-sui requires @mysten/dapp-kit-react
// which conflicts with @mysten/dapp-kit already installed
import { SuiClientProvider, WalletProvider as SuiWalletProvider } from '@mysten/dapp-kit'
import '@mysten/dapp-kit/dist/index.css'

const queryClient = new QueryClient()

const suiNetworks = {
  mainnet: { url: 'https://fullnode.mainnet.sui.io:443', network: 'mainnet' as const },
  testnet: { url: 'https://fullnode.testnet.sui.io:443', network: 'testnet' as const },
}

const lifiClient = createClient({ integrator: 'justpay', disableVersionCheck: true })

// Widget providers for WalletManagementProviders — enables openWalletMenu() throughout the app.
// EthereumProvider auto-detects our existing WagmiContext and reuses it (no duplication).
// SolanaProvider uses Wallet Standard (different from wallet-adapter — both can coexist).
const walletProviders = [EthereumProvider(), SolanaProvider()]

// Minimal MUI theme — required by WalletMenuModal which calls useMediaQuery(theme => ...).
// Our app doesn't use MUI for UI; this only feeds the wallet modal's breakpoint check.
const muiTheme = createTheme()

function ChainSyncer() {
  const { data: chains } = useQuery({
    queryKey: ['lifi-chains'],
    queryFn: () => getChains(lifiClient, {
      chainTypes: [ChainType.EVM, ChainType.SVM, ChainType.UTXO, ChainType.MVM, ChainType.TVM],
    }),
    staleTime: 1000 * 60 * 60,
    gcTime: Infinity,
  })
  useSyncWagmiConfig(config, connectors, chains ?? [])
  return null
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const isTestnet = process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true'
  const solanaEndpoint = useMemo(() =>
    isTestnet
      ? 'https://api.devnet.solana.com'
      : typeof window !== 'undefined'
        ? window.location.origin + '/api/rpc/solana'
        : 'https://api.mainnet-beta.solana.com',
    [isTestnet]
  )
  const wallets = useMemo(() => [], [])
  const onError = useCallback((error: Error) => { console.error(error) }, [])

  return (
    <WagmiProvider config={config} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <ChainSyncer />
        {/* ThemeProvider satisfies WalletMenuModal's useMediaQuery(theme => theme.breakpoints...) */}
        <ThemeProvider theme={muiTheme}>
          <WalletManagementProviders providers={walletProviders}>
            <SuiClientProvider networks={suiNetworks} defaultNetwork="testnet">
              <SuiWalletProvider autoConnect onError={onError}>
                <ConnectionProvider endpoint={solanaEndpoint}>
                  <SolanaWalletProvider wallets={wallets} autoConnect={false} onError={onError}>
                    <WalletModalProvider>
                      {children}
                    </WalletModalProvider>
                  </SolanaWalletProvider>
                </ConnectionProvider>
              </SuiWalletProvider>
            </SuiClientProvider>
          </WalletManagementProviders>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
