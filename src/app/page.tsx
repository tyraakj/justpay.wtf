import { ArrowUpRight, Activity, Link as LinkIcon, CheckCircle2, Copy } from 'lucide-react';
import { NavbarConnectButton } from "@/components/NavbarConnectButton";

export default function LandingPage() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-6 w-full relative z-10 overflow-hidden">
      <div className="flex flex-col gap-24 w-full max-w-7xl mx-auto mt-12 lg:mt-24">
        
        {/* Top Section: Side by Side (tRPC style) */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-8">
          
          {/* Left: Hero Section */}
          <div className="flex flex-col gap-8 flex-1 w-full lg:max-w-xl">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight">
              The fastest way to <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary drop-shadow-[0_0_30px_rgba(34,211,238,0.4)]">
                get paid in crypto.
              </span>
            </h1>
            <p className="text-xl text-gray-400 font-medium leading-relaxed">
              Generate simple payment links. We handle the complex cross-chain routing, bridging, and swapping automatically. You receive exact USDC instantly.
            </p>
            <div className="flex items-center gap-4 mt-2">
               {/* Note: Connect button is now in navbar, but we can add a secondary CTA here if wanted, or just leave it clean like trpc.io */}
               <a href="/docs" className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 transition-colors">
                 Read Documentation
               </a>
            </div>
          </div>

          {/* Right: Demo Dashboard Preview */}
          <div className="flex flex-col gap-4 relative flex-1 w-full max-w-2xl">
            <div className="flex items-center justify-between ml-2">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Live Dashboard Preview</h2>
              <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-white/50 animate-pulse">
                Demo Mode
              </div>
            </div>
            
            <div className="glass-card p-1 relative overflow-hidden">
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-0">
                <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 shadow-xl">
                  <p className="text-gray-400 font-medium text-xs mb-1">Total Volume</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-bold text-white">$12,450.00</h2>
                    <span className="text-success text-[10px] font-bold flex items-center bg-success/10 px-2 py-0.5 rounded-full">
                      +14% <ArrowUpRight className="w-3 h-3 ml-1" />
                    </span>
                  </div>
                </div>

                <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 shadow-xl">
                  <p className="text-gray-400 font-medium text-xs mb-1">Active Links</p>
                  <h2 className="text-2xl font-bold text-white">8</h2>
                </div>

                <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 bg-gradient-to-br from-primary/5 to-secondary/5 shadow-xl sm:col-span-2">
                  <p className="text-primary font-medium text-xs mb-1 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" /> System Status
                  </p>
                  <h2 className="text-lg font-bold text-white">Operational</h2>
                </div>
              </div>

              <div className="px-6 pb-6 relative z-0">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0A0A0A] border border-white/5">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-bold text-white">Payment Received</p>
                    <p className="text-[10px] text-gray-500">2 hours ago</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-bold text-success">+$500.00</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/10 text-success border border-success/20">Settled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How it Works Section (MOVED BELOW, WITH MINI DEMOS) */}
        <div className="flex flex-col gap-10 relative z-20">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-extrabold text-white">How it works</h2>
            <p className="text-lg text-gray-400">Three simple steps to unified payments.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="flex flex-col gap-6 group">
              <div className="flex flex-col gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl border border-primary/20 group-hover:border-primary/50 group-hover:bg-primary/20 transition-all duration-300">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Generate Link</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Specify the exact amount of USDC you want to receive. We instantly generate a unique short payment link.
                  </p>
                </div>
              </div>
              {/* Mini Demo Segment */}
              <div className="mt-auto bg-[#0A0A0A] border border-white/5 rounded-xl p-4 flex flex-col gap-3 shadow-lg">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-medium">Amount</span>
                  <span className="text-xs text-primary font-bold">USDC</span>
                </div>
                <div className="text-2xl font-bold text-white">500.00</div>
                <div className="w-full h-8 bg-primary/20 rounded-lg flex items-center justify-center text-primary text-xs font-bold mt-1">
                  Create Link <ArrowUpRight className="w-3 h-3 ml-1" />
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col gap-6 group">
              <div className="flex flex-col gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-black text-xl border border-secondary/20 group-hover:border-secondary/50 group-hover:bg-secondary/20 transition-all duration-300">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Share Anywhere</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Send the link to your client. The hosted checkout UI is clean, mobile-optimized, and instantly trustworthy.
                  </p>
                </div>
              </div>
              {/* Mini Demo Segment */}
              <div className="mt-auto bg-[#0A0A0A] border border-white/5 rounded-xl p-4 flex flex-col gap-3 shadow-lg">
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10">
                  <LinkIcon className="w-4 h-4 text-secondary" />
                  <span className="text-sm font-mono text-white/80 truncate">justpay.wtf/pay_8x...</span>
                  <Copy className="w-4 h-4 text-gray-500 ml-auto" />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-2 bg-white/5 rounded-full" />
                  <div className="flex-1 h-2 bg-white/5 rounded-full" />
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col gap-6 group">
              <div className="flex flex-col gap-4">
                <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center font-black text-xl border border-success/20 group-hover:border-success/50 group-hover:bg-success/20 transition-all duration-300">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Instant Settlement</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Your client pays with whatever token they have. The funds settle instantly into your default wallet.
                  </p>
                </div>
              </div>
              {/* Mini Demo Segment */}
              <div className="mt-auto bg-[#0A0A0A] border border-white/5 rounded-xl p-4 flex flex-col gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">Payment Complete</span>
                    <span className="text-xs text-gray-500">Settled to your wallet</span>
                  </div>
                </div>
                <div className="text-right mt-2">
                  <span className="text-lg font-bold text-success">+$500.00 USDC</span>
                </div>
              </div>
            </div>

          </div>
        </div>
        
      </div>
    </div>
  );
}
