# UI Performance Audit & Optimization Plan

## 1. Analysis Findings

### A. Dependency & Bundle Bloat
- **Total Build Size:** `.next` folder is **514MB**.
- **Heavy Unused Libraries:** 
    - `@hugeicons`: 59MB (Used only in Login/Register)
    - `lucide-react`: 39MB (Entire library likely being bundled)
    - `@xyflow/react`: 4.4MB (Installed but 0 usage)
    - `recharts`: 8.7MB (Installed but 0 usage)
- **Shadcn Bloat:** 55 components installed, many unused (Calendar, Carousel, Chart, etc.) carrying heavy dependencies.

### B. Execution Bottlenecks
- **Blocking Auth:** `DashboardLayout` returns `null` during auth check, causing 1-2s of total blank screen.
- **Redundant Data Fetching:** Multiple `useEffect` hooks across different components fetch the same `profile` and `bots` data simultaneously.
- **Missing Caching:** No SWR or TanStack Query usage; every navigation triggers fresh waterfall requests.

### C. Design & Asset Issues
- **Logo Asset:** `Logo_dark_theme.png` is 154KB. Could be optimized or converted to SVG/WebP.
- **Animation Overkill:** Simultaneous usage of `gsap` and `framer-motion` for simple UI tasks.

## 2. Optimization Roadmap

### Phase 1: Bundle Cleanup (Highest Impact)
- [ ] Uninstall `@xyflow/react`, `recharts`, `@dnd-kit`, `embla-carousel-react`.
- [ ] Implement `lucide-react` tree-shaking or dynamic icons.
- [ ] Remove unused Shadcn components and their CSS.

### Phase 2: Architectural Fixes
- [ ] **Auth Refactor:** Render `Sidebar` + `Skeleton` while `ensureSession` runs, instead of returning `null`.
- [ ] **Caching Layer:** Introduce `SWR` for `getProfile` and `getBots` to prevent redundant network calls.
- [ ] **Code Splitting:** Use `next/dynamic` for `ConversationDrawer` and `SourceDetailsDialog`.

### Phase 3: Asset & Logic Tuning
- [ ] Convert `Logo_dark_theme.png` to optimized WebP.
- [ ] Replace `gsap` in `TextType.tsx` with CSS animations or lightweight `framer-motion`.
- [ ] Move server-side data fetching to Next.js Server Components where possible.
