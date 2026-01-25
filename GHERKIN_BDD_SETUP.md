# Cypress Gherkin/Cucumber BDD Configuration Guide

## Overview

You now have a **complete Gherkin/Cucumber BDD setup** for Cypress! This allows you to write tests in natural language that non-technical stakeholders can understand.

## What Was Installed

### Dependencies
```bash
@badeball/cypress-cucumber-preprocessor  # Gherkin parser and step definition runner
@bahmutov/cypress-esbuild-preprocessor   # Webpack replacement for faster bundling
```

### Configuration Files Modified
- `cypress.config.js` - Updated to support `.feature` files
- `package.json` - Added BDD-specific npm scripts

### New Project Structure
```
cypress/e2e/features/
├── login.feature          # Gherkin feature file (natural language)
└── login.steps.js         # Step definitions (implementation)
```

## File Structure Explained

### 1. Feature Files (`.feature`)
Located in `cypress/e2e/features/`

**Purpose**: Describe test scenarios in Gherkin language (Given-When-Then)

**Example**: `login.feature`
```gherkin
Feature: User Login
  As a user
  I want to log in with my credentials
  So that I can access my dashboard

  Background:
    Given I navigate to the login page

  Scenario: Admin logs in with valid credentials
    When I enter username "admin"
    And I enter password "admin123"
    And I click the Sign In button
    Then I should be redirected to "/admin"
    And I should see the dashboard
```

**Key Components**:
- `Feature`: Describes what feature is being tested
- `Background`: Steps that run before each scenario
- `Scenario`: Individual test case with steps
- `Given`: Initial state/precondition
- `When`: Action/interaction
- `Then`: Expected result/assertion
- `And`: Continuation of previous step

### 2. Step Definitions (`.steps.js`)
Located in `cypress/e2e/features/`

**Purpose**: Map Gherkin steps to Cypress commands

**Example**: `login.steps.js`
```javascript
import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor'

Given('I navigate to the login page', function() {
  cy.visit(fixtureData.routes.login)
})

When('I enter username {string}', function(username) {
  cy.get(`input[name="username"]`).type(username)
})

Then('I should be redirected to {string}', function(path) {
  cy.url().should('include', path)
})
```

**Key Points**:
- Step definition name must exactly match the feature file step
- `{string}` captures text from feature file
- Function receives captured values as parameters
- Can use any Cypress commands inside

## Running Gherkin Tests

### Via NPM Scripts
```bash
# Run all Gherkin feature tests
npm run test:bdd:all

# Run only login feature tests
npm run test:bdd:login

# Run in headed mode (browser visible)
npm run test:bdd:headed

# Run all tests (both .js and .feature)
npm run cypress:run
```

### Via Cypress CLI
```bash
# Run specific feature file
npx cypress run --spec 'cypress/e2e/features/login.feature'

# Run all features
npx cypress run --spec 'cypress/e2e/features/**/*.feature'

# Open interactive test runner
npx cypress open
```

## Your Current Features

### Login Feature (`login.feature`)
**Scenarios Included**:
1. ✅ Admin logs in with valid credentials
2. ✅ User login fails with invalid credentials
3. ✅ Required field validation
4. ✅ User navigates to registration page
5. ✅ User sees demo credentials
6. ✅ User navigates back to home
7. ✅ Footer is visible with all sections

**Total**: 7 scenarios from 1 feature file

## Gherkin Best Practices

### 1. Write Scenarios for Users, Not Testers
✅ Good:
```gherkin
Scenario: Customer completes purchase with valid payment
  Given I have items in my cart
  When I proceed to checkout
  And I enter valid payment details
  Then my order should be confirmed
```

❌ Bad:
```gherkin
Scenario: Test payment flow
  Given test data
  When click button
  And type stuff
  Then check result
```

### 2. Use Clear, Business-Readable Language
✅ Good:
```gherkin
When I enter username "admin"
Then I should see the dashboard
```

❌ Bad:
```gherkin
When I call cy.get('input').type('admin')
Then element should contain text
```

### 3. Keep Scenarios Independent
```gherkin
# ✅ Good - Each scenario stands alone
Scenario: User logs in successfully
  Given I navigate to the login page
  When I enter valid credentials
  Then I should see the dashboard

Scenario: User sees validation error
  Given I navigate to the login page
  When I submit empty form
  Then I should see validation error
```

### 4. Use Background for Common Setup
```gherkin
# ✅ Good - Reduces repetition
Background:
  Given I navigate to the login page

Scenario: Valid login
  When I enter valid credentials
  Then I should see dashboard

Scenario: Invalid login
  When I enter invalid credentials
  Then I should see error message
```

### 5. Use Data-Driven Tests with Examples
```gherkin
Scenario Outline: Login with different user types
  Given I navigate to the login page
  When I enter username "<username>"
  And I enter password "<password>"
  Then I should see "<result>"

  Examples:
    | username | password  | result    |
    | admin    | admin123  | dashboard |
    | user     | user123   | home      |
    | invalid  | wrong     | error     |
```

## Step Definition Patterns

### 1. Simple Steps (No Parameters)
```javascript
Given('I navigate to the login page', function() {
  cy.visit('/login')
})
```

