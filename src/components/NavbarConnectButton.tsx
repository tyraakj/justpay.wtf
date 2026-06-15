'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Wallet, X, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function NavbarConnectButton() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const { publicKey, connected: solConnected, disconnect: solDisconnect } = useWallet();
  const { setVisible: setSolanaModalVisible } = useWalletModal();
  
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { connect: evmConnect } = useConnect();
  const { disconnect: evmDisconnect } = useDisconnect();

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const connected = solConnected || evmConnected;

  useEffect(() => {
    if (connected && pathname === '/') {
      router.push('/dashboard');
    }
  }, [connected, pathname, router]);

  if (!mounted) {
    return (
      <button className="px-5 py-2 rounded-xl bg-white/5 text-white/50 text-sm font-semibold transition-all border border-white/5 cursor-not-allowed flex items-center gap-2">
        <Wallet className="w-4 h-4" />
        Loading...
      </button>
    );
  }

  if (connected) {
    const address = solConnected ? publicKey?.toBase58() : evmAddress;
    const shortAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : '';
    return (
      <button 
        onClick={() => {
          if (solConnected) solDisconnect();
          if (evmConnected) evmDisconnect();
        }}
        className="px-5 py-2 rounded-xl bg-primary/20 text-primary hover:bg-error/20 hover:text-error hover:border-error/30 text-sm font-semibold transition-all border border-primary/30 flex items-center gap-2 group"
      >
        <Wallet className="w-4 h-4" />
        <span className="group-hover:hidden">{shortAddress}</span>
        <span className="hidden group-hover:inline">Disconnect</span>
      </button>
    );
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all border border-white/5 flex items-center gap-2"
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 rounded-full z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-8 flex flex-col gap-6">
              <h2 className="text-xl font-bold text-white text-center mb-2">Connect Wallet</h2>
              
              <button 
                onClick={() => {
                  setIsOpen(false);
                  evmConnect({ connector: injected() });
                }}
                className="flex items-center justify-between p-4 rounded-xl bg-[#0A0A0A] border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-blue-500" />
                  </div>
                  <span className="font-bold text-white">Ethereum (EVM)</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
              </button>

              <button 
                onClick={() => {
                  setIsOpen(false);
                  setSolanaModalVisible(true);
                }}
                className="flex items-center justify-between p-4 rounded-xl bg-[#0A0A0A] border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-purple-500" />
                  </div>
                  <span className="font-bold text-white">Solana</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
