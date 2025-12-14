# React Query Patterns

This document captures patterns for using React Query (TanStack Query) effectively.

## Optimistic Updates

### ❌ ANTI-PATTERN: Wait for Server Before UI Update

```tsx
// BROKEN - Slow, unresponsive feel
const toggleComplete = async (taskId: string) => {
  await supabase
    .from("tasks")
    .update({ status: "Completed" })
    .eq("id", taskId);
  
  // User waits for network round-trip before seeing change
  queryClient.invalidateQueries({ queryKey: ["tasks"] });
};
```

### ✅ CORRECT: Update UI Immediately, Rollback on Error

```tsx
// CORRECT - Instant feedback
const mutation = useMutation({
  mutationFn: (taskId: string) =>
    supabase.from("tasks").update({ status: "Completed" }).eq("id", taskId),
  
  onMutate: async (taskId) => {
    // Cancel in-flight queries
    await queryClient.cancelQueries({ queryKey: ["tasks"] });
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(["tasks"]);
    
    // Optimistically update
    queryClient.setQueryData(["tasks"], (old: Task[]) =>
      old.map(t => t.id === taskId ? { ...t, status: "Completed" } : t)
    );
    
    return { previous };
  },
  
  onError: (err, taskId, context) => {
    // Rollback on error
    queryClient.setQueryData(["tasks"], context?.previous);
    toast.error("Failed to complete task");
  },
  
  onSettled: () => {
    // Sync with server
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  },
});
```

---

## Query Invalidation

### ❌ ANTI-PATTERN: Forgetting to Invalidate Related Queries

```tsx
// BROKEN - Task list still shows old data
const createTask = async (task: NewTask) => {
  await supabase.from("tasks").insert(task);
  // Forgot to invalidate!
};
```

### ✅ CORRECT: Invalidate All Related Query Keys

```tsx
// CORRECT - All views update
const createTask = async (task: NewTask) => {
  await supabase.from("tasks").insert(task);
  
  // Invalidate all task-related queries
  queryClient.invalidateQueries({ queryKey: ["tasks"] });
  queryClient.invalidateQueries({ queryKey: ["task-counts"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
};
```

### Pro Tip: Use Query Key Factories

```tsx
// Define query keys in one place
export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (filters: TaskFilters) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, "detail"] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

// Invalidate all task queries at once
queryClient.invalidateQueries({ queryKey: taskKeys.all });
```

---

## Stale Time Configuration

### ❌ ANTI-PATTERN: No Stale Time (Refetch Every Render)

```tsx
// BROKEN - Unnecessary network requests
const { data } = useQuery({
  queryKey: ["user-profile"],
  queryFn: fetchProfile,
  // staleTime defaults to 0 - refetches constantly
});
```

### ✅ CORRECT: Set Appropriate Stale Times

```tsx
// CORRECT - Cache for reasonable duration
const { data } = useQuery({
  queryKey: ["user-profile"],
  queryFn: fetchProfile,
  staleTime: 5 * 60 * 1000, // 5 minutes - profile rarely changes
});

const { data: tasks } = useQuery({
  queryKey: ["tasks"],
  queryFn: fetchTasks,
  staleTime: 30 * 1000, // 30 seconds - tasks change more often
});
```

---

## Error Handling

### ❌ ANTI-PATTERN: Silent Failures

```tsx
// BROKEN - User has no idea something failed
const { data } = useQuery({
  queryKey: ["tasks"],
  queryFn: fetchTasks,
  // No error handling
});
```

### ✅ CORRECT: Show Errors, Provide Retry

```tsx
// CORRECT - User can see and recover from errors
const { data, error, isError, refetch } = useQuery({
  queryKey: ["tasks"],
  queryFn: fetchTasks,
  retry: 1, // Retry once on failure
  retryDelay: 1000,
});

if (isError) {
  return (
    <div className="text-destructive">
      Failed to load tasks
      <Button onClick={() => refetch()}>Retry</Button>
    </div>
  );
}
```

---

## Dependent Queries

### ❌ ANTI-PATTERN: Fetch Before Dependencies Ready

```tsx
// BROKEN - Fetches with undefined userId
const { data: user } = useQuery({ queryKey: ["user"], queryFn: fetchUser });
const { data: tasks } = useQuery({
  queryKey: ["user-tasks", user?.id],
  queryFn: () => fetchUserTasks(user.id), // user might be undefined!
});
```

### ✅ CORRECT: Use `enabled` Option

```tsx
// CORRECT - Wait for user before fetching tasks
const { data: user } = useQuery({ queryKey: ["user"], queryFn: fetchUser });
const { data: tasks } = useQuery({
  queryKey: ["user-tasks", user?.id],
  queryFn: () => fetchUserTasks(user!.id),
  enabled: !!user?.id, // Only fetch when user is loaded
});
```

---

## Prefetching for Performance

### ❌ ANTI-PATTERN: Fetch Only on Navigation

```tsx
// BROKEN - User waits for data after clicking
<Link to={`/task/${task.id}`}>View Task</Link>
```

### ✅ CORRECT: Prefetch on Hover

```tsx
// CORRECT - Data ready by the time user clicks
<Link
  to={`/task/${task.id}`}
  onMouseEnter={() => {
    queryClient.prefetchQuery({
      queryKey: ["task", task.id],
      queryFn: () => fetchTask(task.id),
      staleTime: 60 * 1000,
    });
  }}
>
  View Task
</Link>
```

---

## Mutation Loading States

### ❌ ANTI-PATTERN: No Feedback During Mutation

```tsx
// BROKEN - Button looks inactive, user clicks multiple times
<Button onClick={() => mutation.mutate(data)}>
  Save
</Button>
```

### ✅ CORRECT: Show Loading, Disable Button

```tsx
// CORRECT - Clear feedback, prevents double-submit
<Button 
  onClick={() => mutation.mutate(data)}
  disabled={mutation.isPending}
>
  {mutation.isPending ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Saving...
    </>
  ) : (
    "Save"
  )}
</Button>
```

---

## Query Client Configuration

```tsx
// src/lib/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds default
      gcTime: 5 * 60 * 1000, // 5 minutes cache
      retry: 1,
      refetchOnWindowFocus: false, // Prevent unexpected refetches
    },
    mutations: {
      onError: (error) => {
        // Global error handling
        console.error("Mutation error:", error);
        toast.error("Operation failed. Please try again.");
      },
    },
  },
});
```

---

## Checklist for React Query Usage

- [ ] Optimistic updates for user-facing mutations
- [ ] All related queries invalidated after mutations
- [ ] Appropriate stale times set
- [ ] Error states handled with retry option
- [ ] Dependent queries use `enabled` option
- [ ] Loading states shown during mutations
- [ ] Prefetch on hover for navigation links
- [ ] Query key factories for consistency
