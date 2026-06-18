'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount, useDisconnect } from 'wagmi';
import { LogOut } from 'lucide-react';

export function DashboardSidebar() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const { publicKey, connected: solConnected, disconnect: solDisconnect } = useWallet();
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { disconnect: evmDisconnect } = useDisconnect();

  useEffect(() => {
    setMounted(true);
  }, []);

  const connected = solConnected || evmConnected;
  const address = solConnected ? publicKey?.toBase58() : evmAddress;
  const shortAddress = mounted && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected';

  const handleDisconnect = () => {
    if (solConnected) solDisconnect();
    if (evmConnected) evmDisconnect();
    router.push('/');
  };

  const navLinks = [
    { name: 'Overview', href: '/dashboard' },
    { name: 'Links', href: '/dashboard/links' },
    { name: 'History', href: '/dashboard/history' },
    { name: 'Profile', href: '/dashboard/profile' },
    { name: 'Settings', href: '/dashboard/settings' }
  ];

  return (
    <>
      <aside className="w-64 flex-shrink-0 bg-[var(--color-neutral-secondary-soft)] border-4 border-black p-6 h-[calc(100vh-8rem)] sticky top-24 hidden md:flex flex-col gap-8 shadow-[var(--shadow-md)]">
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="px-4 py-3 bg-[var(--color-neutral-primary-soft)] border-2 border-black text-[16px] font-bold transition-all text-black hover:bg-[var(--color-section-yellow)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[var(--shadow-xs)] mb-4 flex items-center gap-2"
          >
            ← Back to Home
          </Link>
          <h2 className="text-[16px] font-black text-black uppercase tracking-widest mb-2 border-b-2 border-black pb-1">Menu</h2>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-3 border-2 border-black text-[16px] font-bold transition-all ${
                  isActive 
                    ? 'bg-[var(--color-section-cyan)] text-black shadow-[var(--shadow-xs)] -translate-y-1 -translate-x-1' 
                    : 'bg-white text-black hover:bg-[var(--color-section-pink)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[var(--shadow-xs)]'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        <div className="mt-auto">
          <div className="bg-[var(--color-neutral-primary-soft)] border-2 border-black p-4 flex flex-col gap-3 shadow-[var(--shadow-xs)]">
            <div className="flex flex-col gap-1">
              <p className="text-[12px] font-bold text-[var(--color-body-subtle)] uppercase">Connected Wallet</p>
              <p className="text-[14px] font-black text-black truncate">{shortAddress}</p>
            </div>
            {mounted && connected && (
              <button 
                onClick={handleDisconnect}
                className="flex items-center justify-center gap-2 text-[14px] font-bold text-white bg-[var(--color-danger)] border-2 border-black hover:bg-red-600 transition-colors py-2 mt-2 shadow-[var(--shadow-xs)] hover:-translate-y-0.5 hover:-translate-x-0.5"
              >
                <LogOut className="w-4 h-4" /> Disconnect
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-neutral-secondary-soft)] border-t-4 border-black z-[110] flex items-center justify-around p-2 pb-safe shadow-[0_-4px_0_0_rgba(0,0,0,1)]">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`p-3 flex flex-col items-center gap-1 text-[12px] font-bold transition-colors ${
                isActive ? 'text-black border-b-4 border-[var(--color-section-cyan)]' : 'text-[var(--color-body-subtle)] hover:text-black'
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
