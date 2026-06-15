export default function HowItWorksPage() {
  return (
    <main className="min-h-screen pt-32 pb-12 px-6 max-w-4xl mx-auto">
      <div className="glass-card p-8 sm:p-12">
        <h1 className="text-4xl font-extrabold text-white mb-6">How it works</h1>
        <p className="text-lg text-gray-400 mb-12">
          The fastest way to get paid in crypto. We handle the complex routing, bridging, and swapping so your customers can pay with any token on any chain.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-bold text-xl border border-primary/30">
              1
            </div>
            <h3 className="text-xl font-bold text-white">Generate Link</h3>
            <p className="text-sm text-gray-400">
              Connect your wallet and specify the exact amount of USDC you want to receive on Solana or Ethereum. We instantly generate a unique payment link.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary/20 text-secondary flex items-center justify-center font-bold text-xl border border-secondary/30">
              2
            </div>
            <h3 className="text-xl font-bold text-white">Share Anywhere</h3>
            <p className="text-sm text-gray-400">
              Send the link to your client via email, WhatsApp, or embed it on your site. The UI is clean, mobile-optimized, and instantly trustworthy.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-success/20 text-success flex items-center justify-center font-bold text-xl border border-success/30">
              3
            </div>
            <h3 className="text-xl font-bold text-white">Instant Settlement</h3>
            <p className="text-sm text-gray-400">
              Your client pays with whatever token they have. We use LI.FI and Jupiter to swap and bridge it seamlessly into your chosen token, landing directly in your wallet.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
