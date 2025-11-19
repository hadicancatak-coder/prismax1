# UI/UX Rules & Design System

## 🎨 **CRITICAL RULE: NEVER USE HARDCODED COLORS**

### ❌ **FORBIDDEN**
```tsx
// NEVER DO THIS:
className="text-gray-900 bg-gray-800 text-white bg-black"
className="text-blue-500 border-red-600"
```

### ✅ **ALWAYS USE SEMANTIC TOKENS**
```tsx
// DO THIS:
className="text-foreground bg-card"
className="text-primary border-border"
className="text-muted-foreground bg-muted"
```

---

## 🎨 Color System (Semantic Tokens)

All colors MUST be HSL and use semantic tokens from `index.css` and `tailwind.config.ts`.

### **Primary Colors**
- `text-foreground` - Main text color (white on dark theme)
- `bg-background` - Main background (#1A1F2C)
- `text-primary` - Brand accent text
- `bg-primary` - Brand accent background
- `border-border` - Standard borders

### **Card & Surface Colors**
- `bg-card` - Card backgrounds (#282E33 - dark gray)
- `text-card-foreground` - Text on cards (white)
- `bg-muted` - Muted/secondary surfaces
- `text-muted-foreground` - Muted text (gray)

### **Interactive States**
- `hover:bg-accent` - Hover states
- `focus:ring-ring` - Focus rings
- `active:bg-primary/90` - Active states

### **Status Colors** (with semantic variants)
```tsx
// Status badges ALWAYS use semantic patterns:
"bg-pending/15 text-pending border-pending/30"     // Pending
"bg-primary/15 text-primary border-primary/30"     // Ongoing
"bg-success/15 text-success border-success/30"     // Completed
"bg-destructive/15 text-destructive border-destructive/30" // Error/Failed
"bg-warning/15 text-warning border-warning/30"     // Warning
```

### **Priority Colors**
```tsx
// High Priority
"bg-destructive/15 text-destructive border-destructive/30"

// Medium Priority
"bg-warning/15 text-warning border-warning/30"

// Low Priority
"bg-success/15 text-success border-success/30"
```

---

## 📝 Typography Scale

### **DO NOT use arbitrary font sizes** - Use the predefined scale:

```tsx
// Headings
text-page-title        // 24px - Page titles
text-section-title     // 20px - Section headers
text-card-title        // 18px - Card titles

// Body Text
text-body              // 14px - Standard body text
text-body-sm           // 13px - Small body text
text-metadata          // 12px - Metadata, labels

// Usage example:
<h1 className="text-page-title font-semibold text-foreground">Profile</h1>
<p className="text-body text-muted-foreground">User description</p>
<span className="text-metadata text-muted-foreground">Created: 2 days ago</span>
```

---

## 📏 Spacing Scale

Use consistent spacing tokens - **DO NOT use arbitrary values**:

```tsx
// Gaps (between elements)
gap-xs     // 0.25rem (4px)
gap-sm     // 0.5rem (8px)
gap-md     // 1rem (16px)
gap-lg     // 1.5rem (24px)
gap-xl     // 2rem (32px)

// Padding
p-sm       // 0.5rem (8px)
p-md       // 1rem (16px)
p-lg       // 1.5rem (24px)
p-card     // 1.25rem (20px) - Standard card padding

// Margins
mt-section // 2rem (32px) - Between sections
mb-card    // 1.5rem (24px) - Between cards
```

---

## 🧩 Component Standards

### **Card Component**
```tsx
// ✅ Standard Card
<Card className="bg-card border-border hover-lift">
  <CardHeader>
    <h3 className="text-card-title font-semibold text-foreground">Title</h3>
  </CardHeader>
  <CardContent className="p-card">
    <p className="text-body text-muted-foreground">Content</p>
  </CardContent>
</Card>

// ✅ Interactive Card (clickable)
<Card className="cursor-pointer hover-lift hover:shadow-lg transition-smooth">
  ...
</Card>
```

### **Badge Component**
```tsx
// ✅ Status Badge Pattern
<Badge className="bg-primary/15 text-primary border-primary/30">
  Active
</Badge>

// ✅ Priority Badge Pattern
<Badge className="bg-destructive/15 text-destructive border-destructive/30">
  High Priority
</Badge>
```

### **Button Component**
```tsx
// Use button variants, DO NOT override colors
<Button variant="default">Primary Action</Button>
<Button variant="outline">Secondary Action</Button>
<Button variant="ghost">Tertiary Action</Button>
<Button variant="destructive">Delete</Button>
```

---

## 📐 Borders & Radius

```tsx
// Border widths
border           // 1px
border-2         // 2px
border-l-4       // Left border 4px (priority indicators)

// Border colors - ALWAYS semantic
border-border         // Default border
border-primary        // Primary accent border
border-destructive    // Error border

// Border radius - ALWAYS use design tokens
rounded-sm       // 0.125rem (2px)
rounded-md       // 0.375rem (6px) - DEFAULT
rounded-lg       // 0.5rem (8px)
rounded-full     // 9999px - Pills/avatars
```

---

## ⚡ Transitions & Animations

```tsx
// Standard transition
transition-smooth    // all 0.3s cubic-bezier

// Hover effects
hover-lift          // Slight upward movement
hover-scale         // Scale to 105%
hover-glow          // Glow effect

// Usage:
<Card className="transition-smooth hover-lift hover:shadow-lg">
  ...
</Card>
```

---

## 🎨 Current Theme (Confluence-style Dark)

```css
/* From index.css */
--background: 210 40% 12%;        /* #1A1F2C - Dark blue-gray */
--foreground: 0 0% 100%;          /* #FFFFFF - White text */
--card: 210 20% 18%;              /* #282E33 - Card background */
--card-foreground: 0 0% 100%;     /* #FFFFFF - Card text */
--primary: 221 83% 53%;           /* #2563EB - Blue accent */
--border: 214 15% 25%;            /* Subtle borders */
--muted: 210 20% 25%;             /* Muted backgrounds */
--muted-foreground: 215 10% 60%;  /* Muted text */
```

---

## 🚫 Rules to NOT Break Features

### **1. Always Use Correct Component Imports**
```tsx
// ✅ CORRECT - Use the organized components
import { TaskCard } from "@/components/tasks/TaskCard";
import { CampaignCard } from "@/components/campaigns/CampaignCard";

// ❌ WRONG - Don't import from wrong locations
import { TaskCard } from "@/components/TaskCard"; // Old/duplicate
```

### **2. Check for Duplicate Components**
Before creating a new component, search if it exists:
- `src/components/tasks/` - Task-related components
- `src/components/campaigns/` - Campaign components
- `src/components/ads/` - Ad planner components
- `src/components/ui/` - Shadcn UI primitives

### **3. Never Override Semantic Classes with Hardcoded Colors**
```tsx
// ❌ WRONG
<div className="bg-card text-foreground text-gray-900">
  {/* text-gray-900 overrides text-foreground! */}
</div>

// ✅ CORRECT
<div className="bg-card text-foreground">
  {/* Respects theme */}
</div>
```

### **4. Test Both Light & Dark Themes**
Always verify your changes work in:
- Dark mode (default)
- Light mode (if applicable)

### **5. HTML Content Rendering**
```tsx
// ❌ WRONG - Shows HTML codes
<p>{task.description}</p>

// ✅ CORRECT - Renders HTML properly
<div dangerouslySetInnerHTML={{ __html: task.description }} />

// ✅ BETTER - Use markdown parser if available
import { parseMarkdown } from "@/lib/markdownParser";
<div dangerouslySetInnerHTML={{ __html: parseMarkdown(task.description) }} />
```

---

## 🔍 Migration Checklist (Fixing UI Issues)

When you encounter UI issues, follow this checklist:

### **Step 1: Identify Hardcoded Colors**
```bash
# Search for common violations:
- text-gray-*
- bg-gray-*
- text-white
- bg-black
- text-blue-*
- border-red-*
```

### **Step 2: Replace with Semantic Tokens**
```tsx
// Before
className="text-gray-900 bg-gray-800"

// After
className="text-foreground bg-card"
```

### **Step 3: Verify Component Location**
```tsx
// Check if using correct component
import { TaskCard } from "@/components/tasks/TaskCard"; // ✅
```

### **Step 4: Test in Preview**
- Check text readability (contrast)
- Verify hover states work
- Ensure borders are visible
- Test interactive elements

---

## 📋 Quick Reference Card

| Use Case | Correct Class | Forbidden Class |
|----------|---------------|-----------------|
| Main text | `text-foreground` | `text-gray-900`, `text-white` |
| Secondary text | `text-muted-foreground` | `text-gray-600`, `text-gray-400` |
| Card background | `bg-card` | `bg-gray-800`, `bg-black` |
| Main background | `bg-background` | `bg-gray-900` |
| Borders | `border-border` | `border-gray-700` |
| Hover background | `hover:bg-accent` | `hover:bg-gray-700` |
| Status badge | `bg-primary/15 text-primary` | `bg-blue-100 text-blue-900` |

---

## 🛠️ Tools to Maintain Standards

### **Before Making Changes:**
1. Check `src/index.css` for available semantic tokens
2. Check `tailwind.config.ts` for color definitions
3. Search codebase for similar components
4. Review `UI_RULES.md` (this file)

### **After Making Changes:**
1. Preview in both themes (if applicable)
2. Check console for errors
3. Verify text contrast (use browser DevTools)
4. Test interactive states (hover, focus, active)

---

## 💡 Examples of Correct Patterns

### **Task Card (Fixed)**
```tsx
<Card className="bg-card border-border hover-lift cursor-pointer">
  <h3 className="text-card-title font-semibold text-foreground">
    {task.title}
  </h3>
  <p className="text-body text-muted-foreground line-clamp-2">
    {task.description}
  </p>
  <Badge className="bg-primary/15 text-primary border-primary/30">
    {task.status}
  </Badge>
</Card>
```

### **Form Field**
```tsx
<div className="space-y-sm">
  <Label className="text-body text-foreground">Task Title</Label>
  <Input 
    className="bg-background border-border text-foreground"
    placeholder="Enter task title..."
  />
</div>
```

### **Status Indicator**
```tsx
const getStatusBadge = (status: string) => {
  const variants = {
    pending: "bg-pending/15 text-pending border-pending/30",
    ongoing: "bg-primary/15 text-primary border-primary/30",
    completed: "bg-success/15 text-success border-success/30",
  };
  
  return (
    <Badge className={variants[status]}>
      {status}
    </Badge>
  );
};
```

---

## 🚀 Go-Live Checklist

Before deploying changes:

- [ ] No hardcoded colors (text-gray-*, bg-gray-*, etc.)
- [ ] All text uses semantic tokens (text-foreground, text-muted-foreground)
- [ ] All backgrounds use semantic tokens (bg-card, bg-background)
- [ ] All borders use semantic tokens (border-border)
- [ ] Interactive states defined (hover, focus, active)
- [ ] Typography uses predefined scale (text-body, text-card-title, etc.)
- [ ] Spacing uses design tokens (gap-md, p-card, etc.)
- [ ] Components imported from correct locations
- [ ] No duplicate components exist
- [ ] HTML content renders properly (not as raw HTML codes)
- [ ] Tested in dark theme (default)
- [ ] Console shows no errors
- [ ] Build succeeds without warnings

---

**Last Updated:** Phase 1-3 Go-Live (2025)  
**Maintained By:** Development Team  
**Next Review:** After major UI changes
