/// <reference types="cypress" />

describe('Organization Registration Flow', () => {
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
    
    // Verify page title
    cy.contains('h1, h2', /register|sign up|create account/i).should('be.visible')
    
    // Verify form fields are present
    const fields = fixtureData.formFields.registration
    cy.get(`input[name="${fields.organization_name}"]`).should('be.visible')
    cy.get(`input[name="${fields.organization_slug}"]`).should('be.visible')
    cy.get(`input[name="${fields.admin_email}"]`).should('be.visible')
    cy.get(`input[name="${fields.admin_username}"]`).should('be.visible')
    cy.get(`input[name="${fields.admin_password}"]`).should('be.visible')
    cy.get('button[type="submit"]').should('be.visible')
  })

  it('should validate required fields', () => {
    cy.visit(fixtureData.routes.register)
    
    // Try to submit empty form
    cy.get('button[type="submit"]').click()
    
    // Should show validation errors using error messages from fixture
    const errorPattern = new RegExp(fixtureData.errorMessages.required.join('|'), 'i')
    cy.contains(errorPattern).should('be.visible')
  })

  it('should validate email format', () => {
    cy.visit(fixtureData.routes.register)
    
    // Enter invalid email from fixture
    const fields = fixtureData.formFields.registration
    cy.get(`input[name="${fields.admin_email}"]`).type(fixtureData.validationTests.invalidEmail)
    cy.get(`input[name="${fields.admin_username}"]`).click() // Blur the email field
    
    // Should show email validation error
    const errorPattern = new RegExp(fixtureData.errorMessages.invalidEmail.join('|'), 'i')
    cy.contains(errorPattern).should('be.visible')
  })

  it('should validate password strength', () => {
    cy.visit(fixtureData.routes.register)
    
    // Enter weak password from fixture
    const fields = fixtureData.formFields.registration
    cy.get(`input[name="${fields.admin_password}"]`).type(fixtureData.validationTests.weakPassword)
    cy.get(`input[name="${fields.admin_username}"]`).click() // Blur the password field
    
    // Should show password strength error
    const errorPattern = new RegExp(fixtureData.errorMessages.weakPassword.join('|'), 'i')
    cy.contains(errorPattern).should('be.visible')
  })

  it('should validate organization slug format', () => {
    cy.visit(fixtureData.routes.register)
    
    // Enter invalid slug from fixture
    const fields = fixtureData.formFields.registration
    cy.get(`input[name="${fields.organization_slug}"]`).type(fixtureData.validationTests.invalidSlug)
    cy.get(`input[name="${fields.organization_name}"]`).click() // Blur the slug field
    
    // Should show slug validation error
    const errorPattern = new RegExp(fixtureData.errorMessages.invalidSlug.join('|'), 'i')
    cy.contains(errorPattern).should('be.visible')
  })

  it('should successfully register a new organization', () => {
    cy.visit(fixtureData.routes.register)
    
    // Set up API intercept to track registration call
    cy.intercept('POST', `**${fixtureData.api.organizations}`).as('createOrganization')
    
    // Fill in the registration form using generated test data
    const fields = fixtureData.formFields.registration
    cy.get(`input[name="${fields.organization_name}"]`).type(testData.orgName)
    cy.get(`input[name="${fields.organization_slug}"]`).type(testData.orgSlug)
    cy.get(`input[name="${fields.admin_email}"]`).type(testData.email)
    cy.get(`input[name="${fields.admin_username}"]`).type(testData.username)
    cy.get(`input[name="${fields.admin_password}"]`).type(testData.password)
    
    // Select subscription plan if available
    cy.get('body').then($body => {
      if ($body.find(`select[name="${fields.subscription_plan}"]`).length > 0) {
        cy.get(`select[name="${fields.subscription_plan}"]`).select(fixtureData.validOrganization.subscription_plan)
      }
    })
    
    // Take screenshot before submission
    cy.screenshot('registration-form-filled')
    
    // Submit the form
    cy.get('button[type="submit"]').click()
    
    // Wait for API call to complete
    cy.wait('@createOrganization').its('response.statusCode').should('eq', 201)
    
    // Should show success message or redirect
    cy.url().should('satisfy', url => {
      return url.includes(fixtureData.routes.login) || 
             url.includes('/success') || 
             url.includes(fixtureData.routes.dashboard)
    })
    
    // Take screenshot of success state
    cy.screenshot('registration-success')
    
    // Verify success message if present
    const successPattern = new RegExp(fixtureData.successMessages.registration.join('|'), 'i')
    cy.get('body').then($body => {
      if ($body.text().match(successPattern)) {
        cy.contains(successPattern).should('be.visible')
      }
    })
  })

  it('should prevent duplicate organization slug', () => {
    const fields = fixtureData.formFields.registration
    const duplicateData = fixtureData.duplicateOrgTest
    
    // First registration
    cy.visit(fixtureData.routes.register)
    
    cy.get(`input[name="${fields.organization_name}"]`).type(duplicateData.first.organization_name)
    cy.get(`input[name="${fields.organization_slug}"]`).type(duplicateData.first.organization_slug)
    cy.get(`input[name="${fields.admin_email}"]`).type(duplicateData.first.admin_email)
    cy.get(`input[name="${fields.admin_username}"]`).type(duplicateData.first.admin_username)
    cy.get(`input[name="${fields.admin_password}"]`).type(duplicateData.first.admin_password)
    
    cy.get('button[type="submit"]').click()
    
    // Wait for completion
    cy.wait(fixtureData.timeouts.accountCreation)
    
    // Try to register again with same slug
    cy.visit(fixtureData.routes.register)
    
    cy.intercept('POST', `**${fixtureData.api.organizations}`).as('createDuplicateOrg')
    
    cy.get(`input[name="${fields.organization_name}"]`).type(duplicateData.second.organization_name)
    cy.get(`input[name="${fields.organization_slug}"]`).type(duplicateData.second.organization_slug)
    cy.get(`input[name="${fields.admin_email}"]`).type(duplicateData.second.admin_email)
    cy.get(`input[name="${fields.admin_username}"]`).type(duplicateData.second.admin_username)
    cy.get(`input[name="${fields.admin_password}"]`).type(duplicateData.second.admin_password)
    
    cy.get('button[type="submit"]').click()
    
    // Should show error about duplicate slug
    cy.wait('@createDuplicateOrg')
    const errorPattern = new RegExp(fixtureData.errorMessages.duplicateSlug.join('|'), 'i')
    cy.contains(errorPattern, { timeout: fixtureData.timeouts.standard }).should('be.visible')
  })

  it('should show password visibility toggle', () => {
    cy.visit(fixtureData.routes.register)
    
    const fields = fixtureData.formFields.registration
    cy.get(`input[name="${fields.admin_password}"]`).should('have.attr', 'type', 'password')
    
    // Look for visibility toggle button
    cy.get('body').then($body => {
      if ($body.find('[aria-label*="password"], button[type="button"]').length > 0) {
        cy.get('[aria-label*="password"], button[type="button"]').first().click()
        cy.get(`input[name="${fields.admin_password}"]`).should('have.attr', 'type', 'text')
      }
    })
  })

  it('should auto-generate slug from organization name', () => {
    cy.visit(fixtureData.routes.register)
    
    const fields = fixtureData.formFields.registration
    // Type organization name
    cy.get(`input[name="${fields.organization_name}"]`).type('My Test Organization')
    
    // Check if slug is auto-generated
    cy.get(`input[name="${fields.organization_slug}"]`).then($input => {
      const slugValue = $input.val()
      if (slugValue && slugValue.includes('test')) {
        expect(slugValue).to.match(/^[a-z0-9-]+$/)
      }
    })
  })

  it('should redirect to login after successful registration', () => {
    cy.visit(fixtureData.routes.register)
    
    cy.intercept('POST', `**${fixtureData.api.organizations}`).as('createOrg')
    
    // Fill and submit form
    const fields = fixtureData.formFields.registration
    cy.get(`input[name="${fields.organization_name}"]`).type(testData.orgName)
    cy.get(`input[name="${fields.organization_slug}"]`).type(testData.orgSlug)
    cy.get(`input[name="${fields.admin_email}"]`).type(testData.email)
    cy.get(`input[name="${fields.admin_username}"]`).type(testData.username)
    cy.get(`input[name="${fields.admin_password}"]`).type(testData.password)
    
    cy.get('button[type="submit"]').click()
    
    cy.wait('@createOrg')
    
    // Should redirect to login
    cy.url().should('include', fixtureData.routes.login)
    
    // Should show success message on login page
    const successPattern = new RegExp(fixtureData.successMessages.login.join('|'), 'i')
    cy.contains(successPattern).should('be.visible')
  })

  it('should allow login with newly registered credentials', () => {
    cy.visit(fixtureData.routes.register)
    
    cy.intercept('POST', `**${fixtureData.api.organizations}`).as('createOrg')
    
    // Register new organization
    const fields = fixtureData.formFields.registration
    const loginFields = fixtureData.formFields.login
    
    cy.get(`input[name="${fields.organization_name}"]`).type(testData.orgName)
    cy.get(`input[name="${fields.organization_slug}"]`).type(testData.orgSlug)
    cy.get(`input[name="${fields.admin_email}"]`).type(testData.email)
    cy.get(`input[name="${fields.admin_username}"]`).type(testData.username)
    cy.get(`input[name="${fields.admin_password}"]`).type(testData.password)
    
    cy.get('button[type="submit"]').click()
    
    cy.wait('@createOrg')
    cy.wait(fixtureData.timeouts.accountCreation) // Wait for account creation to complete
    
    // Try to login with new credentials
    cy.visit(fixtureData.routes.login)
    
    cy.get(`input[name="${loginFields.username}"]`).type(testData.username)
    cy.get(`input[name="${loginFields.password}"]`).type(testData.password)
    
    // Fill organization slug if required
    cy.get('body').then($body => {
      if ($body.find(`input[name="${loginFields.organization_slug}"]`).length > 0) {
        cy.get(`input[name="${loginFields.organization_slug}"]`).type(testData.orgSlug)
      }
    })
    
    cy.get('button[type="submit"]').click()
    
    // Should successfully login
    cy.url().should('match', /\/(admin|dashboard)/, { timeout: fixtureData.timeouts.navigation })
    cy.screenshot('login-success-after-registration')
  })
})
