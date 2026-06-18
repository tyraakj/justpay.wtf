import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t-4 border-black bg-[var(--color-neutral-primary-soft)] py-8 mt-auto relative z-10">
      <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-bold text-black">
        <div className="flex flex-col items-center md:items-start gap-1">
          <p>© {new Date().getFullYear()} justpay.wtf. All rights reserved.</p>
          <p className="text-xs text-black/60 font-black uppercase tracking-wider">A zero-custody execution layer.</p>
        </div>
        
        <div className="flex items-center gap-6 font-black uppercase">
          <Link href="/docs/terms" className="hover:text-[var(--color-section-pink)] transition-colors">
            Terms of Service
          </Link>
          <Link href="/docs/privacy" className="hover:text-[var(--color-section-cyan)] transition-colors">
            Privacy Policy
          </Link>
          <Link href="/docs/risk" className="hover:text-[var(--color-section-yellow)] transition-colors">
            Risk Disclosure
          </Link>
        </div>
      </div>
    </footer>
  );
}
