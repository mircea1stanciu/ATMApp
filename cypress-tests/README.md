# Cypress E2E Tests

This directory contains Cypress end-to-end tests for the UnifiedWork application, specifically focusing on the registration flow.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running on `http://localhost:8002`
- Frontend server running on `http://localhost:3003`

## Installation

The dependencies are already installed, but if you need to reinstall:

```bash
npm install
```

## Running Tests

### Interactive Mode (Cypress UI)

Open the Cypress Test Runner for interactive testing and debugging:

```bash
npm run cypress:open
```

This will launch the Cypress UI where you can:
- Select and run individual tests
- Watch tests run in real-time
- Time travel through test steps
- Debug failures easily

### Headless Mode (CLI)

Run all tests in headless mode (without UI):

```bash
npm run cypress:run
# or
npm test
```

### Run Specific Tests

Run only the registration tests:

```bash
npm run test:registration
```

### Browser-Specific Testing

Run tests in specific browsers:

```bash
# Chrome
npm run cypress:run:chrome

# Firefox
npm run cypress:run:firefox

# Edge
npm run cypress:run:edge
```

### Headed Mode

Run tests with browser UI visible (useful for debugging):

```bash
npm run test:headed

# or with specific browser
npm run test:chrome
```

## Test Structure

```
cypress-tests/
├── cypress/
│   ├── e2e/
│   │   └── registration.cy.js    # Registration flow tests
│   ├── fixtures/                 # Test data files (optional)
│   ├── support/
│   │   ├── commands.js           # Custom Cypress commands
│   │   └── e2e.js                # Global configuration
├── cypress.config.js             # Cypress configuration
├── package.json                  # Dependencies and scripts
└── README.md                     # This file
```

## Test Coverage

### Registration Flow Tests (`registration.cy.js`)

1. **Display Tests**
   - Registration page displays correctly
   - All form fields are visible

2. **Validation Tests**
   - Required field validation
   - Email format validation
   - Password strength validation
   - Organization slug format validation

3. **Success Tests**
   - Successful registration with valid data
   - Redirect after registration
   - Login with newly registered credentials

4. **Error Tests**
   - Duplicate organization slug prevention
   - Error messages display correctly

5. **UX Tests**
   - Password visibility toggle
   - Auto-generated slug from organization name

## Custom Commands

The following custom Cypress commands are available in `cypress/support/commands.js`:

### `cy.login(username, password, organizationSlug)`

Logs in a user with the provided credentials.

```javascript
cy.login('testuser', 'SecurePass123!', 'test-org')
```

### `cy.logout()`

Logs out the current user.

```javascript
cy.logout()
```

### `cy.fillForm(formData)`

Fills a form with the provided data object.

```javascript
cy.fillForm({
  username: 'testuser',
  email: 'test@example.com',
  password: 'SecurePass123!'
})
```

### `cy.waitForAPI(method, url)`

Sets up an intercept and waits for a specific API call.

```javascript
cy.waitForAPI('POST', '/api/organizations')
```

### `cy.generateTestData()`

Generates unique test data for each test run.

```javascript
cy.generateTestData().then(data => {
  // data.username, data.email, data.orgName, etc.
})
```

## Configuration

Main configuration is in `cypress.config.js`:

- **Base URL**: `http://localhost:3003` (frontend)
- **API URL**: `http://localhost:8002/api` (backend, available as `Cypress.env('apiUrl')`)
- **Video Recording**: Enabled for all test runs
- **Screenshots**: Taken automatically on test failures
- **Viewport**: 1280x720
- **Retries**: 2 retries in CI mode, 0 in local mode

## Test Data

Tests use the `cy.generateTestData()` command to create unique test data for each run. This includes:
- Unique usernames
- Unique email addresses
- Unique organization names and slugs
- Secure passwords

This prevents test failures due to duplicate data conflicts.

## Debugging

### Screenshots

Screenshots are automatically taken on test failures and saved to:
```
cypress/screenshots/
```

### Videos

All test runs are recorded and saved to:
```
cypress/videos/
```

### Interactive Debugging

Use `cy.pause()` in your tests to pause execution:

```javascript
cy.get('input[name="username"]').type('testuser')
cy.pause() // Execution will pause here
cy.get('button[type="submit"]').click()
```

### Console Logs

Use `cy.log()` for debugging output:

```javascript
cy.log('About to submit the form')
cy.get('button[type="submit"]').click()
```

## Best Practices

1. **Clean State**: Each test runs with a clean state (cookies and localStorage cleared)
2. **Unique Data**: Always use `cy.generateTestData()` for test data
3. **Explicit Waits**: Use `cy.wait()` for API calls instead of arbitrary timeouts
4. **Assertions**: Always verify the outcome of actions
5. **Screenshots**: Tests automatically take screenshots on failure
6. **Retries**: Tests retry twice in CI to handle flaky tests

## Troubleshooting

### Tests Failing with "Element not found"

- Make sure the frontend server is running on port 3003
- Check that the selectors in the test match the actual DOM elements
- Use `cy.pause()` to inspect the page state

### API Calls Timing Out

- Verify the backend server is running on port 8002
- Check network tab in Cypress UI to see actual API calls
- Increase timeout in `cy.wait()` if needed

### Tests Pass Locally but Fail in CI

- Check CI environment has correct environment variables
- Verify servers are started before tests run
- Consider increasing retry count for CI

### Database State Issues

- Tests may fail if previous test data exists
- Consider adding database cleanup before test runs
- Use unique test data with timestamps

## Adding New Tests

To add new tests:

1. Create a new test file in `cypress/e2e/`
2. Use the existing custom commands for common operations
3. Follow the existing test structure and naming conventions
4. Add test-specific scripts to `package.json` if needed

Example:

```javascript
describe('My New Feature', () => {
  beforeEach(() => {
    cy.visit('/my-feature')
  })

  it('should do something', () => {
    // Test code here
  })
})
```

## CI/CD Integration

To integrate with CI/CD pipelines:

```bash
# Install dependencies
npm install

# Run tests
npm test
```

Set environment variables in your CI:
- `CYPRESS_BASE_URL`: Frontend URL (if different from localhost:3003)
- `CYPRESS_API_URL`: Backend API URL (if different from localhost:8002)

## Resources

- [Cypress Documentation](https://docs.cypress.io/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Custom Commands](https://docs.cypress.io/api/cypress-api/custom-commands)

## Support

For issues or questions about these tests, please refer to the main project documentation or contact the development team.
