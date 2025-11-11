# Contract Tests

Contract tests validate that API endpoints and database operations maintain expected schemas and data contracts.

## What Are Contract Tests?

Contract tests verify:
- Request/response data structures
- Field types and constraints
- Enum value restrictions
- Length limits and validations
- Required vs optional fields
- Relationship integrity

## Running Contract Tests

```bash
# Run all contract tests
npm run test:contracts

# Run with coverage
npm run test:contracts -- --coverage

# Run specific contract test
npm run test:contracts task.contract.test.ts

# Watch mode for development
npm run test:contracts -- --watch
```

## Writing New Contract Tests

1. **Define the schema** in `src/schemas/apiSchemas.ts`
2. **Create a test file** in `src/tests/contracts/[feature].contract.test.ts`
3. **Test CRUD operations** with schema validation
4. **Test edge cases** like invalid enums, length violations
5. **Test permissions** for role-based access

### Example Contract Test

```typescript
import { describe, it, expect } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { myFeatureSchema } from '@/schemas/apiSchemas';

describe('My Feature Contract Tests', () => {
  it('should return valid schema', async () => {
    const { data, error } = await supabase
      .from('my_table')
      .select('*')
      .single();

    expect(error).toBeNull();
    const validation = myFeatureSchema.safeParse(data);
    expect(validation.success).toBe(true);
  });
});
```

## Best Practices

1. **Always validate against schemas** - Don't just check if data exists
2. **Test both success and failure cases** - Invalid inputs should fail gracefully
3. **Keep tests isolated** - Create and cleanup test data
4. **Use descriptive test names** - Clearly state what's being validated
5. **Test boundary conditions** - Min/max lengths, edge values
6. **Verify enum constraints** - Ensure only valid values are accepted

## Schema Updates

When updating database schemas:
1. Update the Zod schema in `apiSchemas.ts`
2. Update corresponding contract tests
3. Run tests to ensure no breaking changes
4. Update documentation if needed
