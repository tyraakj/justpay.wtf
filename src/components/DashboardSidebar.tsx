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
      <aside className="w-64 flex-shrink-0 glass-card p-6 h-[calc(100vh-8rem)] sticky top-24 hidden md:flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="px-4 py-3 rounded-xl text-sm font-medium transition-all text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent mb-4 flex items-center gap-2"
          >
            ← Back to Home
          </Link>
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Menu</h2>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-primary/20 text-primary border border-primary/30' 
                    : 'text-zinc-400 hover:text-foreground hover:bg-white/5 border border-transparent'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        <div className="mt-auto">
          <div className="status-box flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-zinc-400">Connected Wallet</p>
              <p className="text-sm font-mono text-foreground truncate">{shortAddress}</p>
            </div>
            {mounted && connected && (
              <button 
                onClick={handleDisconnect}
                className="flex items-center gap-2 text-xs font-bold text-error hover:text-error/80 transition-colors pt-2 border-t border-border"
              >
                <LogOut className="w-3 h-3" /> Disconnect
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-card rounded-none border-t border-border z-50 flex items-center justify-around p-2 pb-safe bg-[#050505]/90 backdrop-blur-xl">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`p-3 flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-zinc-500 hover:text-zinc-300'
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
