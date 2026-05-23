import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AnimatedBackground } from "@/components/shared/animated-background";
import { InteractiveEffects } from "@/components/shared/interactive-effects";
import { CommandMenu } from "@/components/ui/command-menu";
import { siteConfig } from "@/data/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "personal tech portfolio",
    "development log",
    "creative coding",
    "web experiments",
    "personal projects",
    "个人技术展示",
    "项目记录",
    "构建日志",
    "学习笔记",
    "Next.js 个人网站",
    "网站开发记录",
  ],
  authors: [{ name: "Chen" }],
  creator: "Chen",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground">
        <AnimatedBackground />
        <InteractiveEffects />
        <div className="relative z-10 flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1 pt-24">{children}</main>
          <SiteFooter />
        </div>
        <CommandMenu />
      </body>
    </html>
  );
}
