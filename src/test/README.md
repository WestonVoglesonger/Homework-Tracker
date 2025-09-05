# Testing Infrastructure

This directory contains the comprehensive testing infrastructure for the DueNorth application.

## Overview

The testing setup follows Test-Driven Development (TDD) principles with comprehensive coverage across:
- **Unit Tests**: Individual functions and components  
- **Integration Tests**: Cross-service workflows
- **API Tests**: HTTP endpoint testing
- **Component Tests**: React component rendering and interactions

## Directory Structure

```
src/test/
├── __tests__/
│   └── integration/          # Integration test suites
├── db-setup.ts              # Test database configuration
├── factories.ts             # Test data factories
├── utils.ts                 # Test utilities and helpers
└── README.md                # This file
```

## Test Database

### Setup
- Each test run creates an isolated PostgreSQL database
- Database name: `homework_test_${randomId}`
- Automatic schema migration via Prisma
- Automatic cleanup after tests complete

### Usage
```typescript
import { testDb } from '../test/db-setup';
import { testFactory } from '../test/factories';

// Database is automatically set up and torn down
const user = await testFactory.createUser();
```

## Test Data Factories

The `TestDataFactory` class provides consistent test data creation:

```typescript
import { testFactory } from '../test/factories';

// Create test user
const user = await testFactory.createUser({
  email: 'test@example.com',
  isAdmin: true
});

// Create test course
const course = await testFactory.createCourse(user.id, {
  name: 'Test Course',
  code: 'TEST101'
});

// Create test assignment
const assignment = await testFactory.createAssignment(user.id, course.id, {
  title: 'Test Assignment',
  status: 'NOT_SUBMITTED',
  dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
});

// Create complete user with data
const { user, courses, assignments } = await testFactory.createCompleteUserWithData();
```

## Test Utilities

Common testing utilities in `utils.ts`:

### API Testing
```typescript
import { createMockRequest, mockAuthenticatedSession } from '../test/utils';

const request = createMockRequest('POST', '/api/assignments', {
  title: 'New Assignment'
});

const session = mockAuthenticatedSession(testUser);
```

### Assertions
```typescript
import { assertRecordExists, assertSuccessResponse } from '../test/utils';

await assertRecordExists(() => 
  testDb.user.findUnique({ where: { id: userId } })
);

assertSuccessResponse(response, 201);
```

### Mocking
```typescript
import { mockCanvasApi, mockEmailService } from '../test/utils';

// Mock Canvas API responses
const mockFetch = mockCanvasApi();

// Mock email sending
const { mockSendEmail } = mockEmailService();
```

## Test Scripts

| Script | Purpose |
|--------|---------|
| `npm test` | Run all tests in watch mode |
| `npm run test:run` | Run all tests once |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:ui` | Open Vitest UI interface |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |
| `npm run test:services` | Run service layer tests |
| `npm run test:components` | Run component tests |
| `npm run test:api` | Run API route tests |

## Writing Tests

### Service Tests
```typescript
// src/services/__tests__/exampleService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { exampleService } from '../exampleService';
import { testFactory } from '../../test/factories';

describe('ExampleService', () => {
  let testUser: TestUser;

  beforeEach(async () => {
    testUser = await testFactory.createUser();
  });

  it('should create item successfully', async () => {
    const item = await exampleService.create(testUser.id, {
      name: 'Test Item'
    });

    expect(item.name).toBe('Test Item');
    expect(item.userId).toBe(testUser.id);
  });
});
```

### API Tests
```typescript
// src/app/api/__tests__/example.test.ts
import { describe, it, expect, vi } from 'vitest';
import { GET } from '../example/route';
import { createMockRequest, mockGetServerSession } from '../../../test/utils';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));

describe('/api/example', () => {
  it('should require authentication', async () => {
    mockGetServerSession(null);
    const request = createMockRequest('GET');

    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});
```

### Component Tests
```typescript
// src/app/components/__tests__/Example.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ExampleComponent } from '../ExampleComponent';

describe('ExampleComponent', () => {
  it('renders correctly', () => {
    render(<ExampleComponent title="Test" />);
    
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### Integration Tests
```typescript
// src/test/__tests__/integration/example-workflow.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { testFactory } from '../../factories';

describe('Example Workflow', () => {
  it('should handle complete workflow', async () => {
    // Test multiple services working together
    const user = await testFactory.createUser();
    // ... test workflow
  });
});
```

## Mocking Strategy

### Global Mocks (vitest.setup.ts)
- `next-auth/react` - Authentication hooks
- `next/router` - Navigation
- `@tanstack/react-query` - Data fetching
- `sonner` - Toast notifications

### Test-Specific Mocks
- Canvas API responses
- Email service
- External HTTP calls
- Database operations (when needed)

## Coverage Goals

- **Functions**: 80%+ coverage
- **Lines**: 80%+ coverage  
- **Branches**: 80%+ coverage
- **Statements**: 80%+ coverage

Coverage reports are generated in the `coverage/` directory.

## Best Practices

### 1. Test Isolation
- Each test gets a clean database state
- Mock external dependencies
- Use factory functions for consistent data

### 2. Descriptive Tests
```typescript
// Good
it('should create assignment with Canvas integration data', async () => {

// Bad  
it('should create assignment', async () => {
```

### 3. Arrange-Act-Assert Pattern
```typescript
it('should update assignment status', async () => {
  // Arrange
  const assignment = await testFactory.createAssignment(userId);
  
  // Act
  const updated = await assignmentService.update(userId, assignment.id, {
    status: 'SUBMITTED'
  });
  
  // Assert
  expect(updated.status).toBe('SUBMITTED');
});
```

### 4. Error Testing
```typescript
it('should throw error for invalid input', async () => {
  await expect(
    exampleService.create(userId, invalidData)
  ).rejects.toThrow('Validation failed');
});
```

### 5. Async Testing
```typescript
it('should handle async operations', async () => {
  const promise = exampleService.longRunningOperation();
  
  await expect(promise).resolves.toBe(expectedResult);
});
```

## Debugging Tests

### Using Vitest UI
```bash
npm run test:ui
```
Opens browser interface for debugging tests.

### Debug Mode
```bash
npm run test -- --inspect-brk
```

### Selective Testing
```bash
npm test -- assignment.test.ts
npm test -- --grep "should create"
```

## Environment Variables

Test environment automatically sets:
- `NODE_ENV=test`
- `POSTGRES_PRISMA_URL` - Test database URL
- `NEXTAUTH_SECRET` - Test secret
- `NEXTAUTH_URL` - Test URL

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running in dev container
- Check database URL in test setup
- Verify migrations are applied

### Mock Issues
- Clear mocks between tests with `vi.clearAllMocks()`
- Restore original implementations with `vi.restoreAllMocks()`
- Check mock implementation in `vitest.setup.ts`

### Test Timeout
- Increase timeout for slow operations:
```typescript
it('slow test', async () => {
  // test code
}, { timeout: 15000 }); // 15 seconds
```

## Continuous Integration

Tests run automatically on:
- Pull request creation
- Push to main branch
- Pre-deployment checks

CI Configuration:
- Runs all test suites
- Generates coverage reports
- Fails build on test failures
- Uploads coverage to reporting service
