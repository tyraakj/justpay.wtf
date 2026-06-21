'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { AuthGate } from "@/components/auth/AuthGate";
import { useAuth } from '@/lib/useAuth';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isConnected, isAuthenticated, currentAddress } = useAuth();
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => { setHasMounted(true); }, []);

  // DEBUG
  console.log('[DashboardLayout]', { hasMounted, isConnected, isAuthenticated, currentAddress: currentAddress?.slice(0, 10) });

  // Redirect to home if not connected (after hooks initialize)
  useEffect(() => {
    if (hasMounted && !isConnected) {
      console.log('[DashboardLayout] redirecting — not connected');
      router.replace('/');
    }
  }, [hasMounted, isConnected, router]);

  // Still loading
  if (!hasMounted) return null;

  // Not connected — redirect in progress
  if (!isConnected) return null;

  // Connected but not authenticated — show AuthGate sign prompt
  if (!isAuthenticated) {
    console.log('[DashboardLayout] showing AuthGate — not authenticated');
    return (
      <div className="min-h-screen pt-24 pb-20 md:pb-12 px-6 max-w-7xl mx-auto w-full flex gap-8 z-10 relative">
        <main className="flex-1 min-w-0">
          <AuthGate>{null}</AuthGate>
        </main>
      </div>
    );
  }

  console.log('[DashboardLayout] fully authenticated — showing dashboard');

  // Fully authenticated — show dashboard
  return (
    <div className="min-h-screen pt-24 pb-20 md:pb-12 px-6 max-w-7xl mx-auto w-full flex gap-8 z-10 relative">
      <DashboardSidebar />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
