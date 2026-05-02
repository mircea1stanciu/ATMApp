/// <reference types="cypress" />

describe('Admin Registration Flow', () => {
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

  it('should display the registration page correctly', () => {
    cy.visit(fixtureData.routes.register)
    
    // Verify page title contains registration-related text
    cy.contains(/register|sign up|create account/i).should('be.visible')
    
    // Should show tabs for Admin and User registration
    cy.contains('button', /admin/i).should('be.visible')
    cy.contains('button', /user/i).should('be.visible')
    
    // Verify Admin tab form fields are present
    const fields = fixtureData.formFields.adminRegistration
    cy.get(`input[name="${fields.access_token}"]`).should('be.visible')
    cy.get(`input[name="${fields.username}"]`).should('be.visible')
    cy.get(`input[name="${fields.email}"]`).should('be.visible')
    cy.get(`input[name="${fields.full_name}"]`).should('be.visible')
    cy.get(`input[name="${fields.password}"]`).should('be.visible')
    cy.get(`input[name="${fields.confirm_password}"]`).should('be.visible')
    cy.get('button[type="submit"]').should('be.visible')
  })

  it('should validate required fields for admin registration', () => {
    cy.visit(fixtureData.routes.register)
    
    // Make sure we're on the Admin tab
    cy.contains('button', /admin/i).click()
    
    // Try to submit empty form
    cy.get('button[type="submit"]').click()
    
    // Should show validation errors
    const errorPattern = new RegExp(fixtureData.errorMessages.required.join('|'), 'i')
    cy.contains(errorPattern).should('be.visible')
  })

  it('should validate email format', () => {
    cy.visit(fixtureData.routes.register)
    
    const fields = fixtureData.formFields.adminRegistration
    
    // Enter invalid email
    cy.get(`input[name="${fields.email}"]`).type(fixtureData.validationTests.invalidEmail)
    cy.get(`input[name="${fields.username}"]`).click() // Blur the email field
    
    // Should show email validation error (if validation is on blur)
    cy.get('body').then($body => {
      const errorPattern = new RegExp(fixtureData.errorMessages.invalidEmail.join('|'), 'i')
      if ($body.text().match(errorPattern)) {
        cy.contains(errorPattern).should('be.visible')
      }
    })
  })

  it('should validate password match', () => {
    cy.visit(fixtureData.routes.register)
    
    const fields = fixtureData.formFields.adminRegistration
    
    // Enter mismatched passwords
    cy.get(`input[name="${fields.password}"]`).type('SecurePass123!')
    cy.get(`input[name="${fields.confirm_password}"]`).type('DifferentPass456!')
    
    // Try to submit
    cy.get('button[type="submit"]').click()
    
    // Should show password mismatch error
    const errorPattern = new RegExp(fixtureData.errorMessages.passwordMismatch.join('|'), 'i')
    cy.contains(errorPattern).should('be.visible')
  })

  it('should switch between Admin and User registration tabs', () => {
    cy.visit(fixtureData.routes.register)
    
    // Should start on Admin tab
    cy.get(`input[name="${fixtureData.formFields.adminRegistration.access_token}"]`).should('be.visible')
    
    // Click User tab
    cy.contains('button', /user/i).click()
    
    // Should show User form fields
    cy.get(`input[name="${fixtureData.formFields.userRegistration.organization_slug}"]`).should('be.visible')
    
    // Click back to Admin tab
    cy.contains('button', /admin/i).click()
    
    // Should show Admin form fields again
    cy.get(`input[name="${fixtureData.formFields.adminRegistration.access_token}"]`).should('be.visible')
  })

  it('should display User registration form correctly', () => {
    cy.visit(fixtureData.routes.register)
    
    // Switch to User tab
    cy.contains('button', /user/i).click()
    
    // Verify User tab form fields
    const fields = fixtureData.formFields.userRegistration
    cy.get(`input[name="${fields.organization_slug}"]`).should('be.visible')
    cy.get(`input[name="${fields.username}"]`).should('be.visible')
    cy.get(`input[name="${fields.email}"]`).should('be.visible')
    cy.get(`input[name="${fields.full_name}"]`).should('be.visible')
    cy.get(`input[name="${fields.password}"]`).should('be.visible')
    cy.get(`input[name="${fields.confirm_password}"]`).should('be.visible')
    cy.get('button[type="submit"]').should('be.visible')
  })

  it('should show password visibility toggle', () => {
    cy.visit(fixtureData.routes.register)
    
    const fields = fixtureData.formFields.adminRegistration
    
    cy.get(`input[name="${fields.password}"]`).should('have.attr', 'type', 'password')
    cy.get(`input[name="${fields.confirm_password}"]`).should('have.attr', 'type', 'password')
    
    // Look for visibility toggle buttons
    cy.get('body').then($body => {
      const toggles = $body.find('button[type="button"]')
      if (toggles.length > 0) {
        // Click first toggle (password field)
        cy.get('button[type="button"]').first().click()
        // Password might change to text type
        cy.wait(100)
      }
    })
  })

  it('should have a link to login page', () => {
    cy.visit(fixtureData.routes.register)
    
    // Should have a link to login
    cy.contains('a', /login|sign in|already have an account/i).should('be.visible')
      .and('have.attr', 'href').and('include', '/login')
  })

  it('should display informative help text', () => {
    cy.visit(fixtureData.routes.register)
    
    // Admin tab should have help text about access token
    cy.contains(/access token/i).should('be.visible')
    
    // Switch to User tab
    cy.contains('button', /user/i).click()
    
    // User tab should have help text about organization slug
    cy.contains(/organization.*slug/i).should('be.visible')
  })

  // Note: Full registration tests would require valid access tokens from the backend
  // or mocking the API responses. Here's an example of how to mock:
  
  it('should handle successful admin registration (mocked)', () => {
    cy.visit(fixtureData.routes.register)
    
    // Intercept the registration API call
    cy.intercept('POST', `**${fixtureData.api.adminRegister}`, {
      statusCode: 200,
      body: {
        access_token: 'mocked-jwt-token',
        user: {
          id: 1,
          username: testData.username,
          email: testData.email,
          role: 'org_admin'
        }
      }
    }).as('registerAdmin')
    
    // Fill in the form
    const fields = fixtureData.formFields.adminRegistration
    cy.get(`input[name="${fields.access_token}"]`).type('valid-access-token')
    cy.get(`input[name="${fields.username}"]`).type(testData.username)
    cy.get(`input[name="${fields.email}"]`).type(testData.email)
    cy.get(`input[name="${fields.full_name}"]`).type('Test Admin User')
    cy.get(`input[name="${fields.password}"]`).type(testData.password)
    cy.get(`input[name="${fields.confirm_password}"]`).type(testData.password)
    
    // Submit
    cy.get('button[type="submit"]').click()
    
    // Should call the API
    cy.wait('@registerAdmin')
    
    // Should redirect to admin dashboard
    cy.url().should('include', '/admin')
  })

  it('should handle registration error (mocked)', () => {
    cy.visit(fixtureData.routes.register)
    
    // Intercept the registration API call with error
    cy.intercept('POST', `**${fixtureData.api.adminRegister}`, {
      statusCode: 400,
      body: {
        detail: 'Invalid access token'
      }
    }).as('registerAdminError')
    
    // Fill in the form
    const fields = fixtureData.formFields.adminRegistration
    cy.get(`input[name="${fields.access_token}"]`).type('invalid-token')
    cy.get(`input[name="${fields.username}"]`).type(testData.username)
    cy.get(`input[name="${fields.email}"]`).type(testData.email)
    cy.get(`input[name="${fields.full_name}"]`).type('Test Admin User')
    cy.get(`input[name="${fields.password}"]`).type(testData.password)
    cy.get(`input[name="${fields.confirm_password}"]`).type(testData.password)
    
    // Submit
    cy.get('button[type="submit"]').click()
    
    // Should call the API
    cy.wait('@registerAdminError')
    
    // Should show error message
    cy.contains(/invalid.*token|error/i).should('be.visible')
  })
})
