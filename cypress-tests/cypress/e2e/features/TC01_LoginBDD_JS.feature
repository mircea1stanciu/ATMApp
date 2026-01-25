@login @authentication @smoke @javascript
Feature: User Login (JavaScript)
  As a user
  I want to log in with my credentials
  So that I can access my dashboard

  Background:
    Given I navigate to the login page

  @positive @critical
  Scenario: Admin logs in with valid credentials
    When I enter username "admin"
    And I enter password "admin123"
    And I click the Sign In button
    Then I should be redirected to "/admin"
    And I should see the dashboard

  @negative @error-handling
  Scenario: User login fails with invalid credentials
    When I enter username "invaliduser"
    And I enter password "wrongpassword"
    And I click the Sign In button
    Then I should see an error message
    And I should remain on the login page

  @validation @negative
  Scenario: Required field validation
    When I click the Sign In button without entering credentials
    Then I should see validation errors
    And I should remain on the login page

  @navigation @positive
  Scenario: User navigates to registration page
    When I click the "Create One" link
    Then I should be redirected to "/register"

  @ui @positive
  Scenario: User sees demo credentials
    Then I should see demo credentials displayed
    And I should see "admin" credentials
    And I should see "admin123" password

  @navigation @positive
  Scenario: User navigates back to home
    When I click the "← Back to Home" link
    Then I should be redirected to "/"

  @ui @footer @positive
  Scenario: Footer is visible with all sections
    When I scroll to the footer
    Then I should see the UnifiedWork branding
    And I should see the Product section
    And I should see the Company section
    And I should see the Legal section
    And I should see social media icons
