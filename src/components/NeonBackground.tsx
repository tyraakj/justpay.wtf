import React from 'react';

export function NeonBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex justify-center items-center">
      {/* Container for the neon streaks to keep them contained within a max width if desired, or full screen */}
      <div className="relative w-full h-full max-w-[1400px]">
        
        {/* Deep background ambient glows */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[300px] bg-secondary/10 rounded-full blur-[120px] mix-blend-screen" />

        {/* Neon Light Streaks - Left Side */}
        <div className="absolute top-[20%] -left-[10%] w-[400px] h-6 bg-blue-500/40 rounded-full blur-2xl transform -rotate-2 mix-blend-screen" />
        <div className="absolute top-[25%] -left-[5%] w-[600px] h-8 bg-primary/50 rounded-full blur-3xl transform -rotate-1 mix-blend-screen" />
        <div className="absolute top-[40%] -left-[20%] w-[800px] h-10 bg-indigo-600/30 rounded-full blur-[40px] mix-blend-screen" />
        <div className="absolute top-[60%] -left-[10%] w-[500px] h-4 bg-pink-500/40 rounded-full blur-xl transform rotate-1 mix-blend-screen" />

        {/* Neon Light Streaks - Right Side */}
        <div className="absolute top-[15%] -right-[15%] w-[700px] h-12 bg-secondary/40 rounded-full blur-[50px] transform rotate-3 mix-blend-screen" />
        <div className="absolute top-[35%] -right-[5%] w-[400px] h-6 bg-purple-500/50 rounded-full blur-2xl transform rotate-1 mix-blend-screen" />
        <div className="absolute top-[55%] -right-[10%] w-[600px] h-8 bg-blue-600/40 rounded-full blur-3xl transform -rotate-2 mix-blend-screen" />
        <div className="absolute top-[75%] -right-[20%] w-[900px] h-12 bg-primary/30 rounded-full blur-[60px] mix-blend-screen" />
        
        {/* Center passing streaks */}
        <div className="absolute top-[45%] left-[20%] w-[50%] h-3 bg-cyan-400/30 rounded-full blur-lg mix-blend-screen" />
        <div className="absolute top-[50%] right-[20%] w-[40%] h-4 bg-fuchsia-500/30 rounded-full blur-xl mix-blend-screen" />
      </div>
    </div>
  );
}
