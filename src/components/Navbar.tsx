import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-6xl mx-auto glass rounded-2xl px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center">
            <span className="text-white font-bold text-lg">j</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">justpay.wtf</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/how-it-works" className="text-gray-400 hover:text-white transition-colors">
            How it works
          </Link>
          <Link href="/docs" className="text-gray-400 hover:text-white transition-colors">
            Docs
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard" 
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all border border-white/5"
          >
            Launch App
          </Link>
        </div>
      </div>
    </nav>
  );
}
