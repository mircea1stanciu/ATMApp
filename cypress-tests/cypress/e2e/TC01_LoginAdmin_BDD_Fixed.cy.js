/// <reference types="cypress" />
// BDD-style Login Tests using Cypress Native Syntax
// CORRECTED VERSION: Combines Given-When-Then steps into single test blocks
// This avoids state isolation issues between separate it() blocks

describe('Feature: Admin Login', () => {
  let testData
  let fixtureData

  before(() => {
    cy.fixture('testData').then(data => {
      fixtureData = data
    })
  })

  beforeEach(() => {
    cy.generateTestData().then(data => {
      testData = data
    })
  })

  describe('Scenario: User navigates to login page and sees all components', () => {
    it('Given a user visits the login page, When the page loads, Then the login form and title should be visible', () => {
      // Given: User visits the login page
      cy.visit(fixtureData.routes.login)
      
      // When: Page loads
      cy.url().should('include', '/login')
      
      // Then: Login form should be visible
      cy.get(`input[name="${fixtureData.formFields.login.username}"]`).should('be.visible')
      cy.get(`input[name="${fixtureData.formFields.login.password}"]`).should('be.visible')
      cy.get('button[type="submit"]').should('be.visible')
      
      // And: Page title should display
      cy.contains('h1', /UnifiedWork/i).should('be.visible')
      cy.contains('h2', /Welcome Back/i).should('be.visible')
    })
  })

  describe('Scenario: User logs in with valid credentials', () => {
    it('Given a user is on the login page, When they enter valid credentials and click Sign In, Then they should see the admin dashboard', () => {
      // Given: User is on the login page
      cy.visit(fixtureData.routes.login)
      
      // When: They enter valid username
      cy.get(`input[name="${fixtureData.formFields.login.username}"]`).type('admin')
      
      // And: They enter valid password
      cy.get(`input[name="${fixtureData.formFields.login.password}"]`).type('admin123')
      
      // And: They click the Sign In button
      cy.get('button[type="submit"]').click()
      
      // Then: They should be redirected to admin dashboard
      cy.url().should('include', '/admin', { timeout: 10000 })
      
      // And: The dashboard should be visible
      cy.contains(/dashboard|admin|welcome/i).should('be.visible')
    })
  })

  describe('Scenario: User attempts login with invalid credentials', () => {
    it('Given a user is on the login page, When they enter invalid credentials, Then an error message should appear', () => {
      // Given: User is on the login page
      cy.visit(fixtureData.routes.login)
      
      // When: They enter invalid username
      cy.get(`input[name="${fixtureData.formFields.login.username}"]`).type('invaliduser')
      
      // And: They enter invalid password
      cy.get(`input[name="${fixtureData.formFields.login.password}"]`).type('wrongpassword')
      
      // And: They click the Sign In button
      cy.get('button[type="submit"]').click()
      
      // Then: An error message should be displayed
      cy.contains(/login failed|invalid|incorrect|error/i, { timeout: 5000 }).should('be.visible')
      
      // And: They should remain on the login page
      cy.url().should('include', '/login')
    })
  })

  describe('Scenario: User sees required field validation', () => {
    it('Given a user is on the login page, When they attempt to submit an empty form, Then validation should prevent submission', () => {
      // Given: User is on the login page
      cy.visit(fixtureData.routes.login)
      
      // When: They attempt to submit an empty form
      cy.get('button[type="submit"]').click()
      
      // Then: Validation should prevent submission
      cy.get(`input[name="${fixtureData.formFields.login.username}"]:invalid`).should('exist')
      
      // And: They should remain on the login page
      cy.url().should('include', '/login')
    })
  })

  describe('Scenario: User navigates to registration page', () => {
    it('Given a user is on the login page, When they see and click the Create One link, Then they should be redirected to register page', () => {
      // Given: User is on the login page
      cy.visit(fixtureData.routes.login)
      
      // When: They see the Create One link
      cy.contains('a', /Create One/i).should('be.visible')
      
      // And: They click the Create One link
      cy.contains('a', /Create One/i).click()
      
      // Then: They should be redirected to the register page
      cy.url().should('include', '/register')
    })
  })

  describe('Scenario: User views footer information', () => {
    it('Given a user is on the login page, When they scroll to the footer, Then they should see all footer sections and branding', () => {
      // Given: User is on the login page
      cy.visit(fixtureData.routes.login)
      
      // When: They scroll to the footer
      cy.scrollTo('bottom')
      
      // Then: They should see the UnifiedWork branding
      cy.get('footer').within(() => {
        cy.contains(/UnifiedWork/i).should('be.visible')
        cy.contains(/UW/i).should('be.visible')
      })
      
      // And: They should see the Product section
      cy.contains(/Product/i).should('be.visible')
      cy.contains('a', /Features/i).should('be.visible')
      
      // And: They should see the Company section
      cy.contains(/Company/i).should('be.visible')
      cy.contains('a', /About Us/i).should('be.visible')
      
      // And: They should see the Legal section
      cy.contains(/Legal/i).should('be.visible')
      cy.contains('a', /Privacy Policy/i).should('be.visible')
      
      // And: They should see social media icons
      cy.get('footer').within(() => {
        cy.get('a').should('have.length.at.least', 4)
      })
    })
  })

  describe('Scenario: User sees demo credentials', () => {
    it('Given a user is on the login page, Then they should see demo credentials displayed', () => {
      // Given: User is on the login page
      cy.visit(fixtureData.routes.login)
      
      // Then: Demo credentials section should be visible
      cy.contains(/Demo Credentials:/i).should('be.visible')
      cy.contains(/Admin:/i).should('be.visible')
      cy.contains(/admin/i).should('be.visible')
      cy.contains(/admin123/i).should('be.visible')
    })
  })

  describe('Scenario: User navigates back to home', () => {
    it('Given a user is on the login page, When they click Back to Home, Then they should be redirected to the home page', () => {
      // Given: User is on the login page
      cy.visit(fixtureData.routes.login)
      
      // When: They click "Back to Home" link
      cy.contains('a', /← Back to Home/i).click()
      
      // Then: They should navigate to home page
      cy.url().should('eq', Cypress.config().baseUrl + '/')
    })
  })
})
