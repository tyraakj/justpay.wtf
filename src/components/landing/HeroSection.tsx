'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { BrutalistButton } from '../brutalism/Button';
import { BlockReveal } from "@/components/animations/BlockReveal";
import { HeroPaymentWidget } from './HeroPaymentWidget';

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

        {/* Right Side: Payment Widget */}
        <div className="flex-1 bg-[var(--color-section-cyan)] flex items-center justify-center p-8 border-t-2 lg:border-t-0 border-[var(--color-border-default)] relative">
          {/* Grid Background Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(transparent_19px,var(--color-border-default)_20px),linear-gradient(90deg,transparent_19px,var(--color-border-default)_20px)] bg-[length:40px_40px] opacity-[0.15]" />
          <div className="relative z-10">
            <HeroPaymentWidget />
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
