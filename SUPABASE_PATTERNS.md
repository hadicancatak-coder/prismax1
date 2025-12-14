# Supabase Query Patterns

This document captures critical Supabase SDK patterns and anti-patterns to prevent recurring bugs.

## Query Filtering

### ❌ ANTI-PATTERN: Chained `.neq()` on Same Field

```typescript
// BROKEN - Creates duplicate query params, returns 400 Bad Request
.neq("status", "Completed")
.neq("status", "Backlog")
```

### ✅ CORRECT: Use `.not()` with `in` Operator

```typescript
// CORRECT - Single filter, works properly
.not("status", "in", "(Completed,Backlog)")
```

### ❌ ANTI-PATTERN: Using `.single()` When Row Might Not Exist

```typescript
// BROKEN - Throws error if no row found
const { data } = await supabase
  .from("profiles")
  .select("*")
  .eq("user_id", id)
  .single();
```

### ✅ CORRECT: Use `.maybeSingle()` for Optional Rows

```typescript
// CORRECT - Returns null if no row, no error
const { data } = await supabase
  .from("profiles")
  .select("*")
  .eq("user_id", id)
  .maybeSingle();
```

---

## Foreign Keys

### ❌ ANTI-PATTERN: Foreign Key to `auth.users`

```sql
-- BROKEN - Can't query auth.users from client
CREATE TABLE profiles (
  user_id UUID REFERENCES auth.users(id)
);
```

### ✅ CORRECT: Store User Data in Public Profiles Table

```sql
-- CORRECT - Query profiles from client, join on user_id
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,  -- No FK to auth.users
  name TEXT,
  email TEXT
);

-- Use profiles.id for all other FKs
CREATE TABLE tasks (
  assignee_id UUID REFERENCES profiles(id)
);
```

---

## RLS Policies

### ❌ ANTI-PATTERN: Missing RLS on User Data

```sql
-- BROKEN - Anyone can read/write all data
CREATE TABLE user_notes (
  id UUID PRIMARY KEY,
  user_id UUID,
  content TEXT
);
-- Forgot to enable RLS!
```

### ✅ CORRECT: Enable RLS with User-Scoped Policies

```sql
CREATE TABLE user_notes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT
);

ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes"
  ON user_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON user_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Admin Override Pattern

```sql
-- Allow admins to manage all users' data
CREATE POLICY "Admins can manage all"
  ON user_agenda FOR ALL
  USING (
    auth.uid() = user_id 
    OR has_role(auth.uid(), 'admin')
  );
```

---

## Query Limits

### ❌ ANTI-PATTERN: Assuming All Rows Returned

```typescript
// BROKEN - Supabase returns max 1000 rows by default
const { data } = await supabase.from("tasks").select("*");
// If 1500 tasks exist, you only get 1000!
```

### ✅ CORRECT: Use Pagination or Explicit Limits

```typescript
// CORRECT - Paginate large datasets
const { data, count } = await supabase
  .from("tasks")
  .select("*", { count: "exact" })
  .range(0, 49); // First 50

// Or set explicit limit if you need more
const { data } = await supabase
  .from("tasks")
  .select("*")
  .limit(2000);
```

---

## Realtime Subscriptions

### ❌ ANTI-PATTERN: Not Cleaning Up Subscriptions

```typescript
// BROKEN - Memory leak, duplicate events
useEffect(() => {
  const channel = supabase.channel("tasks").subscribe();
  // No cleanup!
}, []);
```

### ✅ CORRECT: Cleanup in useEffect Return

```typescript
// CORRECT - Proper cleanup
useEffect(() => {
  const channel = supabase
    .channel("tasks")
    .on("postgres_changes", { event: "*", schema: "public" }, handler)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

---

## Type Safety

### ❌ ANTI-PATTERN: Casting to `any` to Silence Errors

```typescript
// BROKEN - Hides real type issues
.eq("status", "Completed" as any)
```

### ✅ CORRECT: Use Proper Types from Generated Types

```typescript
import { Database } from "@/integrations/supabase/types";

type TaskStatus = Database["public"]["Enums"]["task_status"];

// CORRECT - Type-safe
.eq("status", "Completed" satisfies TaskStatus)
```

---

## Checklist for Code Review

- [ ] No chained `.neq()` on same field
- [ ] Using `.maybeSingle()` when row might not exist
- [ ] No direct FK references to `auth.users`
- [ ] RLS enabled on all user-scoped tables
- [ ] Pagination for queries that could return 1000+ rows
- [ ] Realtime subscriptions cleaned up in useEffect
- [ ] No `as any` casts on query filters
