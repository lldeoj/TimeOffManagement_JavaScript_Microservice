# Contributing Tests

## How to Add New Tests

### 1. Understanding Test Structure

Our test suite uses:
- **Jest** as the test framework
- **Supertest** for API testing
- **Mock objects** for dependencies
- **AAA Pattern** (Arrange, Act, Assert)

### 2. Creating a Unit Test

#### Template
```javascript
// tests/myFeature.test.js
import { MyService } from '../../src/myService.js';

// Mock dependencies
class MockDependency {
  async doSomething() {
    return { success: true };
  }
}

describe('MyService', () => {
  let service;
  let mockDependency;

  // Setup before each test
  beforeEach(() => {
    mockDependency = new MockDependency();
    service = new MyService(mockDependency);
  });

  // Cleanup after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Feature Group', () => {
    test('should do something specific', async () => {
      // ARRANGE - Set up test data
      const input = { value: 'test' };

      // ACT - Call the function
      const result = await service.myMethod(input);

      // ASSERT - Verify the result
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    test('should handle errors', async () => {
      // Test error scenarios
      await expect(service.myMethod(null))
        .rejects
        .toThrow('Expected error message');
    });
  });
});
```

### 3. Creating an Integration Test

#### Template for API Tests
```javascript
// tests/myEndpoint.integration.test.js
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('GET /api/my-endpoint', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  test('should return 200 with data', async () => {
    const response = await request(app)
      .get('/api/my-endpoint')
      .set('Authorization', 'Bearer token')
      .expect(200);

    expect(response.body).toBeDefined();
    expect(response.body.data).toEqual(expect.any(Array));
  });

  test('should return 400 with invalid data', async () => {
    const response = await request(app)
      .post('/api/my-endpoint')
      .send({ invalid: 'data' })
      .expect(400);

    expect(response.body.error).toBeDefined();
  });
});
```

### 4. Test Naming Convention

✅ **Good names** (descriptive, specific)
- `should create a time-off request with valid data`
- `should throw error if start_date is after end_date`
- `should authorize only the employee who created the request`

❌ **Bad names** (vague, unclear)
- `test create`
- `it works`
- `function test`

### 5. Common Test Patterns

#### Testing Async Operations
```javascript
test('should handle async operation', async () => {
  const result = await myAsyncFunction();
  expect(result).toBeDefined();
});
```

#### Testing Error Handling
```javascript
test('should throw specific error', async () => {
  await expect(myFunction(invalidInput))
    .rejects
    .toThrow('Specific error message');
});
```

#### Testing with Multiple Scenarios
```javascript
test.each([
  ['vacation', true],
  ['sick_leave', true],
  ['invalid_type', false]
])('should validate type %s: %s', (type, isValid) => {
  const result = validateType(type);
  expect(result).toBe(isValid);
});
```

#### Testing Mocked Functions
```javascript
test('should call dependency', async () => {
  const mockFn = jest.fn().mockResolvedValue({ id: 1 });
  const result = await service.doSomething(mockFn);
  
  expect(mockFn).toHaveBeenCalled();
  expect(mockFn).toHaveBeenCalledWith(expectedArgs);
});
```

#### Testing Database Operations
```javascript
test('should save to database', async () => {
  const mockCollection = new MockCollection();
  const service = new Service(mockCollection);
  
  await service.save({ name: 'test' });
  
  const saved = await mockCollection.findOne({ name: 'test' });
  expect(saved).toBeDefined();
});
```

### 6. File Naming Convention

- `*.test.js` - Test files
- Place in `tests/` directory next to source
- Match source file name when possible

Examples:
- `validation.js` → `tests/validation.test.js`
- `timeOffService.js` → `tests/timeOffService.test.js`
- `api.integration.js` → `tests/api.integration.test.js`

### 7. Directory Structure

```
publisher-api/
  src/
    ├── validation.js
    ├── timeOffService.js
    ├── rabbitmq.js
    └── database.js
  
  tests/
    ├── validation.test.js
    ├── timeOffService.test.js
    ├── api.integration.test.js
    └── rabbitmq.test.js  # (to be added)

  jest.config.js
  babel.config.js
```

### 8. Assertion Cheat Sheet

```javascript
// Equality
expect(value).toBe(expected);              // Strict equality (===)
expect(value).toEqual(expected);           // Deep equality
expect(value).toStrictEqual(expected);     // Strict deep equality

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(value).toBeGreaterThan(5);
expect(value).toBeLessThan(10);
expect(value).toBeCloseTo(3.14, 2);

// Strings
expect(value).toMatch(/pattern/);
expect(value).toContain('substring');
expect(value).toHaveLength(5);

// Arrays
expect([1, 2, 3]).toContain(2);
expect([1, 2, 3]).toHaveLength(3);
expect([1, 2, 3]).toEqual(expect.arrayContaining([2]));

// Objects
expect(obj).toHaveProperty('prop');
expect(obj).toHaveProperty('prop', value);
expect(obj).toMatchObject({ prop: value });

// Errors
expect(func).toThrow();
expect(func).toThrow(Error);
expect(func).toThrow('message');

// Mocks
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(1);
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
expect(mockFn).toHaveReturnedWith(value);
```

