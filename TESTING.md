# Running Tests Guide

## Quick Start

### Run all tests with Docker Compose
```bash
cd time-off-microservice
docker-compose -f docker-compose.test.yml up
```

### Run specific service tests
```bash
# Publisher API tests only
docker-compose -f docker-compose.test.yml run publisher-tests

# Consumer Service tests only
docker-compose -f docker-compose.test.yml run consumer-tests
```

### Run tests locally
```bash
# Publisher API tests
cd publisher-api
npm install
npm test

# Consumer Service tests
cd consumer-service
npm install
npm test
```

## Test Coverage

### Available test scripts
```bash
# Run all tests with coverage
npm test

# Run specific test suites
npm run test:unit          # Unit tests only (Publisher API)
npm run test:integration   # Integration tests only (Publisher API)

# Watch mode
npm run test:watch
```

## Test Structure

### Publisher API Tests
- **validation.test.js** - Input validation with Joi
  - Valid request validation
  - Invalid requests handling
  - Update schema validation
  - Error messages

- **timeOffService.test.js** - Business logic tests
  - Create request operations
  - List requests with filters
  - Conflict detection
  - Update operations
  - Delete operations
  - Authorization checks

- **api.integration.test.js** - API endpoint tests
  - Health check endpoint
  - Create request endpoint
  - List requests endpoint
  - Get specific request endpoint
  - Update request endpoint
  - Delete request endpoint
  - Error handling

### Consumer Service Tests
- **timeOffProcessor.test.js** - Message processing
  - Handle CREATE action
  - Handle UPDATE action
  - Handle DELETE action
  - Error handling
  - Audit trail creation
  - Processing logs

## Test Coverage Report

After running tests, coverage reports are available:

### Publisher API
```bash
open publisher-api/coverage/index.html
```

### Consumer Service
```bash
open consumer-service/coverage/index.html
```

## Docker Commands

### Build test images
```bash
docker-compose -f docker-compose.test.yml build
```

### Run tests with verbose output
```bash
docker-compose -f docker-compose.test.yml up --build
```

### Run specific test file
```bash
docker-compose -f docker-compose.test.yml run publisher-tests npm test -- validation.test.js
```

### Run with debugging
```bash
docker-compose -f docker-compose.test.yml run publisher-tests npm test -- --verbose
```

### Keep containers running
```bash
docker-compose -f docker-compose.test.yml up --detach
```

### View test output
```bash
docker-compose -f docker-compose.test.yml logs -f publisher-tests
docker-compose -f docker-compose.test.yml logs -f consumer-tests
```

### Clean up
```bash
docker-compose -f docker-compose.test.yml down
```

## Test Execution Flow

### Local Execution
1. Install dependencies: `npm install`
2. Run tests: `npm test`
3. View coverage: `npm test` generates coverage reports
4. Results displayed in terminal

### Docker Execution
1. Build images: `docker-compose -f docker-compose.test.yml build`
2. Run tests: `docker-compose -f docker-compose.test.yml up`
3. Coverage mounted to local volumes
4. Results shown in container logs and coverage directory

## Continuous Integration

### GitHub Actions Example
```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/setup-buildx-action@v2
      - run: docker-compose -f docker-compose.test.yml up
```

## Test Metrics

### Target Coverage
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

### Current Tests Count
- Publisher API: 40+ test cases
- Consumer Service: 15+ test cases
- Total: 55+ test cases

## Debugging Failed Tests

### 1. Check test output
```bash
npm test -- --verbose
```

### 2. Run specific test file
```bash
npm test -- validation.test.js
```

### 3. Run single test
```bash
npm test -- -t "should create a new time-off request"
```

### 4. Enable debugging
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Adding New Tests

### Template for new test file
```javascript
describe('Feature Name', () => {
  describe('Specific functionality', () => {
    test('should do something', () => {
      // Arrange
      const data = { };
      
      // Act
      const result = doSomething(data);
      
      // Assert
      expect(result).toBeDefined();
    });
  });
});
```

## Test Best Practices

✅ **Do:**
- Use descriptive test names
- Test one thing per test
- Use beforeEach/afterEach for setup/teardown
- Mock external dependencies
- Test error scenarios
- Use meaningful assertions

❌ **Don't:**
- Make tests dependent on each other
- Use real databases/APIs in unit tests
- Test multiple concerns in one test
- Use hardcoded delays (setTimeout)
- Skip tests without reason

## Performance Optimization

### Run tests in parallel
```bash
npm test -- --maxWorkers=4
```

### Run specific tests
```bash
npm test -- --testNamePattern="validation"
```

### Only changed tests
```bash
npm test -- --onlyChanged
```

## Troubleshooting

### Tests timeout
```bash
npm test -- --testTimeout=20000
```

### Memory issues
```bash
docker-compose -f docker-compose.test.yml run -e NODE_OPTIONS="--max-old-space-size=2048" publisher-tests
```

### Permission denied
```bash
sudo chown -R $(whoami) ./publisher-api/coverage
sudo chown -R $(whoami) ./consumer-service/coverage
```

## Integration with Development

### Run tests on file changes
```bash
npm run test:watch
```

### Pre-commit testing
```bash
# Add to .git/hooks/pre-commit
npm test
```

---

**Happy Testing! 🧪**
