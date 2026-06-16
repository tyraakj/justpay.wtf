'use client';

import { useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Wallet, Activity, ArrowRightLeft, ShieldCheck, Cpu } from 'lucide-react';
import LiquidEther from './LiquidEther';
import { FloatingTransactions } from './FloatingTransactions';

gsap.registerPlugin(useGSAP);

export function HeroSection() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline();

    // Text Reveal
    tl.from('.hero-title-line', {
      y: 100,
      opacity: 0,
      duration: 1,
      stagger: 0.2,
      ease: 'power4.out',
      delay: 0.2
    })
    .from('.hero-subtitle', {
      y: 20,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    }, "-=0.5")
    .from('.hero-cta', {
      scale: 0.9,
      opacity: 0,
      duration: 0.5,
      ease: 'back.out(1.7)'
    }, "-=0.4");

    // Floating Web3 Elements
    gsap.to('.floating-icon-1', {
      y: -20,
      rotation: 10,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
    
    gsap.to('.floating-icon-2', {
      y: 25,
      rotation: -15,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 0.5
    });

    gsap.to('.floating-icon-3', {
      y: -15,
      x: 15,
      rotation: 5,
      duration: 3.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 1
    });

    // Parallax Mouse Effect
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const xPos = (e.clientX / innerWidth - 0.5) * 2; // -1 to 1
      const yPos = (e.clientY / innerHeight - 0.5) * 2; // -1 to 1

      gsap.to('.floating-icon-1', { x: xPos * 40, y: yPos * 40, duration: 1, ease: 'power2.out' });
      gsap.to('.floating-icon-2', { x: xPos * -30, y: yPos * -30, duration: 1, ease: 'power2.out' });
      gsap.to('.floating-icon-3', { x: xPos * 50, y: yPos * 50, duration: 1, ease: 'power2.out' });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);

  }, { scope: container });

  return (
    <div ref={container} className="relative min-h-[80vh] flex flex-col items-center justify-center pt-24 pb-12 px-6 overflow-hidden w-full">
      
      {/* Floating Web3 Components Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden max-w-7xl mx-auto">
        <div className="floating-icon-1 absolute top-[20%] left-[10%] p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-[16px] shadow-2xl shadow-pink-500/10">
          <Wallet className="w-8 h-8 text-pink-500" />
        </div>
        <div className="floating-icon-2 absolute top-[60%] left-[15%] p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-[16px] shadow-2xl shadow-emerald-500/10">
          <ArrowRightLeft className="w-8 h-8 text-emerald-500" />
        </div>
        <div className="floating-icon-3 absolute top-[30%] right-[10%] p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-[16px] shadow-2xl shadow-rose-400/10">
          <ShieldCheck className="w-8 h-8 text-rose-400" />
        </div>
        <div className="floating-icon-1 absolute top-[65%] right-[15%] p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-[16px] shadow-2xl shadow-teal-400/10">
          <Cpu className="w-8 h-8 text-teal-400" />
        </div>
      </div>

      <FloatingTransactions />

      <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
        <LiquidEther
          colors={['#EC4899', '#10B981', '#BE185D']}
          mouseForce={20}
          cursorSize={100}
          isViscous
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo
          autoSpeed={1.0}
          autoIntensity={2.4}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto text-center relative z-10">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-extrabold text-foreground tracking-tight leading-[1.1]">
          <div className="overflow-hidden">
            <span className="hero-title-line block">The fastest way to</span>
          </div>
          <div className="overflow-hidden pb-4">
            <span className="hero-title-line block text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-400 to-emerald-400 drop-shadow-[0_0_30px_rgba(236,72,153,0.4)]">
              get paid in crypto.
            </span>
          </div>
        </h1>
        
        <p className="hero-subtitle text-xl md:text-2xl text-zinc-400 font-medium leading-relaxed max-w-2xl mx-auto mb-8">
          Generate simple payment links. We handle the complex cross-chain routing, bridging, and swapping automatically. You receive exact USDC instantly.
        </p>
      </div>
    </div>
  );
}
