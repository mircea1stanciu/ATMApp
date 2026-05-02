// ***********************************************************
// Cypress Support File
// ***********************************************************

// Import commands.js
require('./commands')

// Hide fetch/XHR requests from command log (optional)
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // on uncaught exceptions (useful for third-party scripts)
  return false
})

// Custom before hook for all tests
beforeEach(() => {
  // Clear cookies and localStorage before each test
  cy.clearCookies()
  cy.clearLocalStorage()
})
