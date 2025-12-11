# Prisma Style Guide

> **Single source of truth for all styling.** All new code MUST follow this guide.

---

## Quick Reference Card

### Typography (NEVER use raw text-xs, text-sm, etc.)

| Use This | Instead Of | Size |
|----------|------------|------|
| `text-metadata` | `text-xs`, `text-[12px]` | 12px |
| `text-body-sm` | `text-sm`, `text-[13px]`, `text-[14px]` | 14px |
| `text-body` | `text-base`, `text-[16px]` | 16px |
| `text-heading-sm` | `text-lg`, `text-[18px]` | 18px |
| `text-heading-md` | `text-xl`, `text-[20px]` | 20px |
| `text-heading-lg` | `text-2xl`, `text-[24px]` | 24px |
| `text-page-title` | `text-3xl`, `text-[30px]` | 30px |

### Spacing (NEVER use raw gap-2, p-4, etc.)

| Use This | Instead Of | Size |
|----------|------------|------|
| `gap-xs` / `p-xs` / `space-y-xs` | `gap-1`, `p-1`, `space-y-1` | 4px |
| `gap-sm` / `p-sm` / `space-y-sm` | `gap-2`, `gap-3`, `p-2`, `p-3`, `space-y-2`, `space-y-3` | 8px |
| `gap-md` / `p-md` / `space-y-md` | `gap-4`, `p-4`, `space-y-4` | 16px |
| `gap-lg` / `p-lg` / `space-y-lg` | `gap-6`, `p-6`, `space-y-6` | 24px |
| `gap-xl` / `p-xl` / `space-y-xl` | `gap-8`, `p-8`, `space-y-8` | 32px |
| `gap-2xl` / `p-2xl` / `space-y-2xl` | `gap-12`, `p-12`, `space-y-12` | 48px |
| `p-card` | Card internal padding | 24px |

### Margins

| Use This | Instead Of |
|----------|------------|
| `mt-section` / `mb-section` | `mt-8`, `mb-8` |
| `mt-card` / `mb-card` | `mt-6`, `mb-6` |
| `mt-sm` / `mb-sm` | `mt-2`, `mb-2`, `mt-3`, `mb-3` |
| `mt-md` / `mb-md` | `mt-4`, `mb-4` |
| `mt-lg` / `mb-lg` | `mt-6`, `mb-6` |

### Border Radius

| Use This | Instead Of | Size |
|----------|------------|------|
| `rounded-sm` | `rounded-[4px]`, `rounded-[6px]` | 6px |
| `rounded` or `rounded-md` | `rounded-[8px]` | 8px |
| `rounded-lg` | `rounded-[12px]` | 12px |
| `rounded-xl` | `rounded-[16px]` | 16px |
| `rounded-full` | Pills, avatars, circular buttons | 9999px |

---

## Core Rules

### ❌ NEVER Do This

```tsx
// Raw colors - BANNED
<div className="text-white bg-black">
<div className="text-gray-500 bg-gray-100">
<div className="bg-[#f5f5f5] text-[#333]">

// Raw typography - BANNED
<p className="text-sm">
<h3 className="text-lg font-semibold">
<span className="text-xs">

// Raw spacing - BANNED
<div className="gap-4 p-6">
<div className="space-y-4">
<div className="mt-8 mb-4">
```

### ✅ ALWAYS Do This

```tsx
// Semantic colors
<div className="text-foreground bg-background">
<div className="text-muted-foreground bg-muted">
<div className="bg-card text-card-foreground">

// Semantic typography
<p className="text-body-sm">
<h3 className="text-heading-sm font-semibold">
<span className="text-metadata">

// Semantic spacing
<div className="gap-md p-lg">
<div className="space-y-md">
<div className="mt-section mb-md">
```

---

## Color Tokens

### Background Colors

| Token | Usage |
|-------|-------|
| `bg-background` | Page background |
| `bg-card` | Cards, elevated surfaces |
| `bg-card-hover` | Card hover state |
| `bg-muted` | Muted sections, disabled states |
| `bg-elevated` | Elevated panels, popovers |
| `bg-subtle` | Subtle backgrounds, chips |
| `bg-input` | Form inputs |
| `bg-sidebar` | Sidebar background |

### Text Colors

