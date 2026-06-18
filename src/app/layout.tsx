import type { Metadata } from "next";

import "./globals.css";
import { ConvexClientProvider } from "@/providers/ConvexClientProvider";
import { Web3Provider } from "@/providers/Web3Provider";
import { Navbar } from "@/components/Navbar";
// NeonBackground removed for Brutalism theme
import { Footer } from "@/components/shared/Footer";

import "@fontsource/darker-grotesque/400.css";
import "@fontsource/darker-grotesque/600.css";
import "@fontsource/darker-grotesque/700.css";
import "@fontsource/darker-grotesque/800.css";
import "@fontsource/darker-grotesque/900.css";

export const metadata: Metadata = {
  title: "justpay.wtf — Frictionless Crypto Payments",
  description: "A zero-auth payment link generator with integrated swap/bridge for Solana & Ethereum.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col relative">
        <ConvexClientProvider>
          <Web3Provider>
            <Navbar />
            <div className="relative z-10 flex flex-col flex-1">
              {children}
            </div>
            <Footer />
          </Web3Provider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
