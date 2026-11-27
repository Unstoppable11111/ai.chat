# Design System Master File — Chen Tech Studio (v4.0)

> **ARCHITECTURAL PARADIGM:** **Botanical Slate & Mineral Studio (v4.0)**
> Elevated editorial Bento & B2B financial intelligence visual system built from the 19-color curated reference palette + `ui-ux-pro-max` ergonomics:
> - **Organic Light Ground (`#F8F8F4`)**: Warm ice-white canvas with soft botanical mist (`#E0E7D9`), cool tech mist (`#F2F7F9`), and warm ivory (`#FFFFF2`) ambient fields plus crisp `#C8C8C8` dot-matrix texture.
> - **Modular Bento Differentiation**: Crisp `#FFFFFF` elevated cards (`border-[#E4E4E8]`) paired with 3 subtle recessed surface washes (`#E0E7D9/65` Botanical Mist, `#F2F7F9` Cool Tech Mist, `#FFFFF2` Warm Ivory) so modules feel naturally distinct without neon clutter.
> - **Mineral Pine Anchors (`#042328`) & Precision Accents (`#E1F209` / `#33DD18`)**: Deep mineral pine `#042328` anchors brand emblems, primary CTAs, dark showcase terminals, and active tabs. High-energy acid lime `#E1F209` is STRICTLY restricted to dark `#042328` / `#0F0F0F` surfaces (14.2:1 AAA contrast), never as text on light backgrounds.
> - **A-Share Quantitative Clarity**: Strict `#D71018` (Bull/Up/Buy Signal) and `#184120` (Bear/Down/Defense) with tabular numeric typography (`font-mono tabular-nums`) and zero 120fps scroll/mousemove re-render penalties.

---

**Project:** Chen Tech Studio
**Version:** v4.0 (Botanical Slate & Mineral Edition)
**Domain:** Full-Stack AI Engineering · RAG Knowledge Engine · A-Share Quant Research Arena · WebGL Labs · Industrial Storyboard Workflow

---

## 1. Curated 19-Color Reference Token Architecture

| Family | Role | Hex / Value | CSS Token | Usage |
|---|---|---|---|---|
| **Neutral Light (75%)** | Ice-White Canvas | `#F8F8F4` | `--background` | Main warm-cool balanced ground |
| | Cool Tech Mist | `#F2F7F9` | `--background-muted` | Engineering/RAG pills & recessed wells |
| | Botanical Mist | `#E0E7D9` | `--surface-mist` | Quant discipline badges & botanical highlights |
| | Warm Ivory | `#FFFFF2` | `--surface-warm` | Editorial & Ziwei cultural warmth |
| | Elevated Card | `#FFFFFF` | `--panel` | Primary cards, sticky header, modals |
| | Hairlines & Silver | `#E4E4E8` / `#E0E0E0` / `#D8D8E4` / `#C8C8C8` | `--line` / `--line-strong` | 1px architectural rules, dot-matrix & subtle dividers |
| **Deep Anchors (18%)** | Mineral Pine | `#042328` | `--brand-pine` | Primary CTAs, dark terminals, logo emblem, active tabs |
| | Forest Green | `#184120` | `--brand-cyan` | Brand ink on light surfaces (9.8:1), A-share defense/down |
| | Deep Blue Slate | `#263844` | `--brand-violet` | Engineering secondary ink (11.2:1), chart baselines |
| | Charcoal & Graphite | `#0F0F0F` / `#282828` | `--foreground` | Display headlines & readable body copy |
| **Precision Accents (7%)** | Acid Volt | `#E1F209` | `--brand-volt` | ONLY on dark `#042328` / `#0F0F0F` backgrounds (emblems, CTAs inside dark bars) |
| | Bright Signal Green | `#33DD18` | `--brand-lime` | Live 6–8px status dots, progress beam tips, dark-mode highlights |
| | Alert Crimson | `#D71018` | `--brand-alert` | A-share Up / Buy Signal / Stop-loss action alerts |

---

## 2. Contrast & Accessibility Invariants

1. **Zero Light-on-Light Contrast Failures**: NEVER place `#E1F209` or `#33DD18` text on white/light backgrounds (`#FFFFFF`, `#F8F8F4`, `#F2F7F9`, `#E0E7D9`). Always pair `#184120` or `#263844` on light backgrounds, and reserve `#E1F209` strictly for dark `#042328` / `#0F0F0F` containers.
2. **Zero Scroll Blur**: Never animate `filter: blur(...)` inside Framer Motion `Reveal` or GSAP `ScrollTrigger` blocks. Use `opacity` + `translate3d` only.
3. **Zero Mousemove React Re-renders**: Interactive spotlight and magnetic hover wrappers (`SpotlightCard`, `MagneticButton`) must update DOM styles directly via `useRef` + `requestAnimationFrame`.
4. **Aligned Bottom-Right Action Dock**: `BackToTop` and `ChatWidget` maintain symmetrical bottom-right spacing (`bottom-5 sm:bottom-6`, `right-4 sm:right-6` & `right-[5.5rem] sm:right-[6.5rem]`).
5. **Repository CI Gate**: Every change must pass `npm run build`, `npm run typecheck`, `npm test`, and `npm run lint` with zero errors.
