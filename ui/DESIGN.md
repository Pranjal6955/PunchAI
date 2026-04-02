# PunchAI — Design System UI Guide

## Purpose
This document defines the shared visual language for PunchAI using standard **shadcn/ui** components. We prioritize the out-of-the-box experience to ensure speed, consistency, and a professional look without unnecessary customization.

## Design Principles
- **shadcn/ui Defaults**: Use components exactly as they are provided.
- **Copy-Paste Pattern**: Follow the established patterns found in the shadcn/ui documentation.
- **Minimalist Aesthetics**: Clean, high-contrast, and focused.
- **Accessible by Design**: Rely on Radix UI primitives for full accessibility.

## Color Usage
We use the standard shadcn/ui theme tokens as defined in `globals.css`. Do not use hardcoded hex values or custom colors.

### Theme Tokens
- `background` / `foreground` — Main surfaces and primary text.
- `muted` / `muted-foreground` — Secondary background and helper text.
- `primary` / `primary-foreground` — Main actions.
- `secondary` / `secondary-foreground` — Supportive actions.
- `accent` / `accent-foreground` — Hover states and highlighting.
- `border` — All outlines and separators.
- `card` / `popover` — Floating surfaces.
- `destructive` — Danger zones and errors.

## Typography
Use the default sans-serif font family configured in the project (Geist).
- **Page Titles**: `text-2xl font-bold tracking-tight` or `text-3xl font-extrabold`.
- **Card Titles**: `text-xl font-semibold`.
- **Body Text**: `text-sm` (standard UI size).
- **Labels**: `text-sm font-medium leading-none` (Label component default).
- **Supporting Text**: `text-xs text-muted-foreground`.

## Layout Patterns
- **Page Container**: Use a standard flex or grid container with `px-4 md:px-6` and `py-8`.
- **Grid Layouts**: Use `grid` with `gap-4` or `gap-6` for dashboards and card lists.
- **Vertical Spacing**: Use `flex flex-col gap-4` or `space-y-4` for form fields and vertical content.

## Component Usage Guidelines

### Buttons
Use the standard variants without override:
- **Default Action**: `<Button variant="default">`
- **Supporting Action**: `<Button variant="outline">` or `<Button variant="secondary">`
- **Subtle/Nav Action**: `<Button variant="ghost">`
- **Dangerous Action**: `<Button variant="destructive">`

### Cards
The primary container for grouped content:
- `CardHeader`: Include `CardTitle` and `CardDescription`.
- `CardContent`: Main content area with standard padding.
- `CardFooter`: Standard alignment for primary/secondary actions.

### Forms
Always use the shadcn/ui Form component pattern:
- **Validation**: Use `zod` for schemas and `react-hook-form` for state management.
- **Structure**: Always wrap inputs in `FormItem`, `FormLabel`, `FormControl`, and `FormMessage`.
- **Placeholders**: Keep them realistic and helpful (e.g., `m@example.com`).

### Sidebar
- Use the official shadcn `<Sidebar>` structure.
- branding goes in `<SidebarHeader>`.
- Navigation items must use **Lucide icons** paired with labels.

### Header/Navbar
- Use a sticky header with `backdrop-blur`.
- Include `<SidebarTrigger>` for mobile navigation.
- Use `<Breadcrumb>` to provide clear location context.

## State Management UI
- **Hover**: shadcn default (`hover:bg-accent`).
- **Focus**: shadcn default (`ring-offset-background focus-visible:ring-2`).
- **Disabled**: shadcn default (`disabled:opacity-50 disabled:pointer-events-none`).

## Icons
- Use **Lucide React** icons.
- Default size for buttons/nav: `size-4` (16px).
- Default size for larger indicators: `size-6` (24px).

## Feedback Components
- **Loading**: Use the `<Skeleton>` component to prevent layout shift.
- **Messages**: Use the `<Toast>` (via `sonner`) for temporary feedback.
- **Empty States**: A simple card or centered layout with a placeholder icon and one primary action.

## Final Rule
When in doubt, refer to [ui.shadcn.com](https://ui.shadcn.com). If a component is missing, add it via the CLI and use it exactly as documented. We do not deviate from the shadcn/ui design language.
