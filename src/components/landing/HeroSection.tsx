'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { BrutalistButton } from '../brutalism/Button';
import { BlockReveal } from "@/components/animations/BlockReveal";

export function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 }
    }
  };

  return (
    <section className="relative overflow-hidden w-full bg-[var(--color-neutral-secondary-soft)] border-b-2 border-[var(--color-border-default)]">
      
      {/* Full Width Falling Coins Layer */}
      <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
        {[...Array(24)].map((_, i) => (
          <motion.div
            key={`coin-${i}`}
            className="absolute text-[30px] md:text-[50px] opacity-[0.15] text-black"
            initial={{ 
              y: -150, 
              rotate: 0 
            }}
            animate={{ 
              y: 1200, 
              rotate: 360 
            }}
            transition={{
              duration: 8 + (i % 5) * 2,
              repeat: Infinity,
              ease: "linear",
              delay: (i % 7) * 0.8
            }}
            style={{
              left: `${(i * 4.1) % 100}%`
            }}
          >
            {i % 4 === 0 && '₿'}
            {i % 4 === 1 && 'Ξ'}
            {i % 4 === 2 && '◎'}
            {i % 4 === 3 && <Wallet size="1em" className="inline-block text-black" strokeWidth={2.5} />}
          </motion.div>
        ))}
      </div>

      {/* Hero Content Area */}
      <div className="flex flex-col lg:flex-row w-full max-w-[1152px] mx-auto min-h-[80vh] relative z-10">
        
        {/* Left Side: Typography */}
        <motion.div 
          className="flex-1 px-6 py-24 flex flex-col justify-center border-r-0 lg:border-r-2 border-[var(--color-border-default)] z-10 bg-[var(--color-neutral-secondary-soft)]"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="text-[64px] md:text-[80px] lg:text-[100px] font-bold leading-[0.95] text-[var(--color-heading)] tracking-tighter mb-8">
            <BlockReveal blockColor="var(--color-section-cyan)">
              {["THE FASTEST", "WAY TO GET", "PAID IN CRYPTO."]}
            </BlockReveal>
          </div>
          <div className="text-[20px] font-bold text-[var(--color-heading)] mb-10 max-w-xl leading-[1.4]">
            <BlockReveal delay={0.6} blockColor="var(--color-section-pink)" stagger={0} duration={0.4}>
              <p>Generate simple payment links. We handle the complex cross-chain routing, bridging, and swapping automatically. You receive exact USDC instantly.</p>
            </BlockReveal>
          </div>
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <BrutalistButton variant="brand" size="xl" className="w-full sm:w-auto border-[var(--color-border-default)] hover:shadow-[var(--shadow-lg)]">
                  Create a Free Payment Link
                </BrutalistButton>
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>

        {/* Right Side: Brutalist Graphic / Demo Visual */}
        <div className="flex-1 bg-[var(--color-section-cyan)] flex items-center justify-center p-8 border-t-2 lg:border-t-0 border-[var(--color-border-default)] relative">
          {/* Grid Background Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(transparent_19px,var(--color-border-default)_20px),linear-gradient(90deg,transparent_19px,var(--color-border-default)_20px)] bg-[length:40px_40px] opacity-[0.15]" />
          
          {/* Isometric Transaction Cards */}
          <div className="relative w-full h-full min-h-[500px]">
            {[
              { type: 'payment', amount: "Pay 50 USDC", chain: "Solana", color: "var(--color-section-green)", rotate: -12, top: "5%", left: "5%", delay: 0.1, zIndex: 10 },
              { type: 'payment', amount: "Pay 0.5 ETH", chain: "Base", color: "var(--color-section-blue)", rotate: 8, top: "25%", left: "45%", delay: 0.3, zIndex: 15 },
              { type: 'payment', amount: "Pay 100 USDC", chain: "Any Chain", color: "var(--color-section-pink)", rotate: -5, top: "55%", left: "15%", delay: 0.5, zIndex: 20 },
              { type: 'receipt', amount: "50 USDC", chain: "Solana", color: "var(--color-section-yellow)", rotate: 12, top: "65%", left: "60%", delay: 0.7, zIndex: 25 },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0, y: 50, rotate: card.rotate - 30 }}
                animate={{ scale: 1, opacity: 1, y: 0, rotate: card.rotate }}
                transition={{ type: "spring", bounce: 0.5, delay: card.delay }}
                whileHover={{ scale: 1.05, rotate: 0, zIndex: 50, transition: { duration: 0.2 } }}
                className="absolute w-[280px] bg-[var(--color-neutral-primary-soft)] border-4 border-black p-4 cursor-pointer"
                style={{
                  boxShadow: '12px 12px 0px 0px rgba(0,0,0,1)',
                  top: card.top,
                  left: card.left,
                  zIndex: card.zIndex,
                }}
              >
                {card.type === 'receipt' ? (
                  <>
                    <div className="border-b-4 border-black pb-3 mb-3 text-center">
                      <div className="mx-auto w-12 h-12 rounded-full bg-[var(--color-section-green)] border-4 border-black flex items-center justify-center mb-2">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <h3 className="text-[24px] font-black m-0 text-black uppercase">Receipt</h3>
                      <p className="text-black font-bold text-sm">justpay.wtf</p>
                    </div>
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between font-bold text-black border-b-2 border-dashed border-black/30 pb-2">
                        <span>PAID</span>
                        <span>{card.amount}</span>
                      </div>
                      <div className="flex justify-between font-bold text-black border-b-2 border-dashed border-black/30 pb-2">
                        <span>NETWORK</span>
                        <span>{card.chain}</span>
                      </div>
                      <div className="mt-4 pt-2 text-center font-black text-2xl text-[var(--color-section-green)]" style={{ textShadow: '2px 2px 0 #000' }}>
                        SUCCESS
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="border-b-4 border-[var(--color-border-default)] pb-3 mb-3 flex justify-between items-center">
                      <h3 className="text-[20px] font-bold m-0 text-black">justpay.wtf</h3>
                      <span className="bg-black text-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider">Active</span>
                    </div>
                    <div className="space-y-3">
                      <div className="h-10 bg-[var(--color-neutral-tertiary-medium)] border-2 border-black w-full flex items-center px-4 font-black text-black">
                        {card.amount}
                      </div>
                      <div className="h-10 border-2 border-black w-3/4 flex items-center px-4 font-black text-black" style={{ backgroundColor: card.color }}>
                        {card.chain}
                      </div>
                      <button className="w-full bg-black text-white font-bold h-10 mt-2 hover:opacity-80 transition-opacity">
                        Confirm Payment
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}

            {/* Floating Cursor pointing at the middle card */}
            <motion.div
              initial={{ opacity: 0, x: 50, y: 50 }}
              animate={{ opacity: 1, x: [0, -10, 0], y: [0, -10, 0] }}
              transition={{ 
                opacity: { delay: 1, duration: 0.5 },
                x: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                y: { repeat: Infinity, duration: 2, ease: "easeInOut" }
              }}
              className="absolute z-[60] pointer-events-none"
              style={{ top: "35%", left: "35%" }}
            >
              <svg width="64" height="64" viewBox="0 0 24 24" className="drop-shadow-[6px_6px_0_rgba(0,0,0,1)]">
                <path d="M4 0 L20 12 L12 14 L16 22 L12 24 L8 16 L0 20 Z" fill="white" stroke="black" strokeWidth="1.5" />
              </svg>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Brutalist Marquee Banner at bottom */}
      <div className="w-full bg-[var(--color-dark)] text-white border-t-2 border-[var(--color-border-default)] py-3 overflow-hidden whitespace-nowrap flex relative z-10">
        <div className="animate-hero-marquee inline-block font-bold text-[20px] uppercase tracking-widest px-4">
          SOLANA • BASE • SUI • SOLANA • BASE • SUI • SOLANA • BASE • SUI • SOLANA • BASE • SUI • SOLANA • BASE • SUI • 
        </div>
        <div className="animate-hero-marquee inline-block font-bold text-[20px] uppercase tracking-widest px-4">
          SOLANA • BASE • SUI • SOLANA • BASE • SUI • SOLANA • BASE • SUI • SOLANA • BASE • SUI • SOLANA • BASE • SUI • 
        </div>
      </div>
      <style>{`
        .animate-hero-marquee {
          animation: hero-scroll 20s linear infinite;
        }
        @keyframes hero-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </section>
  );
}