| Token | Usage |
|-------|-------|
| `text-foreground` | Primary text |
| `text-muted-foreground` | Secondary/helper text |
| `text-subtle` | Tertiary text, low emphasis |
| `text-card-foreground` | Text on cards |
| `text-primary` | Primary action text |
| `text-primary-foreground` | Text on primary backgrounds |

### Border Colors

| Token | Usage |
|-------|-------|
| `border-border` | Standard borders |
| `border-subtle` | Light separators |
| `border-input` | Input borders |

### Status Colors

```tsx
// Success
<div className="bg-success/15 text-success border-success/30">

// Warning
<div className="bg-warning/15 text-warning border-warning/30">

// Destructive/Error
<div className="bg-destructive/15 text-destructive border-destructive/30">

// Info
<div className="bg-info/15 text-info border-info/30">

// Pending
<div className="bg-pending/15 text-pending border-pending/30">
```

### Priority Colors

```tsx
// High priority
<Badge className="bg-priority-high/15 text-priority-high">High</Badge>

// Medium priority
<Badge className="bg-priority-medium/15 text-priority-medium">Medium</Badge>

// Low priority
<Badge className="bg-priority-low/15 text-priority-low">Low</Badge>
```

---

## Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `z-dropdown` | 50 | Dropdowns, selects |
| `z-sticky` | 100 | Sticky headers |
| `z-modal` | 200 | Modals, dialogs |
| `z-popover` | 250 | Popovers, tooltips |
| `z-tooltip` | 300 | Tooltips |
| `z-toast` | 400 | Toast notifications |
| `z-overlay` | 500 | Full-screen overlays |

---

## Component Patterns

### Page Container

```tsx
<div className="max-w-[1400px] mx-auto px-lg">
  <PageHeader title="Page Title" />
  <div className="space-y-lg">
    {/* Page content */}
  </div>
</div>
```

### Card

```tsx
<Card className="p-card">
  <CardHeader className="p-0 mb-md">
    <CardTitle className="text-heading-sm font-semibold">Title</CardTitle>
    <CardDescription className="text-body-sm text-muted-foreground">
      Description text
    </CardDescription>
  </CardHeader>
  <CardContent className="p-0 space-y-md">
    {/* Content */}
  </CardContent>
</Card>
```

### Form

```tsx
<form className="space-y-md">
  <div className="space-y-sm">
    <Label className="text-body-sm font-medium">Field Label</Label>
    <Input placeholder="Enter value" />
    <p className="text-metadata text-muted-foreground">Helper text</p>
  </div>
</form>
```

### Table

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead className="text-metadata font-medium text-muted-foreground">
        Column Header
      </TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="hover:bg-card-hover">
      <TableCell className="text-body-sm">Cell content</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Dialog

```tsx
<Dialog>
  <DialogContent className="max-w-lg">
    <DialogHeader>
      <DialogTitle className="text-heading-md font-semibold">
        Dialog Title
      </DialogTitle>
      <DialogDescription className="text-body-sm text-muted-foreground">
        Description text
      </DialogDescription>
    </DialogHeader>
    <div className="py-md space-y-md">
      {/* Dialog content */}
    </div>
    <DialogFooter className="gap-sm">
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Filter Row

```tsx
<div className="flex items-center gap-md flex-wrap">
  <Input className="w-[250px]" placeholder="Search..." />
  <Select>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Filter by..." />
    </SelectTrigger>
  </Select>
  <Button variant="outline" size="sm">
    <Filter className="h-4 w-4 mr-sm" />
    Filters
  </Button>
</div>
```

### Status Badge

```tsx
// Use the appropriate status color
<Badge className="bg-success/15 text-success border-success/30">
  Completed
</Badge>

<Badge className="bg-warning/15 text-warning border-warning/30">
  Pending
</Badge>

<Badge className="bg-destructive/15 text-destructive border-destructive/30">
  Failed
</Badge>
```

### Button with Icon

```tsx
<Button className="gap-sm">
  <Plus className="h-4 w-4" />
  Add Item
</Button>

// Icon-only button
<Button size="icon" variant="ghost">
  <Settings className="h-4 w-4" />
</Button>
```

---

## Transitions & Animations

| Class | Usage |
|-------|-------|
| `transition-smooth` | Standard 150ms ease-in-out transition |
| `hover-lift` | Subtle translateY + shadow on hover |
| `hover-scale` | Slight scale up (max 1.02) |
| `hover-glow` | Soft focus glow for primary elements |
| `card-glow` | Soft card elevation on hover |

```tsx
// Interactive card
<Card className="transition-smooth hover-lift cursor-pointer">

