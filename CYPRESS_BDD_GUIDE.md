# Cypress BDD (Behavior-Driven Development) Guide

## Overview

Yes, **Cypress fully supports BDD!** There are multiple approaches to implement BDD with Cypress:

### 1. **Native BDD Syntax (Recommended for Simple Tests)**
Using Cypress's built-in `describe()` and `it()` blocks with Given-When-Then structure.

### 2. **Gherkin-Style BDD**
Using cucumber-like syntax with feature files and step definitions.

### 3. **Custom BDD Framework**
Building your own BDD wrapper around Cypress commands.

---

## Approach 1: Native BDD Syntax (What We Implemented)

This approach uses standard Cypress syntax but structures tests following BDD principles.

### Structure:
```javascript
describe('Feature: User Login', () => {
  describe('Scenario: Valid credentials', () => {
    it('Given a user visits the login page', () => {
      // Setup phase
    })
    
    it('When they enter valid credentials', () => {
      // Action phase
    })
    
    it('Then they should see the dashboard', () => {
      // Assertion phase
    })
  })
})
```

### Benefits:
- ✅ No additional dependencies
- ✅ Native Cypress support
- ✅ Clear test organization
- ✅ Easy to read for non-technical stakeholders
- ✅ Full debugging capabilities

### Drawbacks:
- ❌ Each step is a separate test (generates more test results)
- ❌ Slightly more verbose
- ❌ Requires discipline in following Given-When-Then pattern

---

## Approach 2: Gherkin-Style BDD (Most Professional)

For true Gherkin syntax support, install the Cucumber preprocessor:

```bash
npm install --save-dev @badeball/cypress-cucumber-preprocessor @bahmutov/cypress-esbuild-preprocessor
```

### Example Feature File (`.feature`)

Create `cypress/e2e/features/login.feature`:

```gherkin
Feature: Admin Login
  As a user
  I want to log in with my credentials
  So that I can access my dashboard

  Scenario: Login with valid credentials
    Given the user navigates to the login page
    When the user enters username "admin"
    And the user enters password "admin123"
    And the user clicks the Sign In button
    Then the user should be redirected to "/admin"
    And the dashboard should be visible

  Scenario: Login fails with invalid credentials
    Given the user navigates to the login page
    When the user enters username "invaliduser"
    And the user enters password "wrongpassword"
    And the user clicks the Sign In button
    Then an error message should appear
    And the user remains on the login page

  Scenario: Required fields validation
    Given the user navigates to the login page
    When the user attempts to submit an empty form
    Then the form should show validation errors
    And the user remains on the login page
```

### Step Definitions File

Create `cypress/e2e/features/login.steps.ts`:

```typescript
import { Given, When, Then, And } from '@badeball/cypress-cucumber-preprocessor'

Given('the user navigates to the login page', () => {
  cy.fixture('testData').then(data => {
    cy.visit(data.routes.login)
  })
})

When('the user enters username {string}', (username: string) => {
  cy.get('input[name="username"]').type(username)
})

When('the user enters password {string}', (password: string) => {
  cy.get('input[name="password"]').type(password)
})

When('the user clicks the Sign In button', () => {
  cy.get('button[type="submit"]').click()
})

Then('the user should be redirected to {string}', (url: string) => {
  cy.url().should('include', url, { timeout: 10000 })
})

Then('the dashboard should be visible', () => {
  cy.contains(/dashboard|admin|welcome/i).should('be.visible')
})

Then('an error message should appear', () => {
  cy.contains(/login failed|invalid|incorrect|error/i, { timeout: 5000 }).should('be.visible')
})

Then('the user remains on the login page', () => {
  cy.url().should('include', '/login')
})

Then('the form should show validation errors', () => {
  cy.get('input[name="username"]:invalid').should('exist')
})

When('the user attempts to submit an empty form', () => {
  cy.get('button[type="submit"]').click()
})

Then('the user remains on the login page', () => {
  cy.url().should('include', '/login')
})
```

---

## Approach 3: Custom BDD Helper Functions

Create reusable BDD functions to reduce boilerplate:

### `cypress/support/bdd.ts`

```typescript
interface GivenWhenThen {
  given: (description: string, fn: () => void) => void
  when: (description: string, fn: () => void) => void
  then: (description: string, fn: () => void) => void
  and: (description: string, fn: () => void) => void
}

export const bdd = (): GivenWhenThen => {
  let testIndex = 0

  return {
    given: (description: string, fn: () => void) => {
      testIndex++
      it(`Given ${description}`, fn)
    },
    when: (description: string, fn: () => void) => {
      it(`When ${description}`, fn)
    },
    then: (description: string, fn: () => void) => {
      it(`Then ${description}`, fn)
    },
    and: (description: string, fn: () => void) => {
      it(`And ${description}`, fn)
    }
  }
}
```

