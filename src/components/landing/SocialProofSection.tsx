'use client';

import { motion } from 'framer-motion';
import { BlockReveal } from "@/components/animations/BlockReveal";

export function SocialProofSection() {
  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        type: "spring",
        stiffness: 200,
        damping: 20
      }
    })
  };

  return (
    <section id="supported-chains" className="w-full bg-[var(--color-section-pink)] border-b-2 border-[var(--color-border-default)] py-[96px] overflow-hidden">
      <div className="max-w-[1152px] mx-auto px-[24px]">
        <div className="flex flex-col gap-4 text-left items-start mb-16">
          <h2 className="text-[16px] font-bold text-[var(--color-section-brand)] uppercase tracking-widest border-2 border-[var(--color-border-default)] px-4 py-1 bg-[var(--color-neutral-primary-soft)] inline-block w-max">Statistics</h2>
          <BlockReveal blockColor="var(--color-neutral-primary-soft)">
            <h2 className="text-[48px] md:text-[64px] font-black text-[var(--color-heading)] leading-[0.95] tracking-tighter uppercase mb-4">Built for Scale</h2>
          </BlockReveal>
          <p className="text-[20px] font-bold text-[var(--color-heading)] border-b-4 border-[var(--color-border-default)] pb-2 inline-block w-max max-w-full">
            Trusted by decentralized applications across the ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div 
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={itemVariants}
            whileHover={{ scale: 1.05, rotate: 0 }}
            className="bg-[var(--color-neutral-primary-soft)] border-2 border-[var(--color-border-default)] shadow-[var(--shadow-sm)] p-8 text-center flex flex-col justify-center transform -rotate-1 transition-colors hover:bg-[var(--color-section-cyan)]"
          >
            <span className="text-[48px] font-bold text-[var(--color-heading)] leading-none mb-2">100%</span>
            <span className="text-[16px] font-bold text-[var(--color-body)] uppercase tracking-wider">Non-Custodial</span>
          </motion.div>
          
          <motion.div 
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={itemVariants}
            whileHover={{ scale: 1.05, rotate: 0 }}
            className="bg-[var(--color-neutral-primary-soft)] border-2 border-[var(--color-border-default)] shadow-[var(--shadow-sm)] p-8 text-center flex flex-col justify-center transform rotate-1 transition-colors hover:bg-[var(--color-section-yellow)]"
          >
            <span className="text-[48px] font-bold text-[var(--color-heading)] leading-none mb-2">$0.00</span>
            <span className="text-[16px] font-bold text-[var(--color-body)] uppercase tracking-wider">Platform Fees</span>
          </motion.div>
          
          <motion.div 
            custom={2}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={itemVariants}
            whileHover={{ scale: 1.05, rotate: 0 }}
            className="bg-[var(--color-neutral-primary-soft)] border-2 border-[var(--color-border-default)] shadow-[var(--shadow-sm)] p-8 text-center flex flex-col justify-center transform -rotate-2 transition-colors hover:bg-[var(--color-section-green)]"
          >
            <span className="text-[48px] font-bold text-[var(--color-heading)] leading-none mb-2">3</span>
            <span className="text-[16px] font-bold text-black uppercase tracking-wider">Supported Chains</span>
          </motion.div>
          
          <motion.div 
            custom={3}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={itemVariants}
            whileHover={{ scale: 1.05, rotate: 0 }}
            className="bg-[var(--color-neutral-primary-soft)] border-2 border-[var(--color-border-default)] shadow-[var(--shadow-sm)] p-8 text-center flex flex-col justify-center transform rotate-2 transition-colors hover:bg-[var(--color-section-purple)]"
          >
            <span className="text-[48px] font-bold text-[var(--color-heading)] leading-none mb-2">&lt; 3s</span>
            <span className="text-[16px] font-bold text-[var(--color-body)] uppercase tracking-wider">Avg Settlement</span>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
