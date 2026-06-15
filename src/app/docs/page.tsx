export default function DocsPage() {
  return (
    <main className="min-h-screen pt-32 pb-12 px-6 max-w-4xl mx-auto">
      <div className="glass-card p-8 sm:p-12">
        <h1 className="text-4xl font-extrabold text-white mb-6">Documentation</h1>
        <p className="text-lg text-gray-400 mb-8">
          Welcome to the justpay.wtf developer documentation. Learn how to generate payment links programmatically and integrate with our API.
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
            <p className="text-gray-400 leading-relaxed">
              justpay.wtf is a non-custodial payment routing protocol. We do not hold user funds. When a payment is initiated via a link, we use ExactOut routing to determine the required input token amount to satisfy the requested output token amount and settlement chain.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Generating Links via API</h2>
            <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-2xl">
              <pre className="text-sm text-gray-300 font-mono overflow-x-auto">
                <code>
{`POST /api/links
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "destinationChain": "solana",
  "destinationAddress": "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH",
  "token": "USDC",
  "amount": "100.00"
}`}
                </code>
              </pre>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
