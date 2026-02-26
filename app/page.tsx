"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Load ChatUI only on the client side to prevent "Hydration Mismatch" errors
const ChatUI = dynamic(() => import("@/components/ChatUI"), { 
  ssr: false,
  loading: () => <div className="text-cyan-400 animate-pulse">Initializing Vaani AI...</div>
});

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
      <div className="text-center mb-6 animate-in fade-in duration-1000">
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
          Project <span className="text-cyan-400">Vaani</span>
        </h1>
        <p className="text-slate-500 text-sm mt-2 tracking-widest uppercase">
          Multilingual Emotion-Aware Assistant
        </p>
      </div>
      
      {mounted && <ChatUI />}
    </main>
  );
}