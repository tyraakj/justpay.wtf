'use client';

import { useState } from 'react';
import { ArrowUpRight, Activity, X } from 'lucide-react';
import { CreateLinkForm } from "@/components/CreateLinkForm";

export default function DashboardOverview() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-12">
      {/* Overview Section */}
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-white">Overview</h1>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary w-auto px-6 py-2 shadow-none text-sm"
          >
            Generate New Link
          </button>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="glass-card p-6">
            <p className="text-gray-400 font-medium text-sm mb-2">Total Volume</p>
            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl font-bold text-white">$12,450.00</h2>
              <span className="text-success text-xs font-bold flex items-center bg-success/10 px-2 py-0.5 rounded-full">
                +14% <ArrowUpRight className="w-3 h-3 ml-1" />
              </span>
            </div>
          </div>

          <div className="glass-card p-6">
            <p className="text-gray-400 font-medium text-sm mb-2">Active Links</p>
            <h2 className="text-3xl font-bold text-white">8</h2>
          </div>

          <div className="glass-card p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <p className="text-primary font-medium text-sm mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4" /> System Status
            </p>
            <h2 className="text-xl font-bold text-white mt-1">All Systems Operational</h2>
            <p className="text-xs text-gray-400 mt-2">Routing engine is online.</p>
          </div>
        </div>

        {/* Recent Activity (Mock) */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
          <div className="flex flex-col gap-4">
            {[
              { id: 1, action: 'Payment Received', amount: '+$500.00', time: '2 hours ago', status: 'Settled' },
              { id: 2, action: 'Link Generated', amount: '$1,200.00', time: '5 hours ago', status: 'Pending' },
              { id: 3, action: 'Payment Received', amount: '+$150.00', time: '1 day ago', status: 'Settled' },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-[#0A0A0A] border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-bold text-white">{item.action}</p>
                  <p className="text-xs text-gray-500">{item.time}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className={`text-sm font-bold ${item.amount.startsWith('+') ? 'text-success' : 'text-white'}`}>
                    {item.amount}
                  </p>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    item.status === 'Settled' ? 'bg-success/10 text-success border border-success/20' : 'bg-warning/10 text-warning border border-warning/20'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Link Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 rounded-full z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6 sm:p-8 relative z-0">
              <div className="flex flex-col gap-2 mb-6 text-center">
                <h2 className="text-2xl font-bold text-white">Create Payment Link</h2>
                <p className="text-sm text-gray-400 font-medium">Step 1: Connect your destination wallet</p>
              </div>
              <CreateLinkForm />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
