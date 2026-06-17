'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Wallet, X, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ConnectModal, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';

export function WalletConnectButton({ variant = 'navbar' }: { variant?: 'navbar' | 'form' }) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSuiModalOpen, setIsSuiModalOpen] = useState(false);
  
  const { publicKey, connected: solConnected, disconnect: solDisconnect } = useWallet();
  const { setVisible: setSolanaModalVisible } = useWalletModal();
  
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { connect: evmConnect } = useConnect();
  const { disconnect: evmDisconnect } = useDisconnect();

  const suiAccount = useCurrentAccount();
  const { mutate: suiDisconnect } = useDisconnectWallet();
  const suiConnected = !!suiAccount;

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const connected = solConnected || evmConnected || suiConnected;



  if (!mounted) {
    return (
      <button className={`${variant === 'form' ? 'btn-connect opacity-50' : 'px-5 py-2 rounded-xl bg-white/5 text-white/50 text-sm font-semibold transition-all border border-border'} cursor-not-allowed flex items-center justify-center gap-2 w-full md:w-auto`}>
        <Wallet className="w-4 h-4" />
        Loading...
      </button>
    );
  }

  if (connected) {
    const address = solConnected ? publicKey?.toBase58() : evmConnected ? evmAddress : suiAccount?.address;
    const shortAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : '';
    return (
      <button 
        onClick={() => {
          if (solConnected) solDisconnect();
          if (evmConnected) evmDisconnect();
          if (suiConnected) suiDisconnect();
        }}
        className={`${variant === 'form' ? 'btn-connect-active' : 'px-5 py-2 rounded-xl bg-primary/20 text-primary hover:bg-error/20 hover:text-error hover:border-error/30 text-sm font-semibold transition-all border border-primary/30'} flex items-center justify-center gap-2 group w-full md:w-auto`}
      >
        <Wallet className="w-4 h-4 group-hover:hidden" />
        <span className="group-hover:hidden">{shortAddress}</span>
        <span className="hidden group-hover:inline">Disconnect</span>
      </button>
    );
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`${variant === 'form' ? 'btn-connect' : 'px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-foreground text-sm font-semibold transition-all border border-border'} flex items-center justify-center gap-2 w-full md:w-auto`}
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>

      <ConnectModal
        open={isSuiModalOpen}
        onOpenChange={setIsSuiModalOpen}
      />

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-foreground bg-white/5 rounded-full z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-8 flex flex-col gap-6">
              <h2 className="text-xl font-bold text-foreground text-center mb-2">Connect Wallet</h2>
              
              <button 
                onClick={() => {
                  setIsOpen(false);
                  evmConnect({ connector: injected() });
                }}
                className="flex items-center justify-between p-4 rounded-xl bg-surface border border-white/[0.15] hover:border-white/30 hover:bg-white/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-blue-500" />
                  </div>
                  <span className="font-bold text-foreground">Base (EVM)</span>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-foreground transition-colors" />
              </button>

              <button 
                onClick={() => {
                  setIsOpen(false);
                  setSolanaModalVisible(true);
                }}
                className="flex items-center justify-between p-4 rounded-xl bg-surface border border-white/[0.15] hover:border-white/30 hover:bg-white/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-purple-500" />
                  </div>
                  <span className="font-bold text-foreground">Solana</span>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-foreground transition-colors" />
              </button>

              <button 
                onClick={() => {
                  setIsOpen(false);
                  setIsSuiModalOpen(true);
                }}
                className="flex items-center justify-between p-4 rounded-xl bg-surface border border-white/[0.15] hover:border-white/30 hover:bg-white/5 transition-all group w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#6FBCF0]/20 flex items-center justify-center">
                    <img src="/icons/sui.svg" alt="Sui" className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-foreground">Sui</span>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-foreground transition-colors" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
