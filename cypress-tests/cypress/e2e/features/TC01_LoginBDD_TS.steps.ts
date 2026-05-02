import { Given, When, Then, Before } from '@badeball/cypress-cucumber-preprocessor'

interface TestData {
  routes: {
    login: string
    register: string
    home: string
  }
  formFields: {
    login: {
      username: string
      password: string
    }
  }
  credentials: {
    admin: {
      username: string
      password: string
    }
  }
}

let fixtureData: TestData

Before(function () {
  cy.fixture('testData').then((data: TestData) => {
    fixtureData = data
  })
})

// Given steps
Given('I navigate to the login page', function () {
  cy.visit(fixtureData.routes.login)
})

Given('I am on the login page', function () {
  cy.visit(fixtureData.routes.login)
})

// When steps
When('I enter username {string}', function (username: string) {
  cy.get(`input[name="${fixtureData.formFields.login.username}"]`).type(username)
})

When('I enter password {string}', function (password: string) {
  cy.get(`input[name="${fixtureData.formFields.login.password}"]`).type(password)
})

When('I click the Sign In button', function () {
  cy.get('button[type="submit"]').click()
})

When('I click the Sign In button without entering credentials', function () {
  cy.get('button[type="submit"]').click()
})

When('I click the {string} link', function (linkText: string) {
  cy.contains('a', new RegExp(linkText.replace(/"/g, ''), 'i')).click()
})

When('I scroll to the footer', function () {
  cy.scrollTo('bottom')
})

// Then steps
Then('I should be redirected to {string}', function (path: string) {
  cy.url().should('include', path, { timeout: 10000 })
})

Then('I should see the dashboard', function () {
  cy.contains(/dashboard|admin|welcome/i).should('be.visible')
})

Then('I should see an error message', function () {
  cy.contains(/login failed|invalid|incorrect|error/i, { timeout: 5000 }).should('be.visible')
})

Then('I should remain on the login page', function () {
  cy.url().should('include', '/login')
})

Then('I should see validation errors', function () {
  cy.get(`input[name="${fixtureData.formFields.login.username}"]:invalid`).should('exist')
})

Then('I should see demo credentials displayed', function () {
  cy.contains(/Demo Credentials:/i).should('be.visible')
})

Then('I should see {string} credentials', function (username: string) {
  cy.contains('p', new RegExp(username, 'i')).should('be.visible')
})

Then('I should see {string} password', function (password: string) {
  cy.contains('p', new RegExp(password, 'i')).should('be.visible')
})

Then('I should see the UnifiedWork branding', function () {
  cy.get('footer').within(() => {
    cy.contains(/UnifiedWork/i).should('be.visible')
    cy.contains(/UW/i).should('be.visible')
  })
})

Then('I should see the Product section', function () {
  cy.contains(/Product/i).should('be.visible')
  cy.contains('a', /Features/i).should('be.visible')
})

Then('I should see the Company section', function () {
  cy.contains(/Company/i).should('be.visible')
  cy.contains('a', /About Us/i).should('be.visible')
})

Then('I should see the Legal section', function () {
  cy.contains(/Legal/i).should('be.visible')
  cy.contains('a', /Privacy Policy/i).should('be.visible')
})

Then('I should see social media icons', function () {
  cy.get('footer').within(() => {
    cy.get('a').should('have.length.at.least', 4)
  })
})
