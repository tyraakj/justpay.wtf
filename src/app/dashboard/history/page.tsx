import { ArrowDownToLine, Search } from 'lucide-react';

export default function DashboardHistory() {
  const transactions = [
    { id: 'tx_19x...', linkId: 'link_abcd123', amount: '500 USDC', fromChain: 'Solana', date: '2023-10-27 14:30', status: 'Settled' },
    { id: 'tx_82y...', linkId: 'link_xyz987', amount: '1200 USDT', fromChain: 'Ethereum', date: '2023-10-26 09:15', status: 'Settled' },
    { id: 'tx_44z...', linkId: 'link_mnop456', amount: '150 USDC', fromChain: 'Polygon', date: '2023-10-25 18:45', status: 'Settled' },
    { id: 'tx_99a...', linkId: 'link_qrst789', amount: '3000 USDC', fromChain: 'Arbitrum', date: '2023-10-25 11:20', status: 'Failed' },
    { id: 'tx_11b...', linkId: 'link_uvwx012', amount: '50 USDC', fromChain: 'Solana', date: '2023-10-24 16:00', status: 'Settled' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-white">Transaction History</h1>
        <p className="text-sm text-gray-400">View and export all payments received through your generated links.</p>
      </div>

      <div className="glass-card flex flex-col overflow-hidden">
        {/* Filters & Search */}
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search by TxID or Link ID..." 
              className="input-field pl-10"
            />
          </div>
          
          <button className="btn-secondary w-full sm:w-auto px-6 py-3 flex items-center gap-2">
            <ArrowDownToLine className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-[#0A0A0A]">
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Transaction ID</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Link ID</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Source Chain</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-sm font-mono text-white">{tx.id}</td>
                  <td className="p-4 text-sm font-mono text-gray-400">{tx.linkId}</td>
                  <td className="p-4 text-sm font-bold text-white">{tx.amount}</td>
                  <td className="p-4 text-sm text-gray-400">{tx.fromChain}</td>
                  <td className="p-4 text-sm text-gray-500">{tx.date}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      tx.status === 'Settled' ? 'bg-success/10 text-success border border-success/20' : 'bg-error/10 text-error border border-error/20'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
