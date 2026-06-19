'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { BrutalistButton } from '../brutalism/Button';
import { BlockReveal } from "@/components/animations/BlockReveal";
import { CreateLinkForm } from "@/components/CreateLinkForm";

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
    <section className="relative overflow-hidden w-full bg-[var(--color-section-cyan)] border-b-2 border-[var(--color-border-default)]">

      {/* Grid Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_19px,var(--color-border-default)_20px),linear-gradient(90deg,transparent_19px,var(--color-border-default)_20px)] bg-[length:40px_40px] opacity-[0.15] pointer-events-none" />

      {/* Full Width Falling Coins Layer */}
      <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden opacity-[0.8]" style={{ perspective: "1000px" }}>
        {[...Array(20)].map((_, i) => {
          const domains = [
            'bitcoin.org', 'ethereum.org', 'solana.com', 'sui.io', 
            'base.org', 'arbitrum.io', 'optimism.io', 'polygon.technology',
            'monad.xyz', 'binance.com'
          ];
          const domain = domains[i % domains.length];
          
          const startX = (i % 5) * 45;
          const startY = (i % 7) * 35;
          
          return (
            <motion.div
             key={`coin-${i}`}
             className="absolute w-12 h-12 sm:w-16 sm:h-16"
             initial={{
               y: -150,
               rotateX: startX,
               rotateY: startY,
               rotateZ: 0,
               scale: 0.8 + (i % 3) * 0.2
             }}
             animate={{
               y: 1200,
               rotateX: startX + (i % 2 === 0 ? 360 : -360),
               rotateY: startY + (i % 3 === 0 ? 360 : -360),
               rotateZ: 360
             }}
             transition={{
               duration: 10 + (i % 5) * 3,
               repeat: Infinity,
               ease: "linear",
               delay: (i % 7) * 0.8
             }}
             style={{
               left: `${(i * 5.1) % 100}%`,
               transformStyle: "preserve-3d"
             }}
            >
             {/* 3D Coin Layers to create thickness */}
             {[0, 1, 2, 3, 4].map(layer => (
               <div 
                 key={layer}
                 className="absolute inset-0 rounded-full border-[3px] border-black bg-white flex items-center justify-center p-[6px]"
                 style={{ 
                   transform: `translateZ(${layer * 2 - 4}px)`,
                   backfaceVisibility: "hidden"
                 }}
               >
                 <img src={`https://img.logo.dev/${domain}?token=pk_BShsdiwDTuyRVVBW5GadOg`} alt="coin" className="w-full h-full object-contain rounded-full" />
               </div>
             ))}
             {/* Back face (rotated 180deg) */}
             <div 
               className="absolute inset-0 rounded-full border-[3px] border-black bg-white flex items-center justify-center p-[6px]"
               style={{ 
                 transform: `translateZ(-4px) rotateY(180deg)`,
                 backfaceVisibility: "hidden"
               }}
             >
               <img src={`https://img.logo.dev/${domain}?token=pk_BShsdiwDTuyRVVBW5GadOg`} alt="coin" className="w-full h-full object-contain rounded-full" />
             </div>
            </motion.div>
          )
        })}
      </div>

      {/* Centered Hero Content Area */}
      <div className="flex flex-col items-center w-full max-w-[1152px] mx-auto min-h-[90vh] relative z-10 pt-24 pb-24 px-4 sm:px-6">

        {/* Top: Typography (Centered) */}
        <motion.div
          className="flex flex-col items-center text-center z-10 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="text-[48px] md:text-[64px] lg:text-[80px] font-black leading-[0.95] text-black tracking-tighter mb-6 flex flex-col items-center">
            <BlockReveal blockColor="var(--color-neutral-primary-soft)">
              {["THE FASTEST WAY", "TO GET PAID IN CRYPTO."]}
            </BlockReveal>
          </div>
        </motion.div>

        {/* Middle: Interactive Create Link Widget */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.6 }}
          className="w-full max-w-[768px] relative z-20 bg-white border-[4px] border-black p-4 md:p-6 shadow-[12px_12px_0_0_rgba(0,0,0,1)] mb-12"
        >
          <div className="flex items-center justify-between mb-8 border-b-4 border-black pb-4">
            <h2 className="text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              Create Link
            </h2>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[var(--color-section-green)] animate-pulse border-2 border-black" />
              <span className="text-sm font-bold text-black uppercase tracking-wider">Live</span>
            </div>
          </div>
          <CreateLinkForm />
        </motion.div>

        {/* Bottom: Description */}
        <motion.div
          className="flex flex-col items-center text-center z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <div className="text-[16px] md:text-[18px] font-bold text-black max-w-2xl leading-[1.4] bg-[var(--color-section-pink)] border-2 border-black p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <p>Generate simple payment links. We handle the complex cross-chain routing, bridging, and swapping automatically. You receive exact tokens instantly.</p>
          </div>
        </motion.div>
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
