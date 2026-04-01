# PerksAI UI Design System

## 1) Core Principles
- Use **shadcn/ui** components as the default building blocks.
- Keep styling token-driven (Tailwind + CSS variables from theme).
- Prefer consistency over custom one-off styles.

---

## 2) Component Library Policy (Required)
Use these shadcn/ui components first:
- Layout: `Card`, `Separator`, `Sheet`, `Tabs`, `ScrollArea`
- Forms: `Form`, `Input`, `Label`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`
- Actions: `Button`, `DropdownMenu`, `Dialog`, `Popover`, `Tooltip`
- Feedback: `Toast`, `Alert`, `Badge`, `Skeleton`
- Data: `Table`, `Avatar`, `Pagination`

Rule:
- Do not build custom versions of existing shadcn components unless product-approved.

---

## 3) Color Schema
Use semantic tokens (not raw colors in components):
- `background`, `foreground`
- `muted`, `muted-foreground`
- `card`, `card-foreground`
- `primary`, `primary-foreground`
- `secondary`, `secondary-foreground`
- `accent`, `accent-foreground`
- `destructive`, `destructive-foreground`
- `border`, `input`, `ring`

Usage:
- Page background: `bg-background text-foreground`
- Secondary surfaces: `bg-muted/20`
- Cards: `bg-card text-card-foreground border-border`
- Interactive focus: `focus-visible:ring-ring`

---

## 4) Typography
- Font: project default sans-serif.
- Headings:
  - H1: `text-3xl md:text-4xl font-semibold tracking-tight`
  - H2: `text-2xl font-semibold tracking-tight`
  - H3: `text-xl font-medium`
- Body:
  - Default: `text-sm md:text-base`
  - Secondary: `text-muted-foreground`

---

## 5) Spacing & Layout
- Base spacing scale: Tailwind default (`2, 3, 4, 6, 8, 10, 12`).
- Section gaps: `space-y-6` (default), `space-y-8` (major sections).
- App shell:
  - Sidebar width: `w-64`
  - Header height: `h-14` to `h-16`
- Containers:
  - Content max width: `max-w-7xl`
  - Auth/card forms: `max-w-md`
  - Standard horizontal padding: `px-4 sm:px-6 lg:px-8`

---

## 6) Card Design Standard
Default card style:
- `rounded-none border border-border/60 bg-background/95 shadow-none`
- Header spacing: `space-y-2`
- Body spacing: `space-y-4` to `space-y-6`

Feature/stat cards:
- `border border-border bg-card`
- Use subtle hover only when clickable: `hover:bg-muted/30 transition-colors`

---

## 7) Button Design Standard
Use `Button` from shadcn/ui only.

Variants:
- Primary action: `default`
- Secondary action: `secondary`
- Destructive action: `destructive`
- Low-emphasis action: `ghost` or `outline`
- Link-like action: `link`

Sizes:
- `sm`: compact table/tool actions
- `default`: standard form/action buttons
- `lg`: hero or high-priority CTAs
- Full-width form submit: `className="w-full"`

Shape:
- Keep consistent with current app style (`rounded-none`) unless a global update is approved.

---

## 8) Form Patterns
- Use `Label` above each input.
- Vertical rhythm: `space-y-2` per field, `space-y-4` for form sections.
- Validation:
  - Error text: `text-sm text-destructive`
  - Success text: `text-sm text-emerald-600 dark:text-emerald-400`
- Disable inputs/buttons during submit.

---

## 9) States & Accessibility
- Provide visible focus states on all interactive elements.
- Color contrast must remain accessible in light/dark themes.
- Loading states:
  - Buttons show progress text (e.g., “Signing in...”).
  - Use `Skeleton` for async content blocks.
- Empty states:
  - Title + short description + primary CTA.

---

## 10) Dashboard/Page Composition Template
- Page wrapper: `bg-background text-foreground`
- Header: title + right-side actions
- Content sections:
  1. KPI/stat cards row
  2. Main content card/table
  3. Secondary details panel (optional)

---

## 11) Do / Don’t
Do:
- Reuse shadcn components and shared class patterns.
- Keep card/button sizing consistent page-to-page.
- Use semantic tokens and dark mode-safe styles.

Don’t:
- Hardcode random hex colors in components.
- Mix multiple border-radius systems in same flow.
- Introduce custom button/card components without design review.

---

## 12) Dashboard Color Schema Analysis (Applied)
Current dashboard implementation should use semantic tokens as follows:

- App shell: `bg-background text-foreground` (replace raw gray page backgrounds)
- Sidebar/header surfaces: `bg-card text-card-foreground border-border`
- Navigation hover/selection:
  - Hover: `hover:bg-muted/30`
  - Active: `bg-muted/20 text-foreground`
- Main content cards:
  - Standard: `rounded-none border border-border/60 bg-background/95`
  - Feature/stat: `border border-border bg-card`
- Supporting text: `text-muted-foreground`
- Focus/accessibility: `focus-visible:ring-ring` on interactive controls
