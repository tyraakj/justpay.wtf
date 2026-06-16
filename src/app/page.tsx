import { HeroSection } from "@/components/landing/HeroSection";
import { DemoSection } from "@/components/landing/DemoSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { ContactSection } from "@/components/landing/ContactSection";

export default function LandingPage() {
  return (
    <div className="flex flex-col w-full relative z-10 overflow-hidden">
      <HeroSection />
      
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0A]/50 to-transparent pointer-events-none" />
        <DemoSection />
      </div>

      <HowItWorksSection />
      
      <div className="relative border-t border-border bg-[#050505]/30">
        <ContactSection />
      </div>
    </div>
  );
}
