'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Wallet, X, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ConnectModal, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { BrutalistButton } from '../brutalism/Button';
import { createPortal } from 'react-dom';

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
      <BrutalistButton variant="tertiary" className="opacity-50 cursor-not-allowed">
        <Wallet className="w-5 h-5 mr-2" strokeWidth={3} />
        <span className="uppercase tracking-wider">Loading...</span>
      </BrutalistButton>
    );
  }

  if (connected) {
    const address = solConnected ? publicKey?.toBase58() : evmConnected ? evmAddress : suiAccount?.address;
    const shortAddress = address ? `${address.slice(0, 4)}...${address.slice(-4)}` : '';
    return (
      <BrutalistButton 
        variant="brand"
        onClick={() => {
          if (solConnected) solDisconnect();
          if (evmConnected) evmDisconnect();
          if (suiConnected) suiDisconnect();
        }}
        className="group min-w-[140px]"
      >
        <Wallet className="w-5 h-5 mr-2 group-hover:hidden" strokeWidth={3} />
        <span className="uppercase tracking-wider font-black group-hover:hidden">{shortAddress}</span>
        <span className="uppercase tracking-wider font-black hidden group-hover:inline text-black">Disconnect</span>
      </BrutalistButton>
    );
  }

  return (
    <>
      <BrutalistButton 
        variant="tertiary"
        onClick={() => setIsOpen(true)}
      >
        <Wallet className="w-5 h-5 mr-2" strokeWidth={3} />
        <span className="uppercase tracking-wider font-black">Connect Wallet</span>
      </BrutalistButton>

      <ConnectModal
        trigger={<span className="hidden" />}
        open={isSuiModalOpen}
        onOpenChange={setIsSuiModalOpen}
      />

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--color-neutral-primary-soft)] border-4 border-black w-full max-w-sm relative animate-in fade-in zoom-in duration-200 shadow-[var(--shadow-xl)] transform rotate-1">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute -top-4 -right-4 bg-[var(--color-section-pink)] border-4 border-black p-2 text-black hover:bg-[var(--color-section-yellow)] shadow-[var(--shadow-xs)] transition-colors z-10"
            >
              <X className="w-6 h-6" strokeWidth={3} />
            </button>
            <div className="p-8 flex flex-col gap-6">
              <h2 className="text-[28px] font-black text-black text-center mb-2 uppercase border-b-4 border-black pb-2">Connect Wallet</h2>
              
              <button 
                onClick={() => {
                  setIsOpen(false);
                  evmConnect({ connector: injected() });
                }}
                className="flex items-center justify-between p-4 bg-blue-100 border-4 border-black hover:bg-blue-300 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[var(--shadow-sm)] transition-all group w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 border-2 border-black flex items-center justify-center shadow-[var(--shadow-xs)]">
                    <div className="w-4 h-4 rounded-full bg-white border-2 border-black" />
                  </div>
                  <span className="font-black text-[18px] text-black uppercase tracking-wider">Base (EVM)</span>
                </div>
                <ChevronRight className="w-6 h-6 text-black group-hover:translate-x-1 transition-transform" strokeWidth={3} />
              </button>

              <button 
                onClick={() => {
                  setIsOpen(false);
                  setSolanaModalVisible(true);
                }}
                className="flex items-center justify-between p-4 bg-purple-100 border-4 border-black hover:bg-purple-300 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[var(--shadow-sm)] transition-all group w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500 border-2 border-black flex items-center justify-center shadow-[var(--shadow-xs)]">
                    <div className="w-5 h-5 rounded-full bg-white border-2 border-black" />
                  </div>
                  <span className="font-black text-[18px] text-black uppercase tracking-wider">Solana</span>
                </div>
                <ChevronRight className="w-6 h-6 text-black group-hover:translate-x-1 transition-transform" strokeWidth={3} />
              </button>

              <button 
                onClick={() => {
                  setIsOpen(false);
                  setIsSuiModalOpen(true);
                }}
                className="flex items-center justify-between p-4 bg-[#6FBCF0]/20 border-4 border-black hover:bg-[#6FBCF0]/40 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[var(--shadow-sm)] transition-all group w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#6FBCF0] border-2 border-black flex items-center justify-center shadow-[var(--shadow-xs)]">
                    <img src="/icons/sui.svg" alt="Sui" className="w-5 h-5" />
                  </div>
                  <span className="font-black text-[18px] text-black uppercase tracking-wider">Sui</span>
                </div>
                <ChevronRight className="w-6 h-6 text-black group-hover:translate-x-1 transition-transform" strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
