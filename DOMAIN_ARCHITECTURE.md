# Domain Architecture

This document defines the domain-driven architecture pattern used in this codebase.

## Core Principle: Single Source of Truth

All business logic, types, constants, and shared actions live in `src/domain/`. Components import from domain, never define business logic inline.

```
src/
├── domain/
│   ├── index.ts          # Re-exports all domain exports
│   └── tasks/
│       ├── index.ts      # Types, enums, schemas, config
│       └── actions.ts    # Shared mutation functions
├── components/           # UI only, imports from domain
├── hooks/                # Data fetching, imports from domain
└── pages/                # Route components
```

---

## Domain Module Structure

### `src/domain/tasks/index.ts`

```typescript
// Enums - Single source of truth for valid values
export enum TaskStatusDB {
  Pending = "Pending",
  Ongoing = "Ongoing",
  Blocked = "Blocked",
  Completed = "Completed",
  Failed = "Failed",
}

export enum TaskStatusUI {
  Backlog = "Backlog",
  Ongoing = "Ongoing",
  Blocked = "Blocked",
  Completed = "Completed",
  Failed = "Failed",
}

// Bidirectional mapping
export const STATUS_UI_TO_DB: Record<TaskStatusUI, TaskStatusDB> = {
  [TaskStatusUI.Backlog]: TaskStatusDB.Pending,
  [TaskStatusUI.Ongoing]: TaskStatusDB.Ongoing,
  // ...
};

export const STATUS_DB_TO_UI: Record<TaskStatusDB, TaskStatusUI> = {
  [TaskStatusDB.Pending]: TaskStatusUI.Backlog,
  // ...
};

// Mapping functions
export function mapStatusToDb(uiStatus: string): TaskStatusDB { ... }
export function mapStatusToUi(dbStatus: string): TaskStatusUI { ... }

// Zod schemas for validation
export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  status: z.nativeEnum(TaskStatusUI),
  failure_reason: z.string().optional(),
}).refine(/* conditional validation */);

// UI Config for rendering
export const TASK_STATUS_CONFIG: Record<TaskStatusUI, StatusConfig> = {
  [TaskStatusUI.Backlog]: {
    label: "Backlog",
    color: "bg-muted",
    icon: Clock,
  },
  // ...
};
```

### `src/domain/tasks/actions.ts`

```typescript
// Shared mutation functions - use these everywhere
export async function completeTask(taskId: string): Promise<TaskActionResult> {
  const { error } = await supabase
    .from("tasks")
    .update({ status: "Completed" })
    .eq("id", taskId);

  if (error) {
    toast.error("Failed to complete task");
    return { success: false, error: error.message };
  }

  queryClient.invalidateQueries({ queryKey: ["tasks"] });
  return { success: true };
}

export async function completeTasksBulk(taskIds: string[]): Promise<BulkResult> { ... }
export async function setTaskStatus(taskId: string, status: string): Promise<TaskActionResult> { ... }
```

---

## Import Conventions

### ❌ ANTI-PATTERN: Hardcoded Values in Components

```tsx
// BROKEN - Duplicated, can get out of sync
const TaskCard = () => {
  const statuses = ["Pending", "In Progress", "Done"]; // Wrong values!
  
  return (
    <Select>
      {statuses.map(s => <option>{s}</option>)}
    </Select>
  );
};
```

### ✅ CORRECT: Import from Domain

```tsx
// CORRECT - Single source of truth
import { TASK_STATUS_OPTIONS, TaskStatusUI } from "@/domain/tasks";

const TaskCard = () => {
  return (
    <Select>
      {TASK_STATUS_OPTIONS.map(({ value, label }) => (
        <option value={value}>{label}</option>
      ))}
    </Select>
  );
};
```

---

## When to Add to Domain

Add to `src/domain/` when:

1. **Multiple components need the same constant** - Status lists, priority options
2. **Business logic needs validation** - Zod schemas with conditional rules
3. **Type safety across UI/DB boundary** - Enum mappings
4. **Shared mutations** - Actions called from multiple UI surfaces

Keep in component when:

1. **UI-only state** - Modal open/close, form dirty state
2. **Component-specific config** - Column widths, animation settings
3. **One-off values** - Single-use labels

---

## Audit Checklist for Constant Updates

When updating centralized constants (statuses, tags, priorities), verify all locations:

- [ ] `src/domain/[entity]/index.ts` - Enums and config
- [ ] `src/domain/[entity]/actions.ts` - Shared mutations
- [ ] `src/components/*Dialog.tsx` - Create/Edit dialogs
- [ ] `src/components/*Filter*.tsx` - Filter dropdowns
- [ ] `src/components/*Table*.tsx` - List/Table views
- [ ] `src/components/*BulkActions*.tsx` - Bulk action menus
- [ ] `src/schemas/apiSchemas.ts` - API validation schemas
- [ ] Database enums (if applicable)

---

## Domain File Template

```typescript
// src/domain/[entity]/index.ts

import { z } from "zod";

// ============ ENUMS ============
export enum EntityStatusDB { ... }
export enum EntityStatusUI { ... }

// ============ MAPPINGS ============
export const STATUS_UI_TO_DB = { ... };
export const STATUS_DB_TO_UI = { ... };

export function mapStatusToDb(ui: string): EntityStatusDB { ... }
export function mapStatusToUi(db: string): EntityStatusUI { ... }

// ============ VALIDATION ============
export const createEntitySchema = z.object({ ... });
export const updateEntitySchema = createEntitySchema.partial();

export type CreateEntityInput = z.infer<typeof createEntitySchema>;
export type UpdateEntityInput = z.infer<typeof updateEntitySchema>;

// ============ UI CONFIG ============
export const ENTITY_STATUS_OPTIONS = [ ... ];
export const ENTITY_STATUS_CONFIG = { ... };

// ============ HELPERS ============
export function getStatusConfig(status: string) { ... }

// ============ RE-EXPORT ACTIONS ============
export * from "./actions";
```

---

## Benefits

1. **No drift** - UI and DB always use same values
2. **Type safety** - TypeScript catches mismatches
3. **Easy updates** - Change one place, applies everywhere
4. **Clear boundaries** - Components don't contain business logic
5. **Testable** - Domain functions can be unit tested in isolation
