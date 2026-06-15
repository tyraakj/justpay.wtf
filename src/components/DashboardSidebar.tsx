'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function DashboardSidebar() {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Overview', href: '/dashboard' },
    { name: 'Transaction History', href: '/dashboard/history' },
    { name: 'Profile Settings', href: '/dashboard/profile' },
  ];

  return (
    <aside className="w-64 flex-shrink-0 glass-card p-6 h-[calc(100vh-8rem)] sticky top-24 hidden md:flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Menu</h2>
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-primary/20 text-primary border border-primary/30' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto">
        <div className="status-box flex flex-col gap-2">
          <p className="text-xs text-gray-400">Connected Wallet</p>
          <p className="text-sm font-mono text-white truncate">0x71C...976F</p>
        </div>
      </div>
    </aside>
  );
}
