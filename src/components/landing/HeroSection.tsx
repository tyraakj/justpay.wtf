'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { HeroPaymentWidget } from './HeroPaymentWidget';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden w-full min-h-[100vh] flex flex-col items-center justify-center bg-[var(--color-neutral-secondary-soft)] border-b-2 border-[var(--color-border-default)]">
      
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_39px,var(--color-border-default)_40px),linear-gradient(90deg,transparent_39px,var(--color-border-default)_40px)] bg-[length:80px_80px] opacity-[0.06]" />

      {/* Centered content */}
      <div className="relative z-10 w-full max-w-[520px] mx-auto px-4 py-16 flex flex-col items-center gap-8">
        
        {/* Short heading above the widget */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h1 className="text-[36px] md:text-[48px] font-black leading-[1] text-[var(--color-heading)] tracking-tight">
            Get Paid in Crypto.
          </h1>
          <p className="text-[16px] font-bold text-black/60 mt-3">
            Generate a payment link in seconds. No signup. No fees.
          </p>
        </motion.div>

        {/* The form IS the hero — full width, centered */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
        >
          <HeroPaymentWidget />
        </motion.div>

        {/* Supported chains hint */}
        <motion.p 
          className="text-[13px] font-bold text-black/40 uppercase tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Base • Solana • Sui — Cross-chain routing included
        </motion.p>
      </div>
    </section>
  );
}
