/// <reference types="cypress" />

describe('Admin Login Flow', () => {
  let testData
  let fixtureData

  before(() => {
    // Load fixture data once for all tests
    cy.fixture('testData').then(data => {
      fixtureData = data
    })
  })

  beforeEach(() => {
    // Generate unique test data for each test
    cy.generateTestData().then(data => {
      testData = data
    })
  })

  it('should display the Login page correctly', () => {
    cy.visit(fixtureData.routes.login)

    // Verify page components
    cy.contains('h1', /🤖 UnifiedWork/i).should('be.visible')
    cy.contains('h2', /Welcome Back/i).should('be.visible')
    cy.contains('p', /Sign in to continue your work/i).should('be.visible')
    cy.contains('label', /Username/i).should('be.visible')
    cy.contains('button', /Sign In/i).should('be.visible')
    cy.contains('p', /Don't have an account/i).should('be.visible')
    cy.contains('a', /Create One/i).should('be.visible')
    cy.contains('a', /← Back to Home/i).should('be.visible')
    cy.contains('p', /Demo Credentials:/i).should('be.visible')
    cy.contains('p', /Admin:/i).should('be.visible')
    cy.contains('p', /admin/i).should('be.visible')
    cy.contains('p', /admin123/i).should('be.visible')

    // Verify form fields are present with correct names
    const fields = fixtureData.formFields.login
    cy.get(`input[name="${fields.username}"]`).should('be.visible')
    cy.get(`input[name="${fields.password}"]`).should('be.visible')
    cy.get('button[type="submit"]').should('be.visible')
  })

  it('should successfully login with valid credentials', () => {
    cy.visit(fixtureData.routes.login)

    // Use demo credentials
    cy.get('input[name="username"]').type('admin')
    cy.get('input[name="password"]').type('admin123')
    
    // Submit form
    cy.get('button[type="submit"]').click()
    
    // Should redirect to admin dashboard
    cy.url().should('include', '/admin', { timeout: 10000 })
    
    // Verify we're logged in by checking for admin dashboard elements
    cy.contains(/dashboard|admin|welcome/i).should('be.visible')
  })

  it('should show error with invalid credentials', () => {
    cy.visit(fixtureData.routes.login)

    // Enter invalid credentials
    cy.get('input[name="username"]').type('invaliduser')
    cy.get('input[name="password"]').type('wrongpassword')
    
    // Submit form
    cy.get('button[type="submit"]').click()
    
    // Should show error message
    cy.contains(/login failed|invalid|incorrect|error/i, { timeout: 5000 }).should('be.visible')
  })

  it('should validate required fields', () => {
    cy.visit(fixtureData.routes.login)

    // Try to submit without filling fields
    cy.get('button[type="submit"]').click()
    
    // HTML5 validation should prevent submission
    cy.get('input[name="username"]:invalid').should('exist')
  })

  it('should navigate to register page', () => {
    cy.visit(fixtureData.routes.login)

    // Click "Create One" link
    cy.contains('a', /Create One/i).click()
    
    // Should navigate to register page
    cy.url().should('include', '/register')
  })

  it('should navigate back to home', () => {
    cy.visit(fixtureData.routes.login)

    // Click "Back to Home" link
    cy.contains('a', /← Back to Home/i).click()
    
    // Should navigate to home page
    cy.url().should('eq', Cypress.config().baseUrl + '/')
  })

  it('should display demo credentials', () => {
    cy.visit(fixtureData.routes.login)

    // Verify demo credentials section is visible
    cy.contains(/Demo Credentials:/i).should('be.visible')
    cy.contains(/Admin:/i).should('be.visible')
    cy.contains(/admin/i).should('be.visible')
    cy.contains(/admin123/i).should('be.visible')
  })

  it('should display footer with all sections', () => {
    cy.visit(fixtureData.routes.login)

    // Verify footer brand section with logo badge
    cy.get('footer').within(() => {
      // Check for logo/brand badge (UW badge)
      cy.contains(/UW/i).should('be.visible')
      cy.contains(/UnifiedWork/i).should('be.visible')
      cy.contains(/AI-Powered Community Platform for Professionals/i).should('be.visible')
    })

    // Verify Product section
    cy.contains(/Product/i).should('be.visible')
    cy.contains('a', /Features/i).should('be.visible')
    cy.contains('a', /Pricing/i).should('be.visible')
    cy.contains('a', /Communities/i).should('be.visible')
    cy.contains('a', /Learn More/i).should('be.visible')

    // Verify Company section
    cy.contains(/Company/i).should('be.visible')
    cy.contains('a', /About Us/i).should('be.visible')
    cy.contains('a', /Blog/i).should('be.visible')
    cy.contains('a', /Careers/i).should('be.visible')
    cy.contains('a', /Contact/i).should('be.visible')

    // Verify Legal section
    cy.contains(/Legal/i).should('be.visible')
    cy.contains('a', /Privacy Policy/i).should('be.visible')
    cy.contains('a', /Terms of Service/i).should('be.visible')
    cy.contains('a', /Cookie Policy/i).should('be.visible')
    cy.contains('a', /Status/i).should('be.visible')

    // Verify copyright and footer bottom text
    cy.contains(/© 2025 UnifiedWork. All rights reserved./i).should('be.visible')
    cy.contains(/Made with.*by the UnifiedWork team/i).should('be.visible')
  })

  it('should have social media icons in footer', () => {
    cy.visit(fixtureData.routes.login)

    // Scroll to footer to ensure visibility
    cy.scrollTo('bottom')

    // Verify social media icons/links are present
    // Looking for GitHub, LinkedIn, Twitter, and Email icons
    cy.get('footer').within(() => {
      // Check for presence of social media links/icons
      cy.get('a').should('have.length.at.least', 4)
    })
  })

  it('should have working footer links', () => {
    cy.visit(fixtureData.routes.login)

    // Scroll to footer
    cy.scrollTo('bottom')

    // Test a few footer links (without actually navigating)
    cy.contains('a', /Features/i).should('have.attr', 'href')
    cy.contains('a', /Pricing/i).should('have.attr', 'href')
    cy.contains('a', /About Us/i).should('have.attr', 'href')
    cy.contains('a', /Privacy Policy/i).should('have.attr', 'href')
    cy.contains('a', /Terms of Service/i).should('have.attr', 'href')
  })

})

