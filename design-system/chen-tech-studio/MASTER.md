# Design System Master File — Chen Tech Studio (v3.0)

> **ARCHITECTURAL PARADIGM:** **Architectural Cyber-Editorial & Precision Telemetry OS**
> Hybrid synthesis via `ui-ux-pro-max` combining:
> - **#42 Swiss Modernism 2.0** (Exposed hairline grid `1px solid rgba(255,255,255,0.08)`, asymmetric split columns, structured indices)
> - **#15 Bento Box Grid** (Asymmetric multi-span interactive telemetry & lab matrix)
> - **#46 Sci-Fi HUD / FUI** (Monospace coordinate rails, corner crosshair markers `+`, status LEDs, signal dividers)
> - **#28 Kinetic Typography** (High-contrast Pure White `#F8FAFC` / Obsidian Void `#04060B` architectural display hierarchy)

---

**Project:** Chen Tech Studio
**Generated:** 2026-11-13
**Domain:** Full-Stack AI Engineering · RAG Knowledge Engine · A-Share Quant Research Arena · WebGL Labs · Industrial Storyboard Workflow
**Design Dials:** Variance 9/10 (Bold / Asymmetric) | Motion 8/10 (Complex) | Density 6/10 (Precision Standard)

---

## 1. Color & Surface Architecture

| Role | Hex / Value | CSS Token | Usage |
|------|-------------|-----------|-------|
| Primary Void Canvas | `#04060B` | `--background` | Main Obsidian page ground |
| Blueprint Slate | `#080C16` | `--background-muted` | Recessed sections & terminal wells |
| Command Deck Surface | `#0C1222` | `--panel-strong` | Elevated Bento frames & modals |
| Interactive Cell | `#111A2E` | `--panel-soft` | Active states & nested cards |
| Primary Foreground | `#F8FAFC` | `--foreground` | Display headlines & high-contrast copy |
| Technical Silver | `#94A3B8` | `--muted-foreground` | Secondary copy & descriptions |
| Telemetry Slate | `#64748B` | `--telemetry` | Coordinates, timestamps, index rails |
| Structural Hairline | `rgba(255,255,255,0.08)` | `--line` | Exposed architectural 1px grid rules |
| Signal Border | `rgba(0,240,255,0.36)` | `--line-strong` | Active / focused frame borders |
| Primary Signal (Cyan) | `#00F0FF` | `--brand-cyan` | System active indicators, primary telemetry |
| Quant Alpha (Emerald) | `#10B981` | `--brand-lime` | Market positive signals, live uptime |
| Creative Pulse (Violet)| `#A855F7` | `--brand-violet` | AI Workflow, neural/creative engines |
| Heritage Gold (Amber) | `#F59E0B` | `--brand-amber` | Ziwei Astro, featured flagship callouts |
| Risk / Bull Alert | `#F43F5E` | `--brand-rose` | Destructive actions, A-share gains |

---

## 2. Typography & Hierarchy

- **Display / Headings:** Geometric & Architectural Sans (`var(--font-geist-sans)` + system tracking `-0.03em` to `-0.05em`)
- **Telemetry / Coordinates / Code:** Monospace (`var(--font-geist-mono)`, tabular numerals `tabular-nums`, uppercase `tracking-[0.18em]`–`tracking-[0.24em]`)
- **Scale & Rhythm:**
  - Hero Display: `clamp(2.5rem, 5.5vw, 5rem)` tight-leading (`0.95`)
  - Section Index Eyebrow: `10px`–`11px` mono `[ SEC_01 // TELEMETRY ]`
  - Card Technical Tag: `10px` mono uppercase crisp border badge

---

## 3. Structural Geometry & Grid Rules

1. **Crisp Architectural Frames (`.arch-frame`)**:
   - Prefer crisp architectural radii (`rounded-xl` / `rounded-lg` / `rounded-md`) with exposed `1px` structural borders over generic oversized bubbly pills.
   - Include a top **HUD Telemetry Rail** (`SYS // ID` + status indicator + right metadata) on major Bento cards and panels.
   - Include subtle corner crosshair markers (`+` or bracket corners) on blueprint containers.
2. **Exposed Hairline Grids**:
   - Use multi-column `border-white/[0.08]` grid dividers where sibling Bento cells share structural borders cleanly.
3. **Zero Legacy Light-Mode Bleed**:
   - All views, modals, drawers, workbenches (`/workflow`, `/chat`, `/experiments/ziwei`, `/experiments/image-studio`, `/experiments/pelican`), and article reading layouts (`/build-log/*`, `/news/*`, `/about`, `/stack`, `/privacy`) MUST use obsidian dark surfaces (`#04060B`, `#080C16`, `#0C1222`) with `>= 4.5:1` contrast text.

---

## 4. Anti-Patterns (Strictly Forbidden)

- ❌ **Legacy Light Bleed**: Never use `bg-white` (opaque), `bg-slate-50`, `text-slate-900`, or `border-slate-200` on cards/surfaces.
- ❌ **Same-Layout Color Swaps**: Never merely recolor a generic vertical box list; use asymmetric Bento spans, split technical index headers, and dual-pane IDE/terminal compositions.
- ❌ **Emojis as UI Chrome**: Use Lucide SVG icons and monospace coordinate tags (`[01]`, `SYS //`) instead of decorative emojis.
- ❌ **React 19 / ESLint Violations**: Never call `setState` synchronously in `useEffect`; never name a variable `module`.

---

## 5. Pre-Delivery Verification Checklist

- [ ] All subpages & workbenches follow obsidian dark tokens (zero accidental light surfaces)
- [ ] All interactive elements have `cursor-pointer` and visible focus/hover states
- [ ] `prefers-reduced-motion` respected across GSAP and Motion animations
- [ ] `npm run build` passes cleanly
- [ ] `npm run typecheck` passes with 0 errors
- [ ] `npm test` passes 100%
- [ ] `npm run lint` passes with 0 errors
