'use client';

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount } from 'wagmi';
import { Copy, ExternalLink, PowerOff } from 'lucide-react';

export default function LinksManagement() {
  const { publicKey } = useWallet();
  const { address: evmAddress } = useAccount();
  const address = publicKey?.toBase58() || evmAddress;

  const links = useQuery(api.links.getLinksByMerchant, address ? { merchantAddress: address } : "skip");
  const isLoading = links === undefined;

  const handleCopy = (shortCode: string) => {
    const url = `${window.location.origin}/${shortCode}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between border-b-4 border-black pb-4 mb-4">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black">Payment Links</h1>
      </div>

      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-0">
        {isLoading ? (
          <p className="p-12 text-center text-xl font-bold text-black uppercase tracking-wider">Loading links...</p>
        ) : (links || []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 border-4 border-dashed border-black m-6">
            <p className="text-xl font-bold text-black uppercase tracking-wider">No payment links created yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-4 border-black bg-[var(--color-section-yellow)]">
                  <th className="p-4 text-[14px] font-black text-black uppercase tracking-wider border-r-4 border-black last:border-r-0">Label</th>
                  <th className="p-4 text-[14px] font-black text-black uppercase tracking-wider border-r-4 border-black last:border-r-0">Amount</th>
                  <th className="p-4 text-[14px] font-black text-black uppercase tracking-wider border-r-4 border-black last:border-r-0">Status</th>
                  <th className="p-4 text-[14px] font-black text-black uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-4 divide-black bg-white">
                {(links || []).map((link) => (
                  <tr key={link._id} className="hover:bg-[var(--color-section-cyan)] transition-colors">
                    <td className="p-4 text-[16px] font-bold text-black border-r-4 border-black last:border-r-0">{link.label || 'Payment'}</td>
                    <td className="p-4 text-[20px] font-black text-black border-r-4 border-black last:border-r-0">${link.amount} {link.destinationTokenSymbol}</td>
                    <td className="p-4 border-r-4 border-black last:border-r-0">
                      <span className={`px-3 py-1 text-[12px] font-black uppercase border-2 border-black ${
                        link.status === 'active' ? 'bg-[var(--color-section-green)] text-black' : 'bg-zinc-300 text-zinc-600'
                      }`}>
                        {link.status}
                      </span>
                    </td>
                    <td className="p-4 flex items-center gap-4">
                      <button onClick={() => handleCopy(link.shortCode)} className="text-black hover:text-[var(--color-section-pink)] transition-colors" title="Copy Link">
                        <Copy className="w-6 h-6" strokeWidth={3} />
                      </button>
                      <a href={`/${link.shortCode}`} target="_blank" rel="noreferrer" className="text-black hover:text-[var(--color-section-pink)] transition-colors" title="Open Link">
                        <ExternalLink className="w-6 h-6" strokeWidth={3} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
