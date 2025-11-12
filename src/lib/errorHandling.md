# Error Handling Utilities

This file contains comprehensive error handling utilities to prevent unhandled promise rejections and provide better user experience.

## Available Utilities

### 1. `safeAsync` - Safe Async Function Wrapper

Wraps async functions to catch and handle errors gracefully.

```typescript
import { safeAsync } from '@/lib/errorHandling';

// Usage
const result = await safeAsync(
  async () => {
    return await someAsyncOperation();
  },
  'Failed to perform operation' // Optional error message
);

// result will be null if error occurs
if (result) {
  // Use result
}
```

### 2. `safeURL` - Safe URL Constructor

Validates and constructs URLs safely without throwing errors.

```typescript
import { safeURL } from '@/lib/errorHandling';

// Usage
const url = safeURL('example.com'); // Returns URL object or null
const url2 = safeURL('https://example.com'); // Also handles full URLs

if (url) {
  console.log(url.hostname); // Safe to use
}
```

### 3. `safeMutate` - Safe Mutation Wrapper

Wraps React Query mutations to handle errors consistently.

```typescript
import { safeMutate } from '@/lib/errorHandling';

// Usage
const { data, error } = await safeMutate(
  createItem.mutateAsync,
  { name: 'New Item' },
  {
    successMessage: 'Item created successfully',
    errorMessage: 'Failed to create item',
    onSuccess: (data) => {
      // Handle success
    },
    onError: (error) => {
      // Handle error
    }
  }
);
```

### 4. `safePromise` - Safe Promise Handler

Catches promise rejections and returns null instead of throwing.

```typescript
import { safePromise } from '@/lib/errorHandling';

// Usage
const result = await safePromise(
  fetch('/api/data'),
  'Failed to fetch data'
);

if (result) {
  // Use result
}
```

### 5. `withErrorBoundary` - Function Error Boundary

Wraps functions with error handling.

```typescript
import { withErrorBoundary } from '@/lib/errorHandling';

// Usage
const safeFunction = withErrorBoundary(
  (arg1, arg2) => {
    // Your function logic
    return result;
  },
  'Function execution failed'
);

// Async functions are also supported
const safeAsyncFunction = withErrorBoundary(
  async (arg1) => {
    // Your async logic
    return await result;
  },
  'Async function failed'
);
```

### 6. `handleDatabaseError` - Database Error Handler

Provides user-friendly messages for common database errors.

```typescript
import { handleDatabaseError } from '@/lib/errorHandling';

// Usage
try {
  await databaseOperation();
} catch (error) {
  const message = handleDatabaseError(error);
  // message will be user-friendly like "This record already exists"
}
```

## Global Error Handling

The application has global error handlers configured in `main.tsx`:

1. **Window Error Handler** - Catches all uncaught errors
2. **Unhandled Promise Rejection Handler** - Catches all unhandled promise rejections

These handlers automatically log errors to the error logging system.

## React Query Error Handling

The `queryClient` is configured with default error handling:

- **Queries**: Retry once on failure (except for 4xx errors)
- **Mutations**: No retry, errors are logged and displayed to user
- **Database Errors**: Automatically converted to user-friendly messages

## Best Practices

1. **Always validate user input** before making API calls
2. **Use `safeURL`** for any URL construction
3. **Wrap mutations** with `safeMutate` or add try-catch blocks
4. **Handle errors in components** - don't rely only on global handlers
5. **Log errors** with context information for debugging

## Example: Complete Error Handling in a Component

```typescript
import { useState } from 'react';
import { safeAsync, safeMutate, safeURL } from '@/lib/errorHandling';
import { useCreateItem } from '@/hooks/useItems';

export const MyComponent = () => {
  const [url, setUrl] = useState('');
  const createItem = useCreateItem();

  const handleSubmit = async () => {
    // Validate URL
    const validUrl = safeURL(url);
    if (!validUrl) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid URL',
        variant: 'destructive'
      });
      return;
    }

    // Safe mutation
    const { data, error } = await safeMutate(
      createItem.mutateAsync,
      { url: validUrl.toString() },
      {
        successMessage: 'Item created successfully',
        errorMessage: 'Failed to create item'
      }
    );

    if (data) {
      // Handle success
    }
  };

  return (
    <div>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter URL"
      />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};
```

## Migration Guide

To add error handling to existing code:

1. **Replace bare `new URL()`** with `safeURL()`
2. **Wrap `mutateAsync()` calls** with try-catch or `safeMutate()`
3. **Add validation** before async operations
4. **Use TypeScript** to catch type errors at compile time
5. **Test error cases** to ensure proper handling
