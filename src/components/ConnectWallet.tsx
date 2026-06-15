'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ConnectWalletProps {
  chain: 'ethereum' | 'solana'
}

export function ConnectWallet({ chain }: ConnectWalletProps) {
  const [mounted, setMounted] = useState(false)
  
  // Wagmi (EVM)
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount()
  const { connect: connectEvm } = useConnect()
  const { disconnect: disconnectEvm } = useDisconnect()

  // Solana
  const { publicKey: solAddress, connected: isSolConnected, disconnect: disconnectSol } = useWallet()
  const { setVisible } = useWalletModal()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white font-medium py-3 px-4 rounded-xl opacity-50 cursor-not-allowed">
        <Wallet className="w-5 h-5" />
        Loading...
      </button>
    )
  }

  const handleConnect = () => {
    if (chain === 'ethereum') {
      connectEvm({ connector: injected() })
    } else {
      setVisible(true)
    }
  }

  const handleDisconnect = () => {
    if (chain === 'ethereum') {
      disconnectEvm()
    } else {
      disconnectSol()
    }
  }

  const isConnected = chain === 'ethereum' ? isEvmConnected : isSolConnected
  const address = chain === 'ethereum' ? evmAddress : solAddress?.toBase58()

  if (isConnected && address) {
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`
    return (
      <button 
        onClick={handleDisconnect}
        className="btn-connect-active"
      >
        <Wallet className="w-5 h-5 group-hover:hidden" />
        <span className="group-hover:hidden">{shortAddress}</span>
        <span className="hidden group-hover:block">Disconnect Wallet</span>
      </button>
    )
  }

  return (
    <button 
      onClick={handleConnect}
      className="btn-connect"
    >
      <Wallet className="w-5 h-5 text-gray-400" />
      Connect {chain === 'ethereum' ? 'EVM' : 'Solana'} Wallet
    </button>
  )
}
