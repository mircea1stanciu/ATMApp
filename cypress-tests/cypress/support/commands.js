// ***********************************************
// Custom Cypress Commands
// ***********************************************

/**
 * Login command
 * @example cy.login('username', 'password', 'org-slug')
 */
Cypress.Commands.add('login', (username, password, organizationSlug = null) => {
  cy.visit('/login')
  
  // Fill in credentials
  cy.get('input[name="username"]').type(username)
  cy.get('input[name="password"]').type(password)
  
  // Fill organization slug if provided
  if (organizationSlug) {
    cy.get('input[name="organization_slug"]').then($input => {
      if ($input.length > 0) {
        cy.wrap($input).type(organizationSlug)
      }
    })
  }
  
  // Submit form
  cy.get('button[type="submit"]').click()
  
  // Wait for redirect
  cy.url().should('match', /\/(admin|dashboard)/)
})

/**
 * Logout command
 * @example cy.logout()
 */
Cypress.Commands.add('logout', () => {
  // Try to find and click logout button
  cy.get('body').then($body => {
    if ($body.find('[data-testid="user-menu"]').length > 0) {
      cy.get('[data-testid="user-menu"]').click()
      cy.contains('button', /logout|sign out/i).click()
    } else {
      cy.contains('button', /logout|sign out/i).click()
    }
  })
  
  cy.url().should('include', '/login')
})

/**
 * Fill form command
 * @example cy.fillForm({ username: 'test', email: 'test@example.com' })
 */
Cypress.Commands.add('fillForm', (formData) => {
  Object.keys(formData).forEach(key => {
    cy.get(`input[name="${key}"], select[name="${key}"], textarea[name="${key}"]`)
      .clear()
      .type(formData[key])
  })
})

/**
 * Wait for API call
 * @example cy.waitForAPI('POST', '/api/organizations')
 */
Cypress.Commands.add('waitForAPI', (method, url) => {
  cy.intercept(method, url).as('apiCall')
  cy.wait('@apiCall')
})

/**
 * Generate random test data
 */
Cypress.Commands.add('generateTestData', () => {
  const timestamp = Date.now()
  return {
    username: `testuser_${timestamp}`,
    email: `test${timestamp}@example.com`,
    orgName: `Test Org ${timestamp}`,
    orgSlug: `test-org-${timestamp}`,
    password: 'TestPass123!',
  }
})
