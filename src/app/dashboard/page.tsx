'use client';

import { useState } from 'react';
import { ArrowUpRight, Activity, X } from 'lucide-react';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { CreateLinkForm } from "@/components/CreateLinkForm";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from '@/lib/useAuth';
import { BrutalistButton } from '@/components/brutalism/Button';

export default function DashboardOverview() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentAddress } = useAuth();

  const links = useQuery(api.links.getLinksByReceiver, currentAddress ? { receiverAddress: currentAddress } : "skip");
  const transactions = useQuery(api.transactions.getTransactionsByReceiver, currentAddress ? { receiverAddress: currentAddress } : "skip");

  const isLoading = links === undefined || transactions === undefined;
  const activeLinks = links?.filter(l => l.status === 'active').length || 0;
  const totalVolume = transactions?.reduce((sum, tx) => sum + Number(tx.sourceAmount || 0), 0) || 0;

  // Build activity feed from links and transactions
  const activities = [
    ...(links || []).map(l => ({
      id: `link-${l._id}`,
      action: 'Link Generated',
      amount: `$${Number(l.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      time: new Date(l._creationTime).toLocaleDateString(),
      status: l.status === 'active' ? 'Active' : 'Completed',
      timestamp: l._creationTime
    })),
    ...(transactions || []).map(tx => ({
      id: `tx-${tx._id}`,
      action: 'Payment Received',
      amount: `+${Number(tx.sourceAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      time: new Date(tx._creationTime).toLocaleDateString(),
      status: tx.status === 'confirmed' ? 'Settled' : 'Pending',
      timestamp: tx._creationTime
    }))
  ].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="flex flex-col gap-12">
      {/* Overview Section */}
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between border-b-4 border-black pb-4">
          <h1 className="text-[48px] font-black text-black uppercase leading-none m-0">Overview</h1>
          <BrutalistButton
            variant="brand"
            onClick={() => setIsModalOpen(true)}
            className="w-auto px-6 py-2 shadow-[var(--shadow-sm)] text-[16px]"
          >
            Generate New Link
          </BrutalistButton>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-[var(--color-section-pink)] border-4 border-black p-6 shadow-[var(--shadow-sm)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[var(--shadow-md)] transition-all">
            <p className="text-black font-black text-[16px] mb-2 uppercase border-b-2 border-black pb-2">Total Volume</p>
            <div className="flex items-baseline gap-3 mt-4">
              {isLoading ? (
                <div className="h-9 w-32 bg-white border-2 border-black animate-pulse" />
              ) : (
                <h2 className="text-[40px] font-black text-black leading-none">
                  <AnimatedCounter value={totalVolume} prefix="$" decimals={2} />
                </h2>
              )}
            </div>
          </div>

          <div className="bg-[var(--color-section-cyan)] border-4 border-black p-6 shadow-[var(--shadow-sm)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[var(--shadow-md)] transition-all">
            <p className="text-black font-black text-[16px] mb-2 uppercase border-b-2 border-black pb-2">Active Links</p>
            <div className="flex items-baseline gap-3 mt-4">
              {isLoading ? (
                <div className="h-9 w-16 bg-white border-2 border-black animate-pulse" />
              ) : (
                <h2 className="text-[40px] font-black text-black leading-none">
                  <AnimatedCounter value={activeLinks} />
                </h2>
              )}
            </div>
          </div>

          <div className="bg-[var(--color-section-yellow)] border-4 border-black p-6 shadow-[var(--shadow-sm)] block hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[var(--shadow-md)] transition-all">
            <div className="flex items-center justify-between mb-2 border-b-2 border-black pb-2">
              <p className="text-black font-black text-[16px] flex items-center gap-2 uppercase">
                <Activity className="w-5 h-5" strokeWidth={3} /> System Status
              </p>
              <div className="w-4 h-4 rounded-full bg-[var(--color-success)] border-2 border-black shadow-[var(--shadow-xs)] animate-pulse" />
            </div>
            <h2 className="text-[24px] font-black text-black mt-4 leading-tight uppercase">Operational</h2>
            <p className="text-black font-bold text-[14px] mt-2 border-t-2 border-black pt-2">Routing engine is online.</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[var(--color-neutral-primary-soft)] border-4 border-black p-6 shadow-[var(--shadow-md)]">
          <h2 className="text-[24px] font-black text-black mb-6 uppercase border-b-4 border-black pb-2">Recent Activity</h2>

          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 w-full bg-[var(--color-neutral-secondary-soft)] border-4 border-black animate-pulse" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 border-4 border-dashed border-black bg-[var(--color-neutral-secondary-soft)]">
              <p className="text-black font-bold text-[16px] uppercase tracking-wider">No payment activity found for this wallet yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {activities.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-white border-4 border-black hover:bg-[var(--color-section-yellow)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[var(--shadow-sm)] transition-all group">
                  <div className="flex flex-col gap-1">
                    <p className="text-[18px] font-black text-black uppercase">{item.action}</p>
                    <p className="text-[14px] font-bold text-black border-t-2 border-black pt-1 inline-block">{item.time}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`text-[24px] font-black ${item.amount.startsWith('+') ? 'text-[var(--color-success)]' : 'text-black'}`}>
                      {item.amount}
                    </p>
                    <span className={`px-3 py-1 text-[14px] font-black border-2 border-black shadow-[var(--shadow-xs)] uppercase ${item.status === 'Settled' || item.status === 'Active' ? 'bg-[var(--color-success)] text-black' : 'bg-[var(--color-warning)] text-black'
                      }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Link Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--color-neutral-primary-soft)] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full max-w-xl flex flex-col max-h-[90vh] relative animate-in fade-in zoom-in duration-200">
            <div className="p-6 sm:p-8 relative z-0 overflow-y-auto">
              <div className="flex flex-col gap-2 mb-6 border-b-4 border-black pb-4 sticky top-0 bg-[var(--color-neutral-primary-soft)] z-10 pt-2">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-[28px] sm:text-[32px] font-black text-black uppercase leading-tight">Create Payment Link</h2>
                    <p className="text-[14px] sm:text-[16px] text-black font-bold">Step 1: Connect your destination wallet</p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="shrink-0 bg-[var(--color-section-pink)] border-[3px] border-black p-2 text-black hover:bg-[var(--color-section-yellow)] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 font-black uppercase text-[14px]"
                  >
                    <X className="w-5 h-5" strokeWidth={3} />
                    <span className="hidden sm:inline">Back</span>
                  </button>
                </div>
              </div>
              <CreateLinkForm />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
