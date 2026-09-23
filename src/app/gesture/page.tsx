import type { Metadata } from "next";
import { GestureSystem } from "@/components/gesture/gesture-system";

export const metadata: Metadata = {
  title: "3D 粒子流与手势多模态交互系统 · Chen Tech Studio",
  description:
    "高吞吐 WebGL 3D 粒子场与移动端全触控/桌面摄像头手势交互系统。包含星系星云、量子心动、双螺旋DNA、超新星等形态变幻与音频律动。",
  alternates: { canonical: "/gesture" },
};

export default function GesturePage() {
  return (
    <main className="w-full min-h-[calc(100vh-64px)] bg-slate-950">
      <GestureSystem />
    </main>
  );
}
