# Design System & UI Guidelines

## Design Tokens

### Color Palette

```css
/* Brand Colors */
--primary: #6366f1        /* Indigo 500 */
--primary-hover: #4f46e5  /* Indigo 600 */
--primary-glow: #818cf8   /* Indigo 400 with opacity */
--primary-foreground: #ffffff

/* Semantic Colors */
--success: #10b981        /* Green */
--warning: #f59e0b        /* Amber */
--danger: #ef4444         /* Red */

/* Background & Surfaces */
--background: #ffffff     /* Light: white; Dark: #09090B */
--foreground: #000000     /* Light: black; Dark: #fafafa */
--card: #f3f4f6           /* Light: gray-100; Dark: #1a1a1a */
--card-hover: #e5e7eb     /* Light: gray-200; Dark: #2a2a2a */
--surface: #f9fafb        /* Light: gray-50; Dark: #0f0f0f */
--sidebar: #ffffff        /* Light: white; Dark: #1a1a1a */

/* Text Colors */
--text-primary: #000000   /* Light: black; Dark: #fafafa */
--text-secondary: #6b7280 /* Light: gray-500; Dark: #d1d5db */
--text-muted: #9ca3af     /* Light: gray-400; Dark: #6b7280 */

/* Borders & Inputs */
--border: #e5e7eb         /* Light: gray-200; Dark: #333333 */
--border-hover: #d1d5db   /* Light: gray-300; Dark: #444444 */
--input: #ffffff          /* Light: white; Dark: #1a1a1a */
--ring: #6366f1           /* Focus ring: primary indigo */
--radius: 0.5rem          /* 8px default border radius */
```

### Typography

| Role | Font | Size | Weight | Line Height |
|------|------|------|--------|-------------|
| Display | Outfit | 32–48px | 700–800 | 1.2 |
| Heading H1 | Outfit | 28–32px | 700 | 1.3 |
| Heading H2 | Outfit | 24–28px | 700 | 1.35 |
| Body | Geist | 14–16px | 400–500 | 1.5–1.6 |
| Small | Geist | 12–13px | 400 | 1.4 |
| Code | JetBrains Mono | 13–14px | 400–600 | 1.5 |

### Spacing Scale

Tailwind default: `4px` base unit
- `p-2` = 8px (xs)
- `p-3` = 12px (sm)
- `p-4` = 16px (md)
- `p-5` = 20px (lg)
- `p-6` = 24px (xl)
- `p-8` = 32px (2xl)
- `p-12` = 48px (3xl)

### Shadow & Elevation

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1)
```

---

## Component Library & Conventions

### Button Component
```tsx
// Primary action (solid indigo background)
<Button variant="default" size="md" onClick={handleClick}>
  Send Message
</Button>

// Secondary action (ghost/outline)
<Button variant="outline" size="md">
  Cancel
</Button>

// Danger action
<Button variant="destructive" size="md">
  Delete
</Button>

// Loading state
<Button disabled={isLoading}>
  {isLoading && <Loader className="mr-2 animate-spin" />}
  Processing...
</Button>
```

### Input & Form Fields
```tsx
// Text input with label
<div className="space-y-2">
  <Label htmlFor="query">Search term</Label>
  <input
    id="query"
    type="text"
    className="w-full px-4 py-3 border border-input rounded-md focus:ring-2 focus:ring-primary"
    placeholder="Enter search..."
  />
</div>

// Select dropdown
<Select value={model} onValueChange={setModel}>
  <SelectTrigger>
    <SelectValue placeholder="Choose model..." />
  </SelectTrigger>
  <SelectContent>
    {models.map(m => (
      <SelectItem key={m.id} value={m.id}>
        {m.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Chat Message Bubble
```tsx
// User message (right-aligned, blue background)
<div className="flex justify-end gap-3">
  <div className="max-w-xs px-5 py-4 bg-primary text-primary-foreground rounded-lg break-words">
    {userMessage}
  </div>
</div>

// Assistant message (left-aligned, light gray background)
<div className="flex gap-3">
  <img src={avatar} alt="Assistant" className="w-8 h-8 rounded-full" />
  <div className="max-w-2xl px-5 py-4 bg-card rounded-lg">
    <Markdown content={assistantMessage} />
  </div>
</div>
```

### Card Container
```tsx
<div className="p-5 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow">
  <h3 className="text-sm font-semibold text-primary mb-2">Quick Action</h3>
  <p className="text-xs text-text-muted">Description text</p>
</div>
```

---

## Layout Guidelines

### Page Structure
```
┌─────────────────────────────────────────────────┐
│ Header / Navigation                             │
├──────────────┬──────────────────────────────────┤
│              │                                  │
│ Sidebar      │ Main Content Area                │
│ (optional)   │ - Padding: p-4 sm:p-6            │
│              │ - Max width: container (1280px)  │
│              │ - Responsive gap management      │
│              │                                  │
└──────────────┴──────────────────────────────────┘
```

### Responsive Breakpoints
- **Mobile** (`<640px`): Single column, full width, `p-3 sm:p-4`
- **Tablet** (`640px–1024px`): Two columns, `gap-3 sm:gap-4`
- **Desktop** (`>1024px`): Multi-column grid, `gap-4 md:gap-6`

### Chat Area Spacing (Recently Refined)
```tsx
// Top bar (message counter, mode selector)
<div className="flex items-center justify-between py-4 sm:py-5 px-4 gap-3 sm:gap-4 border-b border-border">
  {/* controls */}
</div>

// Welcome section (when no messages)
<div className="py-12 sm:py-16 px-4 text-center space-y-4">
  <h1 className="text-3xl font-bold">Welcome to e-Mate AI</h1>
  <p className="text-text-secondary">Your AI Study Copilot</p>
</div>

// Quick action cards
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 p-4 sm:p-6">
  {/* cards with p-5, icon w-10, gap-4 */}
</div>

// Messages container
<div className="space-y-4 px-4 py-3">
  {/* chat bubbles */}
</div>

// Input area
<div className="flex items-end gap-4 px-5 py-4 border-t border-border bg-card">
  {/* textarea, buttons */}
</div>
```

---

## Dark Mode

Tailwind `darkMode: 'class'` enabled. Use `dark:` prefix for dark-specific styles:

```tsx
<div className="bg-white dark:bg-slate-900 text-black dark:text-white">
  Light mode: white background
  Dark mode: slate-900 background
</div>
```

All colors automatically adapt via CSS custom properties in `--background`, `--foreground`, etc.

---

## Animations & Transitions

### Framer Motion (for interactive elements)
```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Animated content
</motion.div>
```

### Tailwind Animations
```tsx
// Spin animation (loading)
<Loader className="animate-spin" />

// Fade in
<div className="animate-in fade-in duration-300" />
```

---

## Accessibility (a11y)

- **ARIA Labels**: All interactive elements have `aria-label` or `aria-describedby`
- **Keyboard Navigation**: Tab order follows visual flow, focus ring always visible
- **Color Contrast**: All text meets WCAG AA (4.5:1 for normal text)
- **Skip Links**: "Skip to main content" link on every page
- **Semantic HTML**: Use `<button>`, `<nav>`, `<main>`, `<section>` appropriately
- **Form Validation**: Clear error messages, `aria-invalid` on invalid fields

---

## Icon Library

- **Lucide React**: Primary icon set (20+ icons for navigation, actions)
- **Heroicons**: Fallback for additional icons
- **Size Convention**: `w-4 h-4` (16px) for inline, `w-6 h-6` (24px) for buttons, `w-10 h-10` (40px) for large

