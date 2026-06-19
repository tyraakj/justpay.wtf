'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { BlockReveal } from '@/components/animations/BlockReveal';

const faqs = [
  {
    question: 'Is justpay.wtf really non-custodial?',
    answer: 'Yes. We never hold your funds. Payments are routed directly from the payer to the recipient using decentralized liquidity networks. We cannot freeze, block, or access your money.'
  },
  {
    question: 'What happens if a cross-chain swap fails?',
    answer: 'If a transaction fails before it is broadcast, you lose nothing. If it reverts on-chain due to high slippage, your funds remain in your wallet (minus the small network gas fee). We use exact-out routing to ensure the recipient always gets the exact requested amount if the transaction succeeds.'
  },
  {
    question: 'Which wallets and chains are supported?',
    answer: 'Currently we support EVM wallets (MetaMask, Rainbow, Coinbase Wallet) paying on Base, as well as Solana wallets (Phantom, Solflare) and Sui wallets on their respective networks.'
  },
  {
    question: 'Are there any platform fees?',
    answer: 'No. justpay.wtf charges 0% in platform fees. The payer is only responsible for the standard network gas fees and any liquidity provider fees (slippage) incurred during cross-chain swaps.'
  }
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="w-full bg-[var(--color-neutral-primary-soft)] border-b-2 border-black py-[96px]">
      <div className="max-w-[800px] mx-auto px-[24px] flex flex-col gap-12 text-black">
        
        <div className="flex flex-col gap-4 text-center items-center">
          <h2 className="text-[16px] font-bold text-[var(--color-section-brand)] uppercase tracking-widest border-2 border-black px-4 py-1 bg-white inline-block w-max shadow-[2px_2px_0_0_#000]">
            Information
          </h2>
          <BlockReveal blockColor="var(--color-section-yellow)">
            <h2 className="text-[48px] md:text-[64px] font-black text-black leading-[0.95] tracking-tighter uppercase mb-4 text-center">
              Got Questions?
            </h2>
          </BlockReveal>
          <p className="text-[20px] font-bold text-black pb-2 inline-block max-w-full text-center">
            Everything you need to know about how we route your payments.
          </p>
        </div>

        <div className="flex flex-col w-full relative z-10 perspective-1000">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <motion.div
                key={index}
                initial={false}
                animate={{
                  y: isOpen ? 0 : 0,
                  marginBottom: isOpen ? "16px" : "-4px",
                  marginTop: isOpen ? "16px" : "0px",
                  backgroundColor: isOpen ? 'var(--color-section-yellow)' : 'var(--color-neutral-secondary-soft)',
                  zIndex: isOpen ? 20 : 10
                }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className={`relative border-4 border-black overflow-hidden hover:bg-[var(--color-section-cyan)] hover:text-black transition-colors ${
                  isOpen ? 'shadow-[8px_8px_0_0_#000]' : ''
                }`}
              >
                <div 
                  onClick={() => handleToggle(index)}
                  className="flex items-center justify-between p-5 md:p-6 cursor-pointer select-none"
                >
                  <span className="text-[20px] md:text-[24px] font-black uppercase pr-4">
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{
                      rotate: isOpen ? 180 : 0,
                      backgroundColor: isOpen ? '#000' : '#fff',
                      color: isOpen ? '#fff' : '#000'
                    }}
                    transition={{ duration: 0.3 }}
                    className="border-2 border-black w-8 h-8 flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0_0_#000]"
                  >
                    <ChevronDown size={20} className="w-5 h-5" strokeWidth={3} />
                  </motion.div>
                </div>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 900,
                        damping: 80,
                        mass: 10,
                      }}
                    >
                      <div className="px-5 md:px-6 pb-6 pt-0 text-[18px] font-bold">
                        <div className="border-t-2 border-black border-dashed pt-4 mt-2">
                          {faq.answer}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