### Usage Example

```typescript
import { bdd } from '../support/bdd'

describe('Feature: Admin Login', () => {
  const { given, when, then, and } = bdd()
  let fixtureData

  before(() => {
    cy.fixture('testData').then(data => {
      fixtureData = data
    })
  })

  describe('Scenario: Valid credentials', () => {
    given('a user is on the login page', () => {
      cy.visit(fixtureData.routes.login)
    })

    when('they enter username admin', () => {
      cy.get('input[name="username"]').type('admin')
    })

    and('they enter password admin123', () => {
      cy.get('input[name="password"]').type('admin123')
    })

    when('they click Sign In', () => {
      cy.get('button[type="submit"]').click()
    })

    then('they should see the dashboard', () => {
      cy.url().should('include', '/admin')
    })
  })
})
```

---

## Comparison Table

| Feature | Native BDD | Gherkin/Cucumber | Custom Helper |
|---------|-----------|------------------|---------------|
| Setup Complexity | ⭐ (None) | ⭐⭐⭐ (Moderate) | ⭐⭐ (Low) |
| Readability | ⭐⭐⭐ (Good) | ⭐⭐⭐⭐⭐ (Excellent) | ⭐⭐⭐⭐ (Very Good) |
| Non-tech Stakeholder Understanding | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Dependencies | 0 | 2 | 0 |
| Execution Speed | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| IDE Support | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Debugging | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## Best Practices for BDD in Cypress

### 1. **One Assertion Per Test** (Ideally)
```javascript
// ✅ Good
it('Given user navigates to login', () => {
  cy.visit('/login')
  cy.url().should('include', '/login')
})

// ⚠️ Too many assertions
it('Given user navigates to login', () => {
  cy.visit('/login')
  cy.url().should('include', '/login')
  cy.get('form').should('be.visible')
  cy.contains('Username').should('be.visible')
  cy.contains('Password').should('be.visible')
})
```

### 2. **Clear Naming Convention**
```javascript
// ✅ Clear and specific
describe('Feature: User Authentication', () => {
  describe('Scenario: Login with valid admin credentials', () => {
    it('Given a user is on the login page', () => {})
    it('When they submit valid admin credentials', () => {})
    it('Then they are redirected to the admin dashboard', () => {})
  })
})

// ❌ Vague
describe('Login Tests', () => {
  it('test login', () => {})
})
```

### 3. **Share Context Between Steps**
```javascript
describe('Scenario: Complete login flow', () => {
  let loginData

  before(() => {
    cy.fixture('testData').then(data => {
      loginData = data
    })
  })

  it('Given valid credentials', () => {
    cy.visit(loginData.routes.login)
  })

  it('When logging in', () => {
    cy.get('input[name="username"]').type(loginData.validCredentials.username)
    cy.get('input[name="password"]').type(loginData.validCredentials.password)
    cy.get('button[type="submit"]').click()
  })

  it('Then user sees dashboard', () => {
    cy.url().should('include', '/admin')
  })
})
```

### 4. **Use Custom Commands for Common BDD Steps**
```typescript
// cypress/support/commands.ts
Cypress.Commands.add('loginAs', (role: string) => {
  cy.fixture('testData').then(data => {
    const credentials = data.credentials[role]
    cy.visit(data.routes.login)
    cy.get('input[name="username"]').type(credentials.username)
    cy.get('input[name="password"]').type(credentials.password)
    cy.get('button[type="submit"]').click()
  })
})

// In tests:
it('When admin logs in', () => {
  cy.loginAs('admin')
})
```

---

## Our Current Implementation

We've created `TC01_LoginAdmin_BDD.cy.js` which uses **Approach 1: Native BDD Syntax**.

### Advantages for Your Project:
- ✅ No additional dependencies (already using Cypress)
- ✅ Clear scenario organization
- ✅ Easy to extend
- ✅ Maintains all existing commands and fixtures
- ✅ Works with your current Cypress setup

### Run the BDD Tests:
```bash
npm run cypress:run -- --spec 'cypress/e2e/TC01_LoginAdmin_BDD.cy.js'
```

---

## Recommendation

For your project, I recommend:

1. **Short-term**: Use **Approach 1 (Native BDD)** - it's already implemented and requires no changes to your setup
2. **Medium-term**: Consider **Approach 2 (Gherkin)** if you need non-technical stakeholders to write tests
3. **Always**: Combine BDD structure with your existing custom commands and fixtures

---

## Resources

- [Cypress Official Docs - BDD](https://docs.cypress.io/)
- [Cucumber JavaScript](https://github.com/badeball/cypress-cucumber-preprocessor)
- [BDD Best Practices](https://cucumber.io/docs/bdd/)
- [Gherkin Language Reference](https://cucumber.io/docs/gherkin/)
