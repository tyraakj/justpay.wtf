import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";
import { Navbar } from "@/components/Navbar";
import { NeonBackground } from "@/components/NeonBackground";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

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
    <html lang="en" className={`${jakarta.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col relative">
        <Web3Provider>
          <NeonBackground />
          <Navbar />
          <div className="relative z-10 flex flex-col flex-1">
            {children}
          </div>
        </Web3Provider>
      </body>
    </html>
  );
}
