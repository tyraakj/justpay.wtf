import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowDownLeft, Receipt, CheckCircle2 } from 'lucide-react';

const TRANSACTIONS = [
  { id: 1, type: 'payment', amount: '+ 1,250 USDC', address: '0x7A...3F9' },
  { id: 2, type: 'receipt', amount: 'Receipt: $450', address: '0x9B...1A2' },
  { id: 3, type: 'payment', amount: '+ 2.4 SOL', address: 'HN7...x9Q' },
  { id: 4, type: 'receipt', amount: 'Invoice #042', address: '0x3C...8D4' },
  { id: 5, type: 'payment', amount: '+ 0.08 BTC', address: 'bc1...q7w' },
  { id: 6, type: 'receipt', amount: 'Payment Sent', address: '0x1E...9B2' },
  { id: 7, type: 'payment', amount: '+ 45.5 LINK', address: '0x8F...2B1' },
  { id: 8, type: 'receipt', amount: 'Receipt: $8,000', address: '0x4A...7C3' },
];

export function FloatingTransactions() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    const cards = container.current.querySelectorAll('.tx-card');

    cards.forEach((card) => {
      const startX = Math.random() * 80 + 5; // 5vw to 85vw
      const startY = 110; // 110vh (below screen)
      const endY = -20; // -20vh (above screen)
      const duration = 6 + Math.random() * 6; // 6 to 12 seconds
      const sway = (Math.random() - 0.5) * 15; // horizontal drift
      const delay = Math.random() * 6;

      // Initial state
      gsap.set(card, {
        x: `${startX}vw`,
        y: `${startY}vh`,
        opacity: 0,
        scale: Math.random() * 0.3 + 0.7 // 0.7 to 1.0 scale
      });

      const tl = gsap.timeline({ repeat: -1, delay });

      // Position and rotation
      tl.to(card, {
        y: `${endY}vh`,
        x: `${startX + sway}vw`,
        rotation: (Math.random() - 0.5) * 30,
        duration: duration,
        ease: 'none'
      }, 0);

      // Fade in and out
      tl.to(card, { opacity: 0.7, duration: duration * 0.15, ease: 'power2.out' }, 0);
      tl.to(card, { opacity: 0, duration: duration * 0.15, ease: 'power2.in' }, duration * 0.85);
    });
  }, []);

  return (
    <div ref={container} className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {TRANSACTIONS.map((tx) => (
        <div 
          key={tx.id}
          className="tx-card absolute flex items-center gap-4 p-3 pr-5 rounded-[1.25rem] bg-surface/50 backdrop-blur-[16px] border border-border shadow-[0_8px_32px_rgba(0,0,0,0.4)] w-fit"
        >
          <div className={`p-2.5 rounded-full ${tx.type === 'payment' ? 'bg-emerald-400/20 text-emerald-400' : 'bg-pink-500/20 text-pink-500'}`}>
            {tx.type === 'payment' ? <ArrowDownLeft size={16} /> : <Receipt size={16} />}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-mono font-bold tracking-tight ${tx.type === 'payment' ? 'text-emerald-400' : 'text-foreground'}`}>{tx.amount}</span>
              {tx.type === 'payment' && <CheckCircle2 size={14} className="text-emerald-400 opacity-80" />}
            </div>
            <div className="text-[10px] text-[#6B7280] font-medium tracking-wider uppercase mt-0.5 flex items-center gap-1">
              {tx.type === 'payment' ? 'From' : 'To'} <span className="text-zinc-400 font-mono tracking-tight">{tx.address}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
