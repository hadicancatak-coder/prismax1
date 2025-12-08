# Prisma Design System - Token Reference

This document defines all semantic tokens used across the Prisma application. **All colors must use these tokens - never use raw Tailwind colors like `text-white`, `bg-red-500`, etc.**

## Color Tokens

### Core Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `bg-background` | `#f2f2f7` | `#171822` | Page background |
| `bg-foreground` | `#171717` | `#f9fafb` | Primary text |
| `bg-card` | `#ffffff` | `#1f2028` | Card/panel surfaces |
| `bg-card-hover` | `#f7f7fa` | `#252630` | Card hover state |
| `bg-muted` | `#f2f2f7` | `#262730` | Muted backgrounds |
| `text-muted-foreground` | `#6e6e73` | `#a0a3ad` | Secondary text |

### Primary Colors

| Token | Usage |
|-------|-------|
| `bg-primary` | Primary actions, buttons |
| `text-primary` | Primary text/icons |
| `bg-primary-hover` | Primary button hover |
| `text-primary-foreground` | Text on primary backgrounds |

### Status Colors

These tokens provide consistent status indication across light and dark themes:

| Status | Background | Text | Border | Utility Class |
|--------|------------|------|--------|---------------|
| Success | `bg-success-soft` | `text-success-text` | `border-success/30` | `.status-success` |
| Warning | `bg-warning-soft` | `text-warning-text` | `border-warning/30` | `.status-warning` |
| Destructive | `bg-destructive-soft` | `text-destructive-text` | `border-destructive/30` | `.status-destructive` |
| Info | `bg-info-soft` | `text-info-text` | `border-info/30` | `.status-info` |
| Pending | `bg-pending-soft` | `text-pending-text` | `border-pending/30` | `.status-pending` |
| Neutral | `bg-neutral-soft` | `text-neutral-text` | `border-border` | `.status-neutral` |

**Example usage:**
```tsx
// ✅ CORRECT - Using utility class
<Badge className="status-success">Active</Badge>

// ✅ CORRECT - Using individual tokens
<div className="bg-success-soft text-success-text border border-success/30">
  Status message
</div>

// ❌ WRONG - Using raw colors
<Badge className="bg-green-100 text-green-800">Active</Badge>
```

### Icon Colors

| Context | Color Token |
|---------|-------------|
| Default icons | `text-muted-foreground` |
| Primary icons | `text-primary` |
| Success indicators | `text-success` |
| Warning indicators | `text-warning` |
| Error indicators | `text-destructive` |

## Z-Index Scale

Use semantic z-index tokens instead of arbitrary values:

| Token | Value | Usage |
|-------|-------|-------|
| `z-dropdown` | 50 | Dropdown menus |
| `z-sticky` | 100 | Sticky headers |
| `z-modal` | 200 | Modal overlays |
| `z-popover` | 300 | Popovers |
| `z-tooltip` | 400 | Tooltips |
| `z-toast` | 500 | Toast notifications |
| `z-overlay` | 9999 | Critical overlays (dialogs) |

**Example usage:**
```tsx
// ✅ CORRECT
<div className="z-modal">...</div>
<div className="z-overlay">...</div>

// ❌ WRONG
<div className="z-[9999]">...</div>
<div className="z-50">...</div>
```

## Typography Scale

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `.text-page-title` | 32px | 700 | Main page headings |
| `.text-section-title` | 20px | 600 | Section headings |
| `.text-heading-lg` | 24px | 600 | Large headings |
| `.text-heading-md` | 20px | 600 | Medium headings |
| `.text-body` | 14px | 400 | Body text |
| `.text-body-sm` | 14px | 400 | Small body text |
| `.text-metadata` | 12px | 400 | Timestamps, labels |

## Spacing Scale

| Token | Size |
|-------|------|
| `space-xs` | 8px |
| `space-sm` | 12px |
| `space-md` | 16px |
| `space-lg` | 24px |
| `space-xl` | 32px |
| `space-2xl` | 48px |

## Border Radius

| Token | Size |
|-------|------|
| `rounded-sm` | 6px |
| `rounded` / `rounded-md` | 8px |
| `rounded-lg` | 12px |
| `rounded-xl` | 16px |
| `rounded-full` | Full circle/pill |

## Transition Utilities

| Class | Duration | Usage |
|-------|----------|-------|
| `.transition-smooth` | 150ms | Standard interactions |
| `.hover-lift` | 200ms | Card hover effects |
| `.hover-scale` | 200ms | Scale on hover |
| `.hover-glow` | 200ms | Glow effects |

## Component Patterns

### Status Badges

```tsx
// Use the status utility classes
<Badge className="status-success">Active</Badge>
<Badge className="status-warning">Pending</Badge>
<Badge className="status-destructive">Error</Badge>
<Badge className="status-info">Info</Badge>
<Badge className="status-neutral">Draft</Badge>
```

### Cards

```tsx
<Card className="bg-card hover:bg-card-hover border-border transition-smooth">
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
</Card>
```

### Elevated Surfaces

```tsx
<div className="surface-elevated">
  Content with subtle shadow
</div>
```

## Exceptions

### Device Simulations
Files that simulate device screens (e.g., `SnapPreview.tsx`) may use raw colors to accurately represent the device interface. Document these exceptions in component comments.

### Third-Party Integrations
Components wrapping third-party libraries may require specific color overrides. Document these in component comments.

## Migration Checklist

When refactoring components:

1. ☐ Replace all `text-white`, `text-black` with `text-foreground` or semantic variants
2. ☐ Replace all `bg-white`, `bg-black` with `bg-background`, `bg-card`
3. ☐ Replace all `bg-[color]-100 text-[color]-800` with `.status-*` utilities
4. ☐ Replace all `z-[number]` with semantic z-index tokens
5. ☐ Verify component works in both light and dark themes
6. ☐ Test hover, focus, and active states
