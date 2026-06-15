import { Copy } from "lucide-react";

interface PaymentCardProps {
  amount: number;
  tokenSymbol: string;
  fiatValue?: number;
  recipientAddress: string;
  memo?: string;
}

export function PaymentCard({ amount, tokenSymbol, fiatValue, recipientAddress, memo }: PaymentCardProps) {
  const shortAddress = `${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`;

  return (
    <div className="glass-card p-6 flex flex-col gap-6 w-full max-w-md mx-auto relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 flex flex-col items-center text-center gap-1">
        <span className="text-gray-400 text-sm font-medium">Paying</span>
        <div className="text-4xl font-bold text-white flex items-baseline gap-2">
          {amount} <span className="text-2xl text-primary">{tokenSymbol}</span>
        </div>
        {fiatValue && (
          <span className="text-gray-500 text-sm">~${fiatValue.toFixed(2)} USD</span>
        )}
      </div>

      <div className="relative z-10 flex flex-col gap-4 mt-2">
        <div className="flex items-center justify-between status-box">
          <span className="text-sm text-gray-400">To</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-white">{shortAddress}</span>
            <button className="btn-icon">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {memo && (
          <div className="flex flex-col gap-1 status-box">
            <span className="form-label text-gray-500">Memo</span>
            <span className="text-sm text-gray-300">{memo}</span>
          </div>
        )}
      </div>
    </div>
  );
}
