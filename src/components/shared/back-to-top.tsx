"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? scrollY / docHeight : 0;
      
      setProgress(scrollPercent);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const circumference = 2 * Math.PI * 22;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-[5.5rem] right-6 z-[99] flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-2xl transition-colors duration-300 group opacity-100 translate-y-0 hover:bg-slate-800"
      aria-label="Back to top"
    >
      {/* SVG Progress Ring */}
      <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-1">
        <circle
          cx="24"
          cy="24"
          r="22"
          className="stroke-white/10 fill-none"
          strokeWidth="2"
        />
        <circle
          cx="24"
          cy="24"
          r="22"
          className="stroke-white fill-none transition-all duration-150 ease-out"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <ArrowUp className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
    </button>
  );
}
