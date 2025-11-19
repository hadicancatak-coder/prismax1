# Design System Tokens - Phase 4A Complete ✅

## Overview
This document defines the semantic design tokens for consistent UI/UX across the entire Prisma application.

---

## 🎨 Typography Scale

Use semantic text sizes instead of direct Tailwind classes:

| Token Class | CSS Variable | Size | Usage |
|------------|--------------|------|-------|
| `text-metadata` | `--text-metadata` | 12px | Timestamps, micro labels, badges, metadata |
| `text-body-sm` | `--text-body-sm` | 14px | Secondary text, descriptions, table cells |
| `text-body` | `--text-body` | 16px | Primary body text, form labels |
| `text-heading-sm` | `--text-heading-sm` | 18px | Card titles, small section headers |
| `text-heading-md` | `--text-heading-md` | 20px | Dialog titles, section headers |
| `text-heading-lg` | `--text-heading-lg` | 24px | Page subtitles, major sections |
| `text-page-title` | `--text-page-title` | 30px | Main page headers (via PageHeader) |

### ✅ Correct Usage:
```tsx
<p className="text-metadata text-muted-foreground">Created 2 hours ago</p>
<p className="text-body-sm">This is a description</p>
<h3 className="text-heading-sm font-semibold">Card Title</h3>
<DialogTitle className="text-heading-md">Edit Task</DialogTitle>
```

### ❌ Avoid:
```tsx
<p className="text-xs">...</p>  {/* Use text-metadata instead */}
<p className="text-sm">...</p>  {/* Use text-body-sm instead */}
<h3 className="text-lg">...</h3>  {/* Use text-heading-sm instead */}
```

---

## 📐 Spacing Scale

Use semantic spacing for consistent gaps and padding:

| Token Class | CSS Variable | Size | Usage |
|------------|--------------|------|-------|
| `gap-xs` / `space-xs` | `--space-xs` | 8px | Icon-to-text gaps, tight layouts |
| `gap-sm` / `space-sm` | `--space-sm` | 12px | Button internal gaps |
| `gap-md` / `space-md` | `--space-md` | 16px | Form field spacing |
| `gap-lg` / `space-lg` | `--space-lg` | 24px | Section spacing |
| `gap-xl` / `space-xl` | `--space-xl` | 32px | Major section dividers |
| `gap-2xl` / `space-2xl` | `--space-2xl` | 48px | Page section dividers |

### ✅ Correct Usage:
```tsx
<div className="flex items-center gap-sm">  {/* 12px gap */}
  <Icon className="h-4 w-4" />
  <span>Text</span>
</div>

<form className="space-y-md">  {/* 16px vertical spacing */}
  <div>...</div>
  <div>...</div>
</form>

<div className="p-6 space-y-lg">  {/* 24px between sections */}
  <Section />
  <Section />
</div>
```

### ❌ Avoid:
```tsx
<div className="gap-2">...</div>  {/* Use gap-sm instead */}
<div className="gap-4">...</div>  {/* Use gap-md instead */}
<div className="gap-6">...</div>  {/* Use gap-lg instead */}
```

---

## 🔘 Border Radius

| Token Class | CSS Variable | Size | Usage |
|------------|--------------|------|-------|
| `rounded-sm` | `--radius-sm` | 6px | Small elements, badges |
| `rounded` / `rounded-md` | `--radius-md` | 8px | Standard (buttons, inputs) |
| `rounded-lg` | `--radius-lg` | 12px | Cards, dialogs |
| `rounded-xl` | `--radius-xl` | 16px | Large surfaces |

---

## 🎯 Component Standards

### Buttons
```tsx
{/* Icon-only button */}
<Button size="icon" variant="ghost">
  <Icon className="h-4 w-4" />
</Button>

{/* Button with icon */}
<Button variant="default" className="gap-sm">
  <Icon className="h-4 w-4" />
  <span>Action</span>
</Button>

{/* Small button */}
<Button size="sm" className="gap-sm">
  Text
</Button>
```

### Cards
```tsx
<Card className="p-6">
  <CardHeader className="p-0 mb-4">
    <CardTitle className="text-heading-sm">Title</CardTitle>
    <CardDescription className="text-body-sm">Description</CardDescription>
  </CardHeader>
  <CardContent className="p-0">
    Content
  </CardContent>
</Card>
```

### Forms
```tsx
<form className="space-y-md">
  <div className="space-y-2">
    <Label className="text-body-sm font-medium">Field Name</Label>
    <Input placeholder="Enter value" />
  </div>
</form>
```

### Tables
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead className="text-body-sm font-semibold">Column</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="text-body-sm">Data</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Dialogs
```tsx
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle className="text-heading-md">Title</DialogTitle>
      <DialogDescription className="text-body-sm text-muted-foreground">
        Description
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      Content
    </div>
    <DialogFooter className="gap-sm">
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 🎨 Color Usage

**Always use semantic color tokens, NEVER direct colors:**

### ✅ Correct:
```tsx
<div className="bg-card text-card-foreground">
<div className="bg-primary text-primary-foreground">
<div className="bg-muted text-muted-foreground">
<div className="border border-border">
```

### ❌ Avoid:
```tsx
<div className="bg-white text-black">  {/* NEVER */}
<div className="bg-gray-700 text-white">  {/* NEVER */}
<div className="text-blue-500">  {/* Use text-primary */}
```

---

## 📋 Migration Checklist

When refactoring components, ensure:

- [ ] Replace `text-xs` → `text-metadata`
- [ ] Replace `text-sm` → `text-body-sm`
- [ ] Replace `text-base` → `text-body`
- [ ] Replace `text-lg` → `text-heading-sm`
- [ ] Replace `text-xl` → `text-heading-md`
- [ ] Replace `text-2xl` → `text-heading-lg`
- [ ] Replace `gap-2` → `gap-sm`
- [ ] Replace `gap-4` → `gap-md`
- [ ] Replace `gap-6` → `gap-lg`
- [ ] Replace `space-y-4` → `space-y-md`
- [ ] Remove all `text-white`, `text-black`, `bg-white`, `bg-gray-*`
- [ ] Use semantic card padding: `p-6`
- [ ] Use semantic form spacing: `space-y-md`

---

## 🚀 Next Steps (Phase 4B-C)

1. **Phase 4B**: Apply tokens to all components (~150 files)
2. **Phase 4C**: Apply tokens to all pages (~35 files)
3. **Testing**: Verify dark mode, responsiveness, consistency

---

**Last Updated:** Phase 4A Complete - Foundation Established
