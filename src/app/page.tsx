import { ArrowRight, Link as LinkIcon, Wallet } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-12 md:p-24 relative overflow-hidden">
      
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Hero Section */}
        <div className="flex flex-col gap-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary w-fit text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Envoy V1 is Live
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white leading-[1.1]">
            Frictionless Crypto <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Payment Links
            </span>
          </h1>
          
          <p className="text-lg text-gray-400 max-w-lg leading-relaxed">
            Generate non-custodial payment links in seconds. Instant settlement to your Solana or Ethereum wallet. Zero fees, zero smart-contract risk.
          </p>

          <div className="flex items-center gap-6 mt-4 text-sm text-gray-500 font-medium">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success" /> ExactOut Routing
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success" /> State-Free Execution
            </div>
          </div>
        </div>

        {/* Create Link Form Shell */}
        <div className="glass-card p-6 sm:p-8 w-full max-w-md mx-auto relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold text-white">Create Payment Link</h2>
              <p className="text-sm text-gray-400">Step 1: Connect your destination wallet</p>
            </div>

            <div className="flex flex-col gap-4">
              {/* Fake Wallet Connect Button Shell */}
              <button className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-3 px-4 rounded-xl transition-all">
                <Wallet className="w-5 h-5 text-gray-400" />
                Connect Wallet
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-xs text-gray-500 uppercase tracking-wider font-semibold">Or</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Destination Address</label>
                <input 
                  type="text" 
                  placeholder="0x... or solana address" 
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>

              <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-hover hover:opacity-90 text-white font-semibold py-3 px-4 rounded-xl transition-all mt-2 shadow-lg shadow-primary/25">
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
