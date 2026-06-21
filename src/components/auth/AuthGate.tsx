'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount, useSignMessage } from 'wagmi';
import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';
import { verifyMessage } from 'viem';
import { BrutalistButton } from '@/components/brutalism/Button';
import { ShieldAlert } from 'lucide-react';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { publicKey, signMessage: solSignMessage } = useWallet();
  const { address: evmAddress } = useAccount();
  const { signMessageAsync: evmSignMessage } = useSignMessage();
  const suiAccount = useCurrentAccount();
  const { mutateAsync: suiSignMessage } = useSignPersonalMessage();

  const currentAddress = evmAddress || publicKey?.toBase58() || suiAccount?.address;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (currentAddress) {
      const authSession = localStorage.getItem(`justpay_auth_${currentAddress}`);
      if (authSession === 'true') {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
  }, [currentAddress]);

  const handleAuthenticate = async () => {
    if (!currentAddress) return;
    setIsSigning(true);
    try {
      const message = `Sign this message to authenticate with JustPay.\n\nAddress: ${currentAddress}\nNonce: ${Date.now()}`;
      
      if (evmAddress && currentAddress === evmAddress) {
        const signature = await evmSignMessage({ message });
        const valid = await verifyMessage({ address: evmAddress as `0x${string}`, message, signature });
        if (!valid) throw new Error("Invalid EVM signature");
      } else if (publicKey && solSignMessage && currentAddress === publicKey.toBase58()) {
        const encodedMessage = new TextEncoder().encode(message);
        await solSignMessage(encodedMessage);
        // If signMessage doesn't throw, the user successfully signed it.
      } else if (suiAccount && currentAddress === suiAccount.address) {
        await suiSignMessage({
            message: new TextEncoder().encode(message)
        });
        // If it doesn't throw, the user successfully signed it.
      } else {
        throw new Error("No wallet capable of signing was found.");
      }

      localStorage.setItem(`justpay_auth_${currentAddress}`, 'true');
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Auth failed:", error);
      alert("Authentication failed or was cancelled.");
    } finally {
      setIsSigning(false);
    }
  };

  if (!mounted) return null;

  if (!currentAddress) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 border-4 border-black bg-[var(--color-section-pink)] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-3xl mx-auto mt-12 text-center">
        <ShieldAlert className="w-16 h-16 text-black mb-6" strokeWidth={3} />
        <h2 className="text-[32px] md:text-[40px] font-black uppercase text-black mb-4 leading-tight">Wallet Not Connected</h2>
        <p className="text-[18px] font-bold text-black border-t-4 border-black pt-4 w-full">Please connect your wallet using the button in the top right to access your dashboard.</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 border-4 border-black bg-[var(--color-section-yellow)] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-3xl mx-auto mt-12 text-center">
        <ShieldAlert className="w-16 h-16 text-black mb-6" strokeWidth={3} />
        <h2 className="text-[32px] md:text-[40px] font-black uppercase text-black mb-2 leading-tight">Authentication Required</h2>
        <p className="text-[18px] font-bold text-black mb-8 border-t-4 border-black pt-4 w-full">Sign a message with your wallet to verify ownership and view your private dashboard data.</p>
        
        <BrutalistButton 
          variant="brand" 
          onClick={handleAuthenticate}
          disabled={isSigning}
          className="w-full sm:w-auto px-8 py-4 text-[18px]"
        >
          {isSigning ? 'Waiting for signature...' : 'Sign Message to Authenticate'}
        </BrutalistButton>
      </div>
    );
  }

  return <>{children}</>;
}
