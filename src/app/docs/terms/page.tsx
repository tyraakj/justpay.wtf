import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <main className="min-h-screen pt-32 pb-12 px-6 max-w-4xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>
      <div className="glass-card p-8 sm:p-12">
        <h1 className="text-4xl font-extrabold text-foreground mb-6">Terms of Service</h1>
        <p className="text-lg text-zinc-400 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-6 text-zinc-300">
          <p>
            Welcome to justpay.wtf. By using our service, you agree to these Terms of Service.
          </p>
          <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">1. Non-Custodial Nature</h2>
          <p>
            justpay.wtf is a strictly non-custodial software service. We do not hold, transmit, or custody any user funds. All transactions are executed directly between the payer and the recipient on decentralized networks via smart contracts.
          </p>
          <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">2. Assumption of Risk</h2>
          <p>
            Users assume all risks associated with cryptographic transactions, including but not limited to network congestion, slippage, wallet compromise, and smart contract vulnerabilities.
          </p>
        </div>
      </div>
    </main>
  );
}
