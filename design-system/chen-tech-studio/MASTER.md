# Design System Master File — Chen Tech Studio (v3.0)

> **ARCHITECTURAL PARADIGM:** **Luminous Editorial & Frosted Pearl Studio (v3.0)**
> Refined Apple / Linear-inspired light-first studio architecture featuring:
> - **Pearl-Alabaster Canvas (`#F4F7FB`)**: Airy light ground with zero-repaint static GPU radial light pools and architectural dot-matrix texture.
> - **Specular Frosted Cards (`#FFFFFF`)**: High-opacity pearl surfaces with `inset 0 1px 0 rgba(255,255,255,0.98)` top specular highlights and layered slate shadows — preserving 120fps scroll performance without expensive per-card `backdrop-filter`.
> - **Precision Selective Contrast**: Intentional deep-slate spotlight cards (e.g., `FeaturedExperiments`, flagship Bento tiles) and warm Oriental parchment (`#FDFBF7`) for `Ziwei Doushu`.
> - **120fps GPU Motion Architecture**: Pure `opacity` + `translate3d` animations (`filter: blur(...)` forbidden on scroll), `requestAnimationFrame` DOM-ref mouse spotlights (zero React re-renders), and native OS hardware pointer latency.

---

**Project:** Chen Tech Studio
**Version:** v3.0 (Luminous Pearl Edition)
**Domain:** Full-Stack AI Engineering · RAG Knowledge Engine · A-Share Quant Research Arena · WebGL Labs · Industrial Storyboard Workflow

---

## 1. Color & Surface Tokens

| Role | Hex / Value | CSS Token | Usage |
|------|-------------|-----------|-------|
| Primary Pearl Canvas | `#f4f7fb` | `--background` | Main luminous light ground |
| Subtle Surface | `#edf2f9` | `--background-muted` | Recessed wells & code strips |
| Elevated Card Surface | `rgba(255, 255, 255, 0.94)` | `--panel` | Frosted pearl cards (GPU-friendly) |
| Floating Chrome | `rgba(255, 255, 255, 0.88)` | `.glass-chrome` | Sticky header, dialogs, BackToTop (`backdrop-blur-md`) |
| Primary Ink | `#0f172a` | `--foreground` | Headlines & high-contrast body text |
| Secondary Ink | `#475569` | `--muted-foreground` | Descriptions & metadata |
| Crisp Border | `rgba(15, 23, 42, 0.08)` | `--line` | Card outlines & structural hairlines |
| Sky-Cyan Accent | `#0ea5e9` | `--brand-cyan` | Primary links, RAG & telemetry highlights |
| Royal-Violet Accent | `#8b5cf6` | `--brand-violet` | AI Workflow, gesture & creative engines |
| Emerald Accent | `#10b981` | `--brand-lime` | Live online status & quant alpha signals |

---

## 2. Performance & Layout Invariants

1. **Zero Scroll Blur**: Never animate `filter: blur(...)` inside Framer Motion `Reveal` or GSAP `ScrollTrigger` blocks. Use `opacity` + `translate3d` only.
2. **Zero Mousemove React Re-renders**: Interactive spotlight and magnetic hover wrappers (`SpotlightCard`, `MagneticButton`) must update DOM styles directly via `useRef` + `requestAnimationFrame`, never `useState`.
3. **Aligned Bottom-Right Action Dock**: `BackToTop` and `ChatWidget` share identical dimensions (`h-12 w-12 sm:h-13 sm:w-13`), identical `rounded-full` geometry, and identical right anchor (`right-4 sm:right-6`), stacked at `bottom-5 sm:bottom-6` (`ChatWidget`) and `bottom-20 sm:bottom-22` (`BackToTop`).
4. **Repository CI Gate**: Every change must pass `npm run build`, `npm run typecheck`, `npm test`, and `npm run lint` with zero errors.
