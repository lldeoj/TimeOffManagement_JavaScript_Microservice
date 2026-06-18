# Test Quick Reference

## Quick Start (30 seconds)

### Run All Tests
```bash
# Option 1: Local
make test

# Option 2: Docker
make test-docker

# Option 3: Direct command
npm test
```

### Check Test Coverage
```bash
make test-coverage
# Open publisher-api/coverage/index.html or consumer-service/coverage/index.html
```

## Command Cheat Sheet

### Local Testing
```bash
npm test                      # Run all tests
npm run test:watch           # Watch mode
npm run test:unit            # Unit tests only
npm run test:integration     # Integration tests only
npm test -- -t "test name"   # Run specific test
npm test -- validation.test.js # Run specific file
```

### Docker Testing
```bash
make test-docker             # Run tests in Docker
docker-compose -f docker-compose.test.yml up --build
docker-compose -f docker-compose.test.yml run publisher-tests
```

### Coverage
```bash
make test-coverage           # Generate coverage reports
npm test -- --coverage
npm test -- --collectCoverageFrom="src/**/*.js"
```

### Watch Mode
```bash
make test-watch              # Start watching
npm run test:watch -- validation.test.js  # Watch specific file
```

## File Structure for Tests

```
publisher-api/
  tests/
    ├── validation.test.js        # ✓ Input validation
    ├── timeOffService.test.js    # ✓ Business logic
    └── api.integration.test.js   # ✓ API endpoints

consumer-service/
  tests/
    └── timeOffProcessor.test.js  # ✓ Message processing

.github/workflows/
  ├── tests.yml               # ✓ Unit test CI/CD
  └── docker.yml              # ✓ Docker test CI/CD
```

## Test Coverage Summary

| Component | Tests | Coverage Target |
|-----------|-------|-----------------|
| Publisher API | 40+ | 80% |
| Consumer Service | 15+ | 75% |
| **Total** | **55+** | **78%** |

## Common Commands

| Task | Command |
|------|---------|
| Run all tests | `make test` |
| Run in Docker | `make test-docker` |
| Generate coverage | `make test-coverage` |
| Watch mode | `make test-watch` |
| Unit tests | `make test-unit` |
| Integration tests | `make test-integration` |
| Help | `make help` |

## Environment Variables

```bash
# Set test environment
NODE_ENV=test

# For debugging
DEBUG=*

# For coverage threshold
COVERAGE_THRESHOLD=80
```

## Exit Codes

- `0` - All tests passed ✓
- `1` - Tests failed ✗
- `2` - Tests timeout

## Performance Tips

```bash
# Run tests in parallel (faster)
npm test -- --maxWorkers=4

# Run only changed tests
npm test -- --onlyChanged

# Run specific test pattern
npm test -- --testNamePattern="validation"

# Skip coverage (faster)
npm test -- --no-coverage
```

## Debugging

```bash
# Verbose output
npm test -- --verbose

# Show test names
npm test -- --listTests

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Increase timeout
npm test -- --testTimeout=20000
```

## CI/CD Integration

### GitHub Actions
Tests run automatically on:
- Push to main/develop
- Pull requests
- Multiple Node.js versions (18.x, 20.x)

### Local Pre-commit
```bash
#!/bin/bash
npm test
```

## Coverage Report URLs

After running tests with coverage:
- **Publisher API**: `file://$(pwd)/publisher-api/coverage/index.html`
- **Consumer Service**: `file://$(pwd)/consumer-service/coverage/index.html`

## Docker Commands

```bash
# Build test images
docker-compose -f docker-compose.test.yml build

# Run tests
docker-compose -f docker-compose.test.yml up

# Run specific service
docker-compose -f docker-compose.test.yml run publisher-tests

# View logs
docker-compose -f docker-compose.test.yml logs -f

# Cleanup
docker-compose -f docker-compose.test.yml down
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Tests timeout | `npm test -- --testTimeout=20000` |
| Out of memory | `NODE_OPTIONS="--max-old-space-size=2048" npm test` |
| Docker build fails | `docker-compose -f docker-compose.test.yml down -v && docker-compose build` |
| Coverage not generated | `rm -rf coverage && npm test -- --coverage` |

## Test Examples

### Creating a Test
```javascript
test('should validate email', () => {
  const result = validateEmail('test@example.com');
  expect(result).toBe(true);
});
```

### Async Test
```javascript
test('should fetch data', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});
```

### Error Handling
```javascript
test('should throw error', async () => {
  await expect(badFunction()).rejects.toThrow('error message');
});
```

## Best Practices

✅ Run tests before committing
✅ Use watch mode during development
✅ Aim for 80%+ coverage
✅ Test edge cases
✅ Mock external dependencies
✅ Keep tests focused
✅ Use descriptive names

---

**For more details, see:**
- [TESTING.md](TESTING.md) - Comprehensive testing guide
- [TEST_SUMMARY.md](TEST_SUMMARY.md) - Test summary and metrics
