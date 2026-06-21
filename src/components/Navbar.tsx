'use client';

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FaLinkedinIn, FaInstagram } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { WalletConnectButton } from './shared/WalletConnectButton';
import { useAuth } from '@/lib/useAuth';
import { useWalletMenu } from '@lifi/wallet-management';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount, useSignMessage } from 'wagmi';
import { useAccount as useLiFiAccount } from '@lifi/wallet-management';
import { ChainType } from '@lifi/sdk';
import { useDAppKit } from '@mysten/dapp-kit-react';
import { verifyMessage } from 'viem';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [chainsOpen, setChainsOpen] = useState(false);
  const { isAuthenticated, isConnected, currentAddress, markAuthenticated } = useAuth();
  const { openWalletMenu } = useWalletMenu();
  const router = useRouter();

  // Signing hooks
  const { publicKey, signMessage: solSignMessage } = useWallet();
  const { address: evmAddress } = useAccount();
  const { signMessageAsync: evmSignMessage } = useSignMessage();
  const { account: suiAccount } = useLiFiAccount({ chainType: ChainType.MVM });
  const dappKit = useDAppKit();

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const handleDashboardClick = useCallback(async () => {
    // Already authenticated — just navigate
    if (isAuthenticated) {
      router.push('/dashboard');
      setOpen(false);
      return;
    }

    // Not connected — open wallet picker first
    if (!isConnected) {
      openWalletMenu();
      return;
    }

    // Connected but not authenticated — sign message
    if (!currentAddress) return;
    try {
      const message = `Sign this message to authenticate with JustPay.\n\nAddress: ${currentAddress}\nNonce: ${Date.now()}`;

      if (publicKey && solSignMessage) {
        await solSignMessage(new TextEncoder().encode(message));
      } else if (evmAddress) {
        const signature = await evmSignMessage({ message });
        const valid = await verifyMessage({ address: evmAddress as `0x${string}`, message, signature });
        if (!valid) throw new Error('Invalid EVM signature');
      } else if (suiAccount?.address) {
        await dappKit.signPersonalMessage({ message: new TextEncoder().encode(message) });
      } else {
        throw new Error('No wallet capable of signing was found.');
      }

      localStorage.setItem(`justpay_auth_${currentAddress}`, 'true');
      markAuthenticated(currentAddress);
      router.push('/dashboard');
      setOpen(false);
    } catch (err) {
      console.error('Auth failed:', err);
    }
  }, [isAuthenticated, isConnected, currentAddress, openWalletMenu, router, publicKey, solSignMessage, evmAddress, evmSignMessage, suiAccount?.address, dappKit, markAuthenticated]);

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (window.location.pathname === '/') {
      e.preventDefault();
      setOpen(false);
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } else {
      setOpen(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
      ></div>
      <div className="fixed z-[100] left-1/2 -translate-x-1/2 top-5 font-sans w-[625px]">
        <motion.nav
          initial={{ width: "625px", x: "0px" }}
          animate={{ width: open ? "1000px" : "625px", x: open ? "-187.5px" : "0px" }} // Center expansion compensation
          transition={{
            duration: open ? 0.3 : 0.45,
            ease: open ? "circOut" : [0.22, 1, 0.36, 1],
            delay: open ? 0 : 0.5,
          }}
          className="relative z-[100] bg-[#111111] h-14 p-3 pr-1.5 flex items-center justify-between border-2 border-black shadow-[var(--shadow-md)]"
        >
          <div
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 text-white cursor-pointer ml-2 hover:opacity-80 transition-opacity"
          >
            <div className="flex flex-col gap-[6px] w-6">
              <motion.span
                initial={{ rotate: 0, translateY: 0 }}
                animate={{
                  rotate: open ? 45 : 0,
                  translateY: open ? 4 : 0,
                }}
                transition={{ duration: 0.35, delay: open ? 0 : 0.3 }}
                className="h-[2px] w-full bg-white origin-center"
              />
              <motion.span
                initial={{ rotate: 0, translateY: 0 }}
                animate={{
                  rotate: open ? -45 : 0,
                  translateY: open ? -4 : 0,
                }}
                transition={{ duration: 0.35, delay: open ? 0 : 0.3 }}
                className="h-[2px] w-full bg-white origin-center"
              />
            </div>
            <h3 className="text-[16px] font-bold uppercase tracking-wider ml-1 m-0">Menu</h3>
          </div>
          <Link href="/">
            <h3 className="text-white text-[24px] font-black tracking-tighter m-0 hover:text-[var(--color-section-brand)] transition-colors">
              JUSTPAY.WTF
            </h3>
          </Link>
          <div className="text-[16px] flex items-center gap-2">
            <button
              onClick={handleDashboardClick}
              className="px-4 py-1.5 text-[14px] rounded-none font-bold bg-[#333333] text-white hover:bg-[var(--color-section-cyan)] hover:text-black transition-colors border-2 border-black cursor-pointer"
            >
              Dashboard
            </button>
            <div className="scale-90 origin-right">
              <WalletConnectButton variant="navbar" />
            </div>
          </div>
        </motion.nav>

        <motion.div
          initial={{
            transformOrigin: "top center",
            y: -10,
            opacity: 0,
            scaleY: 0.95,
            x: "-187.5px"
          }}
          animate={{
            y: open ? 0 : -10,
            opacity: open ? 1 : 0,
            scaleY: open ? 1 : 0.95,
            x: "-187.5px"
          }}
          transition={{
            delay: open ? 0.3 : 0,
            duration: open ? 0.4 : 0.4,
            ease: open ? "circOut" : [0.4, 0, 0.2, 1],
          }}
          style={{ pointerEvents: open ? 'auto' : 'none' }}
          className="w-[1000px] z-[90] absolute top-full mt-2 h-[500px] bg-[#111111] p-6 flex items-center justify-center border-2 border-black shadow-[var(--shadow-xl)]"
        >
          <motion.div className="flex-1 h-full bg-[#1E1E1E] flex flex-col p-8 text-white/80 border-2 border-black">
            <h3 className="text-[12px] font-bold text-white/50 uppercase tracking-widest m-0">
              OUR PRODUCTS
            </h3>
            <div className="mt-6 flex flex-col gap-2">
              <button onClick={handleDashboardClick} className="py-4 border-b-2 border-white/10 text-[24px] font-bold text-white hover:text-[var(--color-section-cyan)] transition-colors text-left cursor-pointer">
                Dashboard
              </button>

              <button onClick={handleDashboardClick} className="flex items-center py-4 border-b-2 border-white/10 gap-4 cursor-pointer hover:text-[var(--color-section-cyan)] transition-colors text-left">
                <div className="text-[24px] font-bold text-white">Create Link</div>
                <span className="bg-[var(--color-section-pink)] text-black border-2 border-black px-2 py-0.5 text-[12px] font-bold">
                  ACTIVE
                </span>
              </button>

              <button onClick={handleDashboardClick} className="py-4 border-b-2 border-white/10 text-[24px] font-bold text-white hover:text-[var(--color-section-cyan)] transition-colors cursor-pointer text-left">
                Transactions
              </button>
            </div>

          </motion.div>

          <motion.div className="flex-1 h-full flex flex-col p-8 text-white/80 border-y-2 border-black border-r-2 bg-[#111111]">
            <h3 className="text-[12px] font-bold text-white/50 uppercase tracking-widest m-0">EXPLORE</h3>
            <div className="mt-6 flex flex-col gap-2">
              <div className="border-b-2 border-white/10">
                <button
                  onClick={() => setChainsOpen(!chainsOpen)}
                  className="w-full text-left py-4 flex items-center justify-between text-[24px] font-bold text-white hover:text-[var(--color-section-yellow)] transition-colors cursor-pointer"
                >
                  <span>Supported Chains</span>
                  <motion.span
                    animate={{ rotate: chainsOpen ? 180 : 0 }}
                    className="text-[16px]"
                  >
                    ▼
                  </motion.span>
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: chainsOpen ? "auto" : 0, opacity: chainsOpen ? 1 : 0 }}
                  className="overflow-hidden flex flex-col"
                >
                  <div className="flex flex-col gap-2 pb-4 pl-4 border-l-2 border-white/20 ml-2 mt-2">
                    <Link href="/#supported-chains" onClick={(e) => handleScroll(e, 'supported-chains')} className="text-[16px] font-bold text-white/70 hover:text-[var(--color-section-cyan)] transition-colors">
                      Solana
                    </Link>
                    <Link href="/#supported-chains" onClick={(e) => handleScroll(e, 'supported-chains')} className="text-[16px] font-bold text-white/70 hover:text-[var(--color-section-cyan)] transition-colors">
                      Base
                    </Link>
                    <Link href="/#supported-chains" onClick={(e) => handleScroll(e, 'supported-chains')} className="text-[16px] font-bold text-white/70 hover:text-[var(--color-section-cyan)] transition-colors">
                      Sui
                    </Link>
                  </div>
                </motion.div>
              </div>
              <Link href="/#how-it-works" onClick={(e) => handleScroll(e, 'how-it-works')} className="py-4 border-b-2 border-white/10 text-[24px] font-bold text-white hover:text-[var(--color-section-yellow)] transition-colors cursor-pointer block">
                How It Works
              </Link>
              <Link href="/#faq" onClick={(e) => handleScroll(e, 'faq')} className="py-4 border-b-2 border-white/10 text-[24px] font-bold text-white hover:text-[var(--color-section-yellow)] transition-colors cursor-pointer block">
                FAQ
              </Link>
            </div>

          </motion.div>

          <motion.div className="flex-1 h-full bg-[#1E1E1E] flex flex-col justify-center gap-12 relative text-center items-center p-8 text-white/80 overflow-hidden border-y-2 border-r-2 border-black">
            <div className="flex items-center uppercase tracking-wider text-[10px] font-bold gap-2">
              <span className="bg-black border-2 border-white/20 text-white px-2 py-1">
                Zero Fees
              </span>
              <span className="bg-[var(--color-success)] border-2 border-black text-black px-2 py-1">
                Instant
              </span>
            </div>

            <div className="flex flex-col items-center gap-6 z-10">
              <h2 className="text-[32px] font-black leading-tight text-white max-w-md uppercase m-0">
                Cross-Chain <br />
                Routing
              </h2>
              <Link href="/dashboard">
                <button className="bg-[var(--color-section-cyan)] border-2 border-black font-bold text-black px-6 py-3 text-[16px] hover:bg-white transition-colors shadow-[var(--shadow-sm)]">
                  Get Started
                </button>
              </Link>
            </div>

            <div className="w-full absolute bottom-0 left-0 h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none z-0"></div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};
