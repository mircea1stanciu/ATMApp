/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to login
     * @example cy.login('username', 'password', 'org-slug')
     */
    login(username: string, password: string, organizationSlug?: string | null): Chainable<void>

    /**
     * Custom command to logout
     * @example cy.logout()
     */
    logout(): Chainable<void>

    /**
     * Custom command to fill form fields
     * @example cy.fillForm({ username: 'test', email: 'test@example.com' })
     */
    fillForm(formData: Record<string, string>): Chainable<void>

    /**
     * Custom command to wait for API calls
     * @example cy.waitForAPI('POST', '/api/organizations')
     */
    waitForAPI(method: string, url: string): Chainable<void>

    /**
     * Custom command to generate random test data
     * @example cy.generateTestData()
     */
    generateTestData(): Chainable<{
      username: string
      email: string
      orgName: string
      orgSlug: string
      password: string
    }>
  }
}
