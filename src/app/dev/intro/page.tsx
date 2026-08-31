"use client";

import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Three.js / WebGL
const IntroExperience = dynamic(
  () => import("@/components/intro/IntroExperience"),
  { ssr: false }
);

/**
 * Development page for the Intro prototype.
 * URL: /dev/intro
 * Uses its own layout (layout.tsx) to strip global header/footer.
 */
export default function IntroDevPage() {
  return <IntroExperience />;
}
