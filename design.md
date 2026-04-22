# Punch Studio Design System

## 🎨 Overview
Punch Studio (PunchAI) follows an **Industrial-Grade**, **Premium**, and **Minimalist** design philosophy. The interface is optimized for high-performance AI management with a focus on clarity, speed, and professional aesthetics.

---

## 🌓 Theme & Colors
The application uses **OKLCH** color values for better perceptual uniformity and modern browser support. The default theme is **Dark Mode**.

### Core Colors (Dark Theme)
| Token | OKLCH Value | Description |
| :--- | :--- | :--- |
| **Background** | `oklch(0.141 0.005 285.823)` | Deep charcoal surface |
| **Foreground** | `oklch(0.985 0 0)` | High-contrast white text |
| **Primary** | `oklch(0.92 0.004 286.32)` | Clean light grey for primary actions |
| **Secondary** | `oklch(0.274 0.006 286.033)` | Subtle grey for secondary surfaces |
| **Muted** | `oklch(0.274 0.006 286.033)` | Dimmed foreground elements |
| **Accent** | `oklch(0.274 0.006 286.033)` | Interactive highlights |
| **Destructive** | `oklch(0.704 0.191 22.216)` | Industrial red for danger actions |
| **Border** | `oklch(1 0 0 / 10%)` | Semi-transparent delicate borders |

### Functional Extensions
- **Dot Pattern:** `.bg-dot-pattern` provides a subtle radial background for cards and hero sections.
- **Glassmorphism:** Used sparingly on sidebars and floating elements with `bg-input/30` and `backdrop-blur`.

---

## 🔡 Typography
Punch Studio utilizes a dual-font system for modern readability and technical precision.

- **Sans-Serif:** [Inter](https://fonts.google.com/specimen/Inter) & [Geist Sans](https://vercel.com/font/sans)
  - *Usage:* General UI, headings, body text.
- **Monospace:** [Geist Mono](https://vercel.com/font/mono)
  - *Usage:* Code blocks, technical logs, ID displays.

---

## 🧱 Key Component Design

### 🔘 Buttons
- **Rounding:** `rounded-md` (0.45rem base radius).
- **Interactive State:** `transition-all`, subtle `translate-y-px` on click.
- **Variants:**
  - `default`: Solid primary background.
  - `outline`: 1px border with background-aware hover.
  - `destructive`: Low-opacity red background with high-contrast red text.
  - `ghost`: Transparent background, highlights on hover.

### 🗂️ Cards
- **Rounding:** `rounded-xl` for container-level separation.
- **Structure:** `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, and `CardFooter`.
- **Aesthetic:** Minimalist `ring-1` border instead of heavy shadows.

### 📊 Data Displays (Tables)
- **Aesthetic:** Minimalist borders (`border-b`) with no vertical grid lines.
- **Interactivity:** Subtle row hover effects (`bg-muted/50`).
- **Typography:** Medium weights for headers, standard size for cell content to maintain high information density.

### 💬 Chat Interface (Playground)
- **Bubbles:** Industrial grey backgrounds for AI responses, solid foreground-influenced backgrounds for user messages.
- **Animation:** Smooth transitions for message rendering and auto-scroll.
- **States:** Loading skeletons and typing indicators follow the muted color scheme.

### 📂 Sidebar
- **Industrial Layout:** Focused on workspace efficiency.
- **Collapsible:** Supports `icon` mode for maximized screen real estate.
- **Visuals:** High-contrast `Punch Studio` branding and user profile integration.

---

## 🧬 Geometry & Spacing
- **Base Radius:** `0.45rem` (`--radius`).
- **Scale:**
  - `sm`: 0.6x base
  - `md`: 0.8x base
  - `lg`: 1.0x base
  - `xl`: 1.4x base
  - `2xl`: 1.8x base

---

## 🛠️ Design Tokens (CSS Variables)
Refer to `ui/app/globals.css` for the complete list of system tokens. All components should consume these tokens to ensure theme consistency.

```css
--background: oklch(0.141 0.005 285.823);
--foreground: oklch(0.985 0 0);
--primary: oklch(0.92 0.004 286.32);
--border: oklch(1 0 0 / 10%);
--radius: 0.45rem;
```
