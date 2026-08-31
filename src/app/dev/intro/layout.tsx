"use client";

/**
 * Isolated layout for /dev/intro — strips the global header, footer,
 * animated background and every other chrome so the Intro canvas can
 * occupy the full viewport.
 */
export default function IntroDevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black">
      {children}
    </div>
  );
}
