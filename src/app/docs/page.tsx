import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function DocsPage() {
  return (
    <main className="min-h-screen pt-32 pb-12 px-6 max-w-4xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>
      <div className="glass-card p-8 sm:p-12">
        <h1 className="text-4xl font-extrabold text-foreground mb-6">Documentation</h1>
        <p className="text-lg text-zinc-400 mb-8">
          Welcome to the justpay.wtf developer documentation. Learn how to generate payment links programmatically and integrate with our API.
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">Overview</h2>
            <p className="text-zinc-400 leading-relaxed mb-6">
              justpay.wtf is a non-custodial payment routing protocol. We do not hold user funds. When a payment is initiated via a link, we use ExactOut routing to determine the required input token amount to satisfy the requested output token amount and settlement chain.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">API Reference</h2>
            <div className="bg-black/30 border border-border rounded-xl p-6 flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">Authentication</h3>
                <p className="text-sm text-zinc-400">
                  Include an <code>Authorization: Bearer &lt;YOUR_API_KEY&gt;</code> header in all requests. Contact support to obtain an API key.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-success/20 text-success font-mono font-bold rounded-lg text-sm">POST</span>
                  <code className="text-lg text-foreground font-mono">/api/v1/links</code>
                </div>
                <p className="text-sm text-zinc-400 mb-4">Create a new payment link programmatically.</p>
                
                <div className="space-y-4">
                  <div className="bg-black/50 border border-border rounded-lg p-4">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Request Body</h4>
                    <pre className="text-xs font-mono text-zinc-300 overflow-x-auto">{`{
  "creatorAddress": "0x...",
  "creatorChain": "ethereum",
  "tokenSymbol": "USDC",
  "amount": "50.00",
  "label": "Order #1234"
}`}</pre>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