### 9. Adding Tests to Existing Feature

#### Example: Add test for new field in time-off request

1. **Update validation test**
```javascript
// In validation.test.js
test('should validate new field', async () => {
  const data = {
    // ... existing fields ...
    new_field: 'value'
  };
  
  const result = await validateRequest(data, timeOffRequestSchema);
  expect(result.new_field).toBe('value');
});
```

2. **Update service test**
```javascript
// In timeOffService.test.js
test('should preserve new field in created request', async () => {
  const data = {
    // ... existing data ...
    new_field: 'value'
  };
  
  const result = await service.createRequest(employeeId, data);
  expect(result.new_field).toBe('value');
});
```

3. **Update API test**
```javascript
// In api.integration.test.js
test('should accept new field in request body', async () => {
  const response = await request(app)
    .post('/api/time-off')
    .send({
      // ... existing fields ...
      new_field: 'value'
    })
    .expect(201);
  
  expect(response.body.data.new_field).toBe('value');
});
```

### 10. Running Tests During Development

```bash
# Watch specific file
npm run test:watch -- validation.test.js

# Run test matching pattern
npm test -- -t "conflict"

# Run in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### 11. Test Coverage Requirements

- **Target**: 80%+ coverage
- **Enforce**: Coverage thresholds in jest.config.js
- **Report**: Generated in coverage/ directory

### 12. Code Review Checklist for Tests

Before submitting PR with tests, ensure:

- [ ] Test files follow naming convention
- [ ] Tests are in correct directory
- [ ] Descriptive test names
- [ ] AAA pattern followed
- [ ] No hardcoded timeouts
- [ ] Proper error testing
- [ ] Mock dependencies used
- [ ] Coverage maintained/improved
- [ ] Tests pass locally
- [ ] Tests pass in Docker
- [ ] No console.logs left
- [ ] Comments explain complex logic

### 13. Common Mistakes to Avoid

❌ **Don't:**
```javascript
// Hardcoded waits
await new Promise(resolve => setTimeout(resolve, 1000));

// Dependent tests
test('second test depends on first');

// Testing implementation details
expect(internalVar).toBe(value);

// Ignoring errors
await function().catch(() => {});

// Testing multiple concerns
test('should create, update, and delete');
```

✅ **Do:**
```javascript
// Mock and assert
const mockFn = jest.fn();
expect(mockFn).toHaveBeenCalled();

// Independent tests
// Each test sets up its own data

// Testing behavior
expect(result.status).toBe('success');

// Proper error handling
await expect(function()).rejects.toThrow();

// Single responsibility
test('should create successfully');
test('should update successfully');
```

### 14. Integration with CI/CD

Tests automatically run on:
- Every push
- Every pull request
- Multiple Node versions

Ensure tests:
- Pass locally: `npm test`
- Pass in Docker: `docker-compose -f docker-compose.test.yml up`

### 15. Debugging Flaky Tests

If a test passes sometimes and fails other times:

1. Check for timing issues:
```javascript
// Don't use real timers
jest.useFakeTimers();
```

2. Check for async issues:
```javascript
// Ensure promises are awaited
await asyncFunction();
```

3. Check for mock state:
```javascript
// Clear mocks between tests
afterEach(() => jest.clearAllMocks());
```

---

## Example: Complete Test for New Feature

Let's say we're adding a "notification" feature:

### 1. Unit Test
```javascript
// tests/notification.test.js
import { NotificationService } from '../../src/notification.js';

class MockEmailProvider {
  async send(email, subject, body) {
    return { success: true, id: 'msg-001' };
  }
}

describe('NotificationService', () => {
  let service;
  let mockEmailProvider;

  beforeEach(() => {
    mockEmailProvider = new MockEmailProvider();
    service = new NotificationService(mockEmailProvider);
  });

  describe('sendApprovalNotification', () => {
    test('should send email to employee', async () => {
      const result = await service.sendApprovalNotification('emp-001@example.com');
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    test('should include request details', async () => {
      const spy = jest.spyOn(mockEmailProvider, 'send');
      
      await service.sendApprovalNotification('emp@example.com');
      
      expect(spy).toHaveBeenCalledWith(
        'emp@example.com',
        expect.stringContaining('approved'),
        expect.any(String)
      );
    });

    test('should throw on invalid email', async () => {
      await expect(service.sendApprovalNotification('invalid-email'))
        .rejects
        .toThrow('Invalid email');
    });
  });
});
```

### 2. Integration Test
```javascript
// tests/notification.integration.test.js
describe('Notification API', () => {
  test('POST /api/notify should send notification', async () => {
    const response = await request(app)
      .post('/api/notify')
      .send({
        employee_id: 'emp-001',
        type: 'approval'
      })
      .expect(200);

    expect(response.body.message).toContain('sent');
  });
});
```

---

**Happy Testing! 🎉**
