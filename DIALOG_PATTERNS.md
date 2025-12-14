# Dialog Component Patterns

This document captures patterns for building robust, user-friendly dialogs.

## Closure Rules

### ❌ ANTI-PATTERN: Dialog Closes on Internal Clicks

```tsx
// BROKEN - Dialog closes when user clicks dropdown or checkbox
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <Select>...</Select>  {/* Clicking closes dialog! */}
  </DialogContent>
</Dialog>
```

### ✅ CORRECT: Prevent Closure on Internal Interactions

```tsx
// CORRECT - Only close via ESC, X button, or clicking outside
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent
    onInteractOutside={(e) => e.preventDefault()}
    onEscapeKeyDown={() => setOpen(false)}
  >
    <Select>...</Select>  {/* Works correctly */}
  </DialogContent>
</Dialog>
```

**Universal Rule:** Users can only close dialogs via:
1. ESC key
2. X button in header
3. Clicking outside the dialog
4. Explicit Cancel/Close buttons

---

## State Reset on Entity Change

### ❌ ANTI-PATTERN: Stale Data When Switching Entities

```tsx
// BROKEN - Shows previous task data when opening new task
const TaskDialog = ({ taskId }) => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchTask(taskId).then(setData);
  }, [taskId]);
  
  // Problem: data still shows old task until fetch completes!
  return <div>{data?.title}</div>;
};
```

### ✅ CORRECT: Clear State + Show Loading

```tsx
// CORRECT - Clear immediately, show loading, then new data
const TaskDialog = ({ taskId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Clear immediately when taskId changes
    setData(null);
    setLoading(true);
    
    fetchTask(taskId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [taskId]);
  
  if (loading) return <DialogSkeleton />;
  return <div>{data?.title}</div>;
};
```

---

## Cache-First Loading

### ❌ ANTI-PATTERN: Always Fetch, Ignore Cache

```tsx
// BROKEN - Slow, shows loading every time
const TaskDialog = ({ taskId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => fetchTask(taskId),
    // No staleTime = refetches every time
  });
};
```

### ✅ CORRECT: Use Cache, Refetch in Background

```tsx
// CORRECT - Show cached data instantly, refresh in background
const TaskDialog = ({ taskId }) => {
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => fetchTask(taskId),
    staleTime: 30 * 1000, // 30 seconds
  });
  
  // Show cached data + subtle refresh indicator
  return (
    <>
      {isFetching && !isLoading && <RefreshIndicator />}
      <TaskContent data={data} />
    </>
  );
};
```

---

## Parallel Data Fetching

### ❌ ANTI-PATTERN: Sequential Fetches

```tsx
// BROKEN - Waterfall requests, slow
useEffect(() => {
  fetchTask(id).then(task => {
    setTask(task);
    fetchComments(id).then(comments => {
      setComments(comments);
      fetchAssignees(id).then(setAssignees);
    });
  });
}, [id]);
```

### ✅ CORRECT: Parallel Queries

```tsx
// CORRECT - All fetches start simultaneously
const { data: task } = useQuery({
  queryKey: ["task", id],
  queryFn: () => fetchTask(id),
});

const { data: comments } = useQuery({
  queryKey: ["task-comments", id],
  queryFn: () => fetchComments(id),
});

const { data: assignees } = useQuery({
  queryKey: ["task-assignees", id],
  queryFn: () => fetchAssignees(id),
});
```

---

## Form State Management

### ❌ ANTI-PATTERN: Uncontrolled Inputs Lose State

```tsx
// BROKEN - Can't programmatically update values
<input defaultValue={task?.title} />
```

### ✅ CORRECT: Controlled Inputs with Form State

```tsx
// CORRECT - Full control over form state
const [title, setTitle] = useState(task?.title ?? "");

useEffect(() => {
  if (task) setTitle(task.title);
}, [task]);

<input value={title} onChange={(e) => setTitle(e.target.value)} />
```

---

## Read-Only vs Edit Mode

### ❌ ANTI-PATTERN: Hide Fields in View Mode

```tsx
// BROKEN - Different layout between modes confuses users
{mode === "edit" && <AdvancedSettings />}
```

### ✅ CORRECT: Same Layout, Different Interactivity

```tsx
// CORRECT - Same layout, just disable editing
<AdvancedSettings 
  disabled={mode === "view"} 
  readOnly={mode === "view"}
/>

// Or use CSS for visual indication
<div className={mode === "view" ? "opacity-75 pointer-events-none" : ""}>
  <AdvancedSettings />
</div>
```

---

## Loading States

### ❌ ANTI-PATTERN: Flash of Empty Content

```tsx
// BROKEN - Shows empty form, then populates
return (
  <form>
    <input value={data?.title} />  {/* Empty initially */}
  </form>
);
```

### ✅ CORRECT: Skeleton While Loading

```tsx
// CORRECT - Clear loading indication
if (isLoading) {
  return (
    <DialogContent>
      <Skeleton className="h-8 w-full mb-4" />
      <Skeleton className="h-32 w-full" />
    </DialogContent>
  );
}

return (
  <DialogContent>
    <input value={data.title} />
  </DialogContent>
);
```

---

## Checklist for Dialog Components

- [ ] Dialog only closes via ESC, X button, or outside click
- [ ] State clears when entity ID changes
- [ ] Loading skeleton shown during fetch
- [ ] Cache-first strategy with background refresh
- [ ] Parallel queries, not waterfall
- [ ] Same layout in view/edit modes
- [ ] Controlled form inputs
- [ ] Error states handled gracefully
