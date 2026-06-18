'use client'

import { ArrowDownToLine, Search } from 'lucide-react';
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';

export default function DashboardHistory() {
  const { address: evmAddress } = useAccount();
  const { publicKey } = useWallet();
  const address = evmAddress || publicKey?.toBase58();

  const rawTransactions = useQuery(api.transactions.getTransactionsByMerchant, address ? { merchantAddress: address } : "skip");
  const loading = rawTransactions === undefined;

  const transactions = (rawTransactions || []).map((tx) => ({
    id: `${tx.sourceTxHash.slice(0, 8)}...${tx.sourceTxHash.slice(-6)}`,
    rawTxHash: tx.sourceTxHash,
    linkId: tx.linkId,
    amount: `${tx.sourceAmount} ${tx.sourceToken || 'NATIVE'}`,
    fromChain: tx.sourceChain,
    date: new Date(tx._creationTime).toLocaleString(),
    status: tx.status === 'confirmed' ? 'Settled' : tx.status === 'pending' ? 'Pending' : 'Failed'
  }));

  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ['Transaction Hash', 'Link ID', 'Amount', 'Source Chain', 'Date', 'Status'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(tx => `${tx.rawTxHash},${tx.linkId},${tx.amount},${tx.fromChain},"${tx.date}",${tx.status}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `justpay_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 border-b-4 border-black pb-4 mb-4">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black">Transaction History</h1>
        <p className="text-lg font-bold text-black uppercase">View and export all payments received through your generated links.</p>
      </div>

      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden min-h-[400px]">
        {/* Filters & Search */}
        <div className="p-6 border-b-4 border-black flex flex-col sm:flex-row justify-between items-center gap-4 bg-[var(--color-section-yellow)]">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black" strokeWidth={3} />
            <input 
              type="text" 
              placeholder="Search by TxID or Link ID..." 
              className="w-full bg-white border-[3px] border-black px-4 py-3 pl-12 text-[16px] font-bold text-black placeholder:text-black/50 focus:outline-none focus:shadow-[4px_4px_0px_0px_#000] transition-shadow"
            />
          </div>
          
          <button onClick={handleExportCSV} disabled={transactions.length === 0} className="w-full sm:w-auto px-6 py-3 flex items-center gap-2 border-[3px] border-black bg-white text-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[var(--color-section-pink)] hover:translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            <ArrowDownToLine className="w-5 h-5" strokeWidth={3} /> Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-4 border-black bg-white">
                <th className="p-4 text-[14px] font-black text-black uppercase tracking-wider border-r-4 border-black last:border-r-0">Transaction ID</th>
                <th className="p-4 text-[14px] font-black text-black uppercase tracking-wider border-r-4 border-black last:border-r-0">Link ID</th>
                <th className="p-4 text-[14px] font-black text-black uppercase tracking-wider border-r-4 border-black last:border-r-0">Amount</th>
                <th className="p-4 text-[14px] font-black text-black uppercase tracking-wider border-r-4 border-black last:border-r-0">Source Chain</th>
                <th className="p-4 text-[14px] font-black text-black uppercase tracking-wider border-r-4 border-black last:border-r-0">Date</th>
                <th className="p-4 text-[14px] font-black text-black uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y-4 divide-black bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-xl font-bold text-black uppercase tracking-wider">Loading history...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-xl font-bold text-black uppercase tracking-wider">No transactions found for this wallet.</td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.rawTxHash} className="hover:bg-[var(--color-section-cyan)] transition-colors">
                    <td className="p-4 text-[16px] font-mono font-bold text-black border-r-4 border-black last:border-r-0" title={tx.rawTxHash}>{tx.id}</td>
                    <td className="p-4 text-[16px] font-mono font-bold text-black border-r-4 border-black last:border-r-0">{tx.linkId}</td>
                    <td className="p-4 text-[20px] font-black text-black border-r-4 border-black last:border-r-0">{tx.amount}</td>
                    <td className="p-4 text-[16px] font-bold text-black uppercase border-r-4 border-black last:border-r-0">{tx.fromChain}</td>
                    <td className="p-4 text-[16px] font-bold text-black border-r-4 border-black last:border-r-0">{tx.date}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-[12px] font-black uppercase border-2 border-black ${
                        tx.status === 'Settled' ? 'bg-[var(--color-section-green)] text-black' : 
                        tx.status === 'Pending' ? 'bg-[var(--color-section-yellow)] text-black' : 
                        'bg-[var(--color-section-pink)] text-black'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
