# Smoke Tests

Smoke tests provide quick health checks for all major routes and API endpoints.

## What Are Smoke Tests?

Smoke tests are lightweight tests that verify:
- Routes are accessible (no 500 errors)
- Pages render without crashing
- Critical UI elements are present
- API endpoints are responsive
- Database connections work

## Running Smoke Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all smoke tests
npm run test:smoke

# Run with UI mode (interactive)
npm run test:smoke:ui

# Run specific test file
npx playwright test routes.smoke.test.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Generate HTML report
npx playwright show-report
```

## Test Structure

### Route Tests (`routes.smoke.test.ts`)
- **Public routes**: Auth pages
- **Protected routes**: Dashboard, Tasks, etc.
- **Admin routes**: Admin panel pages
- **404 handling**: Non-existent routes

### API Health Tests (`api-health.smoke.test.ts`)
- Database table queries
- Edge function availability
- Supabase connection

## CI/CD Integration

Add to your CI/CD pipeline:

```yaml
# .github/workflows/smoke-tests.yml
name: Smoke Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:smoke
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Authentication in Tests

For routes that require authentication:

```typescript
// auth.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/auth');
  await page.fill('[name="email"]', process.env.TEST_USER_EMAIL!);
  await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForURL('/');
  
  // Save authentication state
  await page.context().storageState({ path: 'auth.json' });
});

// Use in tests
test.use({ storageState: 'auth.json' });
```

## Best Practices

1. **Keep tests fast** - Smoke tests should complete in < 5 minutes
2. **Test breadth, not depth** - Cover all routes but don't test every feature
3. **Use realistic paths** - Test actual user navigation flows
4. **Check for errors** - Verify no console errors or warnings
5. **Monitor response times** - Alert if pages take too long to load

## Interpreting Results

✅ **All Pass**: All routes and APIs are healthy
⚠️ **Some Fail**: Specific features/routes broken
❌ **Many Fail**: System-wide issue (check database, auth)

## Monitoring Thresholds

Set alerts for:
- Any test failures
- Response times > 3 seconds
- Error rate > 5%
