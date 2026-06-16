import { ArrowUpRight, Activity } from 'lucide-react';

export function DemoSection() {
  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-24 relative z-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center justify-center text-center gap-2 mb-8">
          <h2 className="text-sm font-bold text-primary uppercase tracking-widest">Live Preview</h2>
          <h3 className="text-3xl md:text-4xl font-extrabold text-foreground">Experience the dashboard.</h3>
          <p className="text-zinc-400">A fully functional interface, built for speed.</p>
        </div>
        
        <div className="flex items-center justify-between ml-2">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Dashboard Demo</h2>
          <div className="px-3 py-1 bg-white/5 border border-white/[0.15] rounded-full text-[10px] font-bold text-white/50 animate-pulse">
            Demo Mode
          </div>
        </div>
        
        <div className="glass-card p-1 relative overflow-hidden shadow-2xl shadow-primary/5">
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-0">
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl">
              <p className="text-zinc-400 font-medium text-sm mb-2">Total Volume</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-primary/80">$12,450.00</h2>
                <span className="text-success text-xs font-bold flex items-center bg-success/10 px-2 py-0.5 rounded-full">
                  +14% <ArrowUpRight className="w-3 h-3 ml-1" />
                </span>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-6 shadow-xl">
              <p className="text-zinc-400 font-medium text-sm mb-2">Active Links</p>
              <h2 className="text-3xl font-bold text-foreground">8</h2>
            </div>

            <div className="bg-surface border border-primary/20 rounded-2xl p-6 bg-gradient-to-br from-primary/15 to-primary/5 shadow-[0_0_30px_rgba(236,72,153,0.1)] sm:col-span-2 lg:col-span-1">
              <p className="text-primary font-medium text-sm mb-2 flex items-center gap-1.5">
                <Activity className="w-4 h-4" /> System Status
              </p>
              <h2 className="text-xl font-bold text-white">Operational</h2>
            </div>
          </div>

          <div className="px-6 pb-6 relative z-0">
            <h4 className="text-sm font-bold text-foreground mb-4">Recent Transactions</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border hover:border-primary/30 hover:bg-surface-hover transition-all group">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Payment Received</p>
                  <p className="text-xs text-zinc-500">2 hours ago</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-sm font-bold text-success">+$500.00</p>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-success/10 text-success border border-success/20">Settled</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border hover:border-primary/30 hover:bg-surface-hover transition-all group">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Payment Received</p>
                  <p className="text-xs text-zinc-500">5 hours ago</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-sm font-bold text-success">+$1,200.00</p>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-success/10 text-success border border-success/20">Settled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
