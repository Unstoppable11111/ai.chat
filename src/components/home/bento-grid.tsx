"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Reveal } from "@/components/shared/reveal";
import { SectionHeading } from "@/components/shared/section-heading";

const items = [
  {
    href: "/experiments",
    title: "实验记录",
    description: "用于归档网站视觉、页面构建、品牌画面和提示词学习资料的实验记录。",
    span: "md:col-span-2",
  },
  {
    href: "/build-log",
    title: "构建日志",
    description: "记录我如何在设计、代码和学习过程中持续把页面与项目做出来。",
  },
  {
    href: "/prompts",
    title: "学习笔记",
    description: "用于产品视觉、发布物料与创意工作流的提示词学习资料。",
  },
  {
    href: "/projects",
    title: "项目案例",
    description: "精选的产品、系统、界面与实验案例，展示它们如何变成结果。",
    span: "md:col-span-2",
  },
  {
    href: "/stack",
    title: "工具整理",
    description: "整理支撑个人项目、网站开发、内容记录与自动化的常用工具。",
  },
  {
    href: "/about",
    title: "关于我",
    description: "不是自我包装，而是一份围绕持续构建展开的个人工作画像。",
  },
];

export function BentoGrid() {
  const reduceMotion = useReducedMotion();
  const [featured, ...secondaryItems] = items;

  return (
    <section className="studio-section">
      <SectionHeading
        eyebrow="站点地图"
        title="核心入口"
        description="这里整理了个人项目、构建日志、学习资料和开发实验入口。"
      />
      <div className="grid gap-4">
        <Reveal delay={0} once>
          <motion.div
            className="group"
            whileHover={reduceMotion ? undefined : { y: -6 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <Link
              href={featured.href}
              className="flex min-h-[240px] flex-col justify-between overflow-hidden rounded-[28px] border border-slate-900/8 bg-slate-950 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] transition-shadow duration-300 md:min-h-[280px] md:p-7"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-white/54 sm:tracking-[0.24em]">主入口</p>
                <h3 className="mt-7 max-w-[12ch] text-4xl font-semibold tracking-tight md:mt-8 md:text-5xl">
                  {featured.title}
                </h3>
                <p className="mt-5 max-w-md text-sm leading-7 text-white/68">
                  {featured.description}
                </p>
              </div>
              <span className="mt-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/14 bg-white/10 text-white/80 transition duration-300 group-hover:bg-white group-hover:text-slate-950">
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </motion.div>
        </Reveal>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {secondaryItems.map((item, index) => (
            <Reveal
              key={item.href}
              delay={(index + 1) * 0.04}
              once
            >
              <motion.div
                className="group h-full"
                whileHover={reduceMotion ? undefined : { y: -6 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <Link
                  href={item.href}
                  className="grid h-full gap-4 rounded-[22px] border border-slate-900/8 bg-white/52 p-5 transition-colors duration-300 group-hover:bg-white/78"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground sm:tracking-[0.24em]">入口</p>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <span className="mt-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-900/8 bg-white/70 text-muted-foreground transition duration-300 group-hover:border-brand-cyan/24 group-hover:text-foreground">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