### 2. Steps with String Parameters
```javascript
When('I enter username {string}', function(username) {
  cy.get('input[name="username"]').type(username)
})
```

### 3. Steps with Multiple Parameters
```javascript
When('I enter {string} and {string}', function(username, password) {
  cy.get('input[name="username"]').type(username)
  cy.get('input[name="password"]').type(password)
})
```

### 4. Steps with Numeric Parameters
```javascript
Then('I should see {int} results', function(count) {
  cy.get('.result').should('have.length', count)
})
```

### 5. Steps with Data Tables
```gherkin
Scenario: Fill form with multiple values
  Given I have the following data:
    | field    | value              |
    | username | john.doe           |
    | email    | john@example.com   |
    | phone    | +1-555-123-4567    |
```

```javascript
import { DataTable } from '@badeball/cypress-cucumber-preprocessor'

Given('I have the following data:', function(table: DataTable) {
  const data = table.rowsHash()
  Object.entries(data).forEach(([field, value]) => {
    cy.get(`input[name="${field}"]`).type(value)
  })
})
```

## Creating New Feature Files

### Step 1: Create Feature File
Create `cypress/e2e/features/registration.feature`:
```gherkin
Feature: User Registration
  As a new user
  I want to register for an account
  So that I can access the platform

  Scenario: User registers with valid credentials
    Given I navigate to the registration page
    When I fill in all required fields
    And I click the Register button
    Then I should be registered successfully
    And I should be logged in
```

### Step 2: Add Step Definitions
Add to `cypress/e2e/features/registration.steps.js`:
```javascript
import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor'

Given('I navigate to the registration page', function() {
  cy.visit('/register')
})

When('I fill in all required fields', function() {
  cy.get('input[name="username"]').type('newuser')
  cy.get('input[name="email"]').type('newuser@example.com')
  // ... more fields
})

// ... more steps
```

### Step 3: Run Tests
```bash
npm run test:bdd:all
```

## Advanced Features

### Tagging Scenarios
```gherkin
@critical @login
Scenario: Admin login with valid credentials
  Given I navigate to the login page
  When I enter valid credentials
  Then I should see the dashboard
```

Run only tagged scenarios:
```bash
npx cypress run --spec 'cypress/e2e/features/**/*.feature' --env tags="@critical"
```

### Scenario Outline (Data-Driven)
```gherkin
Scenario Outline: User login
  Given I navigate to the login page
  When I enter username "<username>"
  And I enter password "<password>"
  Then I should see "<result>"

  Examples:
    | username | password  | result    |
    | admin    | admin123  | dashboard |
    | user     | user123   | home      |
```

## Debugging Gherkin Tests

### 1. Use cy.debug()
```javascript
Then('I should see the dashboard', function() {
  cy.contains(/dashboard/i).debug().should('be.visible')
})
```

### 2. Use Cypress Debugger
```javascript
Then('I should see the dashboard', function() {
  debugger
  cy.contains(/dashboard/i).should('be.visible')
})
```

### 3. Check Step Implementation
Feature file → Cucumber preprocessor → Step definitions → Cypress commands

If a step isn't matching:
- Check exact text in feature file matches step definition
- Parameter names and types must match
- Look for typos or case sensitivity

## File Structure Overview

```
cypress-tests/
├── cypress/
│   ├── e2e/
│   │   ├── features/
│   │   │   ├── login.feature         # Gherkin scenarios
│   │   │   └── login.steps.js        # Step implementations
│   │   ├── TC01_LoginAdmin.cy.js     # Traditional test (still works)
│   │   ├── admin-registration.cy.js
│   │   └── registration.cy.js
│   ├── fixtures/
│   │   └── testData.json             # Test data
│   ├── support/
│   │   ├── commands.js               # Custom commands
│   │   └── e2e.js                    # Global config
│   └── videos/                       # Test recordings
├── cypress.config.js                 # Cucumber configured here
├── package.json                      # New BDD scripts added
└── README.md
```

## Migration Path

### Phase 1: ✅ Complete (Current)
- Gherkin/Cucumber installed
- Configuration complete
- Login feature and steps created
- npm scripts added

### Phase 2: (Optional)
- Create registration feature
- Create dashboard feature
- Create admin features

### Phase 3: (Optional)
- Create HTML reports
- Integrate with CI/CD
- Performance testing scenarios

## Advantages of This Setup

| Feature | Benefit |
|---------|---------|
| **Gherkin Language** | Non-technical stakeholders can understand tests |
| **Scenario Outlines** | Data-driven testing without code duplication |
| **Background** | Common setup runs before each scenario |
| **Reusable Steps** | Write once, use in many scenarios |
| **Clear Separation** | Feature files separate from implementation |
| **Business Alignment** | Tests read like business requirements |
| **Easy Maintenance** | Update Gherkin = update documentation and test |

## Resources

- [Cypress Cucumber Preprocessor](https://github.com/badeball/cypress-cucumber-preprocessor)
- [Gherkin Language Reference](https://cucumber.io/docs/gherkin/)
- [BDD Best Practices](https://cucumber.io/docs/bdd/)
- [Cypress Documentation](https://docs.cypress.io/)
