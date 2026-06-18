import { Zap } from 'lucide-react';
import { getPolicy } from '@/lib/config/chain-policy';

interface FeeDisclosureBannerProps {
  chain: string;
}

export function FeeDisclosureBanner({ chain }: FeeDisclosureBannerProps) {
  return (
    <div className="flex items-center justify-center p-4 bg-[var(--color-section-green)] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] w-full">
      <div className="flex items-center gap-3 text-black font-black uppercase tracking-wider text-[18px] md:text-[24px]">
        <Zap className="w-8 h-8" strokeWidth={3} />
        <span>Platform Fee: 0%</span>
      </div>
    </div>
  );
}
