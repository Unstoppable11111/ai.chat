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
    <section ref={sectionRef} className="relative min-h-[50vh] flex flex-col justify-center items-center bg-background border-t border-slate-900/5 py-24 md:py-32 overflow-hidden">
      <div className="container-shell max-w-4xl mx-auto text-center z-10 relative">
        <h2 ref={textRef} className="text-3xl md:text-5xl lg:text-6xl font-light tracking-tight text-foreground mb-6 flex flex-wrap justify-center gap-x-3 gap-y-1">
          {titleWords.map((word, i) => (
            <span key={i} className="word inline-block will-change-transform opacity-20 transition-colors">
              {word}
            </span>
          ))}
        </h2>
        <p ref={descRef} className="text-sm md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-16 will-change-transform">
          An ongoing experiment in digital craft, creative coding, and technical documentation. 
          Building tools, exploring interfaces, and recording the process.
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-xs font-mono tracking-widest uppercase text-muted-foreground">
          <Link href="/about" className="hover:text-brand-cyan transition-colors border-b border-transparent hover:border-brand-cyan pb-1">
            ABOUT STUDIO
          </Link>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
            GITHUB
          </a>
          <a href="mailto:contact@chenyc.chat" className="hover:text-foreground transition-colors">
            EMAIL
          </a>
        </div>
      </div>
    </section>
  );
}
