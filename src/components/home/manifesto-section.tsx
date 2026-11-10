"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function ManifestoSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion || !sectionRef.current || !textRef.current || !descRef.current) return;

    const ctx = gsap.context(() => {
      // 标题逐词高亮
      const titleWords = textRef.current?.querySelectorAll(".word");
      if (titleWords) {
        gsap.fromTo(
          titleWords,
          { opacity: 0.15, y: 10 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 75%",
              end: "top 25%",
              scrub: 1,
            },
          }
        );
      }

      // 描述文案高亮
      gsap.fromTo(
        descRef.current,
        { opacity: 0.3, filter: "blur(4px)" },
        {
          opacity: 1,
          filter: "blur(0px)",
          ease: "power1.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
            end: "top 20%",
            scrub: 1,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [reduceMotion]);

  const titleText = "THE STUDIO IS ALWAYS BUILDING.";
  const titleWords = titleText.split(" ");

  return (
    <section ref={sectionRef} className="relative min-h-[50vh] flex flex-col justify-center items-center bg-background border-t border-white/10 py-24 md:py-32 overflow-hidden">
      <div className="container-shell max-w-4xl mx-auto text-center z-10 relative">
        <h2 ref={textRef} className="text-3xl md:text-5xl lg:text-6xl font-light tracking-tight text-white mb-6 flex flex-wrap justify-center gap-x-3 gap-y-1 drop-shadow-[0_0_24px_rgba(255,255,255,0.2)]">
          {titleWords.map((word, i) => (
            <span key={i} className="word inline-block will-change-transform opacity-20 transition-colors">
              {word}
            </span>
          ))}
        </h2>
        <p ref={descRef} className="text-sm md:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto mb-16 will-change-transform">
          An ongoing experiment in digital craft, creative coding, and technical documentation. 
          Building tools, exploring interfaces, and recording the process.
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-xs font-mono tracking-widest uppercase text-slate-400">
          <Link href="/about" className="hover:text-cyan-400 transition-colors border-b border-transparent hover:border-cyan-400 pb-1">
            ABOUT STUDIO
          </Link>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
            GITHUB
          </a>
          <a href="mailto:chenyc0507@gmail.com" className="hover:text-white transition-colors">
            EMAIL
          </a>
        </div>
      </div>
    </section>
  );
}
