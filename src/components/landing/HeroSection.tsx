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

      {/* Centered Hero Content Area */}
      <div className="flex flex-col items-center w-full max-w-[1152px] mx-auto min-h-[90vh] relative z-10 pt-24 pb-24 px-4 sm:px-6">

        {/* Top: Typography (Centered) */}
        <motion.div
          className="flex flex-col items-center text-center z-10 mb-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="text-[48px] md:text-[64px] lg:text-[80px] font-black leading-[0.95] text-black tracking-tighter mb-6 flex flex-col items-center">
            <BlockReveal blockColor="var(--color-neutral-primary-soft)">
              {["THE FASTEST", "WAY TO GET", "PAID IN CRYPTO."]}
            </BlockReveal>
          </div>
          <div className="text-[18px] md:text-[20px] font-bold text-black mb-8 max-w-xl leading-[1.4] bg-white border-2 border-black p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <BlockReveal delay={0.6} blockColor="var(--color-section-pink)" stagger={0} duration={0.4}>
              <p>Generate simple payment links. We handle the complex cross-chain routing, bridging, and swapping automatically. You receive exact USDC instantly.</p>
            </BlockReveal>
          </div>
        </motion.div>

        {/* Middle: Interactive Create Link Widget */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.8 }}
          className="w-full max-w-[480px] relative z-20"
        >
          <CreateLinkForm />
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