// Interactive button
<Button className="transition-smooth">
```

---

## Layout Standards

### Page Structure

```tsx
// Every page should follow this structure
<PageContainer>
  <PageHeader 
    title="Page Title"
    description="Optional description"
    actions={<Button>Action</Button>}
  />
  
  {/* Optional filter bar */}
  <FilterBar className="mb-lg">
    {/* Filters */}
  </FilterBar>
  
  {/* Main content */}
  <div className="space-y-lg">
    {/* Content sections */}
  </div>
</PageContainer>
```

### Grid Layouts

```tsx
// Card grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
  {items.map(item => <Card key={item.id} />)}
</div>

// Stats cards
<div className="grid grid-cols-2 md:grid-cols-4 gap-md">
  {stats.map(stat => <StatCard key={stat.label} />)}
</div>
```

### Section Spacing

```tsx
// Between major sections
<div className="space-y-lg">
  <Section1 />
  <Section2 />
</div>

// Within a section
<div className="space-y-md">
  <SubSection1 />
  <SubSection2 />
</div>

// Dense content (form fields, list items)
<div className="space-y-sm">
  <Item1 />
  <Item2 />
</div>
```

---

## Exceptions

The following are acceptable exceptions to the token rules:

1. **Device Simulations** (e.g., phone previews in SnapPreview.tsx)
   - May use exact device dimensions and colors
   - Document in component comments

2. **Third-Party Library Overrides**
   - When overriding library styles, document why
   - Keep overrides minimal and scoped

3. **Pixel-Perfect Requirements**
   - When matching exact external designs
   - Document the source requirement

---

## Migration Approach

### For Existing Code

1. **DO NOT** mass-migrate existing files
2. **DO** fix files when editing them for other reasons
3. **DO** prioritize high-visibility pages when making fixes

### For New Code

1. **ALL** new code MUST follow this guide
2. **NO** exceptions without documented justification
3. **REVIEW** PRs for token compliance

### When Editing a File

If you're editing a file for any reason:
1. Fix obvious token violations in the code you're touching
2. Don't fix unrelated code in the same file (scope creep)
3. Note large violations for future cleanup

---

## Checklist for New Components

Before submitting new code, verify:

- [ ] No raw colors (`text-white`, `bg-gray-*`, hex values)
- [ ] No raw typography (`text-sm`, `text-xs`, `text-lg`)
- [ ] No raw spacing (`gap-4`, `p-6`, `space-y-4`)
- [ ] Uses semantic tokens for all colors
- [ ] Uses semantic tokens for all typography
- [ ] Uses semantic tokens for all spacing
- [ ] Works correctly in both Light and Dark modes
- [ ] Uses appropriate z-index tokens for overlays
- [ ] Has proper hover/focus states with transitions

---

## Common Mistakes to Avoid

### 1. Mixing Systems

```tsx
// ❌ BAD - Mixing semantic and raw tokens
<div className="text-body-sm text-gray-500">

// ✅ GOOD - All semantic
<div className="text-body-sm text-muted-foreground">
```

### 2. Hardcoding Dark Mode

```tsx
// ❌ BAD - Hardcoded dark mode colors
<div className="bg-gray-900 dark:bg-gray-800">

// ✅ GOOD - Semantic tokens handle both modes
<div className="bg-card">
```

### 3. Inline Color Overrides

```tsx
// ❌ BAD - Inline hex colors
<Button style={{ backgroundColor: '#3b82f6' }}>

// ✅ GOOD - Use variant or semantic class
<Button variant="default">
```

### 4. Wrong Token Category

```tsx
// ❌ BAD - Using text token for heading
<h2 className="text-body font-bold">

// ✅ GOOD - Using heading token
<h2 className="text-heading-md font-semibold">
```

---

## AI Instructions

When generating code for this project:

1. **ALWAYS** use semantic tokens from this guide
2. **NEVER** use raw Tailwind colors or typography
3. **CHECK** both Light and Dark modes work correctly
4. **PREFER** existing UI components from `src/components/ui/`
5. **FOLLOW** the component patterns exactly as shown
6. **APPLY** proper spacing using semantic tokens only

---

*Last Updated: December 2024*
*Version: 1.0 - Consolidated from TOKENS.md, UI_RULES.md, DESIGN_SYSTEM.md*
