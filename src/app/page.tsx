import { NeonBackground } from "@/components/NeonBackground";
import { CreateLinkForm } from "@/components/CreateLinkForm";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center pt-24 pb-12 px-6 relative overflow-hidden">
      
      {/* Dynamic Neon Background */}
      <NeonBackground />

      {/* Centered Hero Section */}
      <div className="flex flex-col items-center text-center gap-6 z-10 max-w-4xl mb-12">
        <div className="badge">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          justpay.wtf V1 is Live
        </div>
        
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
          Supercharge your crypto <br/>
          <span className="text-[#93C5FD]">payments & settlement</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed font-medium">
          Generate non-custodial payment links in seconds. Instant settlement to your Solana or Ethereum wallet. Zero fees, zero smart-contract risk.
        </p>
      </div>

      {/* Main App Container */}
      <div className="relative w-full max-w-6xl flex justify-center items-center mt-12 min-h-[600px]">

        {/* Floating Create Link Card (like the phone in Copilot) */}
        <div className="glass-card p-6 sm:p-8 w-full max-w-md relative z-10 group shadow-[0_20px_60px_rgba(0,0,0,0.8)] border-white/10 mt-8">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2rem] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-col gap-2 items-center text-center">
              <h2 className="text-2xl font-bold text-white">Create Payment Link</h2>
              <p className="text-sm text-gray-400 font-medium">Step 1: Connect your destination wallet</p>
            </div>

            <CreateLinkForm />
          </div>
        </div>
      </div>
    </main>
  );
}
