import { ArrowUpRight, Link as LinkIcon, CheckCircle2, Copy } from 'lucide-react';

export function HowItWorksSection() {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-24 relative z-20">
      <div className="flex flex-col gap-16">
        <div className="flex flex-col gap-4 text-center items-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground">How it works</h2>
          <p className="text-xl text-zinc-400 max-w-2xl">Three simple steps to unified payments. No complex integrations required.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Step 1 */}
          <div className="flex flex-col gap-8 group bg-surface/50 p-8 rounded-[2rem] border border-border hover:bg-surface hover:border-border-hover transition-colors">
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-2xl border border-primary/20 group-hover:border-primary/50 group-hover:bg-primary/20 transition-all duration-300 shadow-lg shadow-primary/5">
                1
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Generate Link</h3>
                <p className="text-base text-zinc-400 leading-relaxed">
                  Specify the exact amount of USDC you want to receive. We instantly generate a unique short payment link.
                </p>
              </div>
            </div>
            {/* Mini Demo Segment */}
            <div className="mt-auto bg-background border border-border rounded-2xl p-5 flex flex-col gap-4 shadow-inner">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500 font-medium">Amount</span>
                <span className="text-sm text-primary font-bold">USDC</span>
              </div>
              <div className="text-3xl font-bold text-foreground">500.00</div>
              <div className="w-full h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary text-sm font-bold mt-2">
                Create Link <ArrowUpRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col gap-8 group bg-surface/50 p-8 rounded-[2rem] border border-border hover:bg-surface hover:border-border-hover transition-colors">
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-black text-2xl border border-secondary/20 group-hover:border-secondary/50 group-hover:bg-secondary/20 transition-all duration-300 shadow-lg shadow-secondary/5">
                2
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Share Anywhere</h3>
                <p className="text-base text-zinc-400 leading-relaxed">
                  Send the link to your client. The hosted checkout UI is clean, mobile-optimized, and instantly trustworthy.
                </p>
              </div>
            </div>
            {/* Mini Demo Segment */}
            <div className="mt-auto bg-background border border-border rounded-2xl p-5 flex flex-col gap-4 shadow-inner">
              <div className="flex items-center gap-3 bg-white/5 p-3.5 rounded-xl border border-white/[0.15]">
                <LinkIcon className="w-5 h-5 text-secondary" />
                <span className="text-sm font-mono text-white/80 truncate">justpay.wtf/pay_8x...</span>
                <Copy className="w-4 h-4 text-zinc-500 ml-auto" />
              </div>
              <div className="flex gap-2 mt-1">
                <div className="flex-1 h-2.5 bg-white/5 rounded-full" />
                <div className="flex-1 h-2.5 bg-white/5 rounded-full" />
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col gap-8 group bg-surface/50 p-8 rounded-[2rem] border border-border hover:bg-surface hover:border-border-hover transition-colors">
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-success/10 text-success flex items-center justify-center font-black text-2xl border border-success/20 group-hover:border-success/50 group-hover:bg-success/20 transition-all duration-300 shadow-lg shadow-success/5">
                3
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Instant Settlement</h3>
                <p className="text-base text-zinc-400 leading-relaxed">
                  Your client pays with whatever token they have. The funds settle instantly into your default wallet.
                </p>
              </div>
            </div>
            {/* Mini Demo Segment */}
            <div className="mt-auto bg-background border border-border rounded-2xl p-5 flex flex-col gap-4 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">Payment Complete</span>
                  <span className="text-xs text-zinc-500">Settled to your wallet</span>
                </div>
              </div>
              <div className="text-right mt-3 pt-3 border-t border-border">
                <span className="text-xl font-bold text-success">+$500.00 USDC</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
