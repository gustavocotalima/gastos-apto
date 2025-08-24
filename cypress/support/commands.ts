/// <reference types="cypress" />

// Custom commands for the gastos-apto application

// Command to seed database with test data
Cypress.Commands.add('seedDatabase', () => {
  cy.task('db:seed')
})

// Command to reset database
Cypress.Commands.add('resetDatabase', () => {
  cy.task('db:reset')
})

// Command to create a test user
Cypress.Commands.add('createTestUser', (userData) => {
  return cy.request('POST', '/api/test/users', userData)
})

// Command to create a test category
Cypress.Commands.add('createTestCategory', (categoryData) => {
  return cy.request('POST', '/api/categories', categoryData)
})

// Command to create a test expense
Cypress.Commands.add('createTestExpense', (expenseData) => {
  return cy.request('POST', '/api/expenses', expenseData)
})

// Command to authenticate test user (if auth is implemented)
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login')
    cy.get('[data-testid="email-input"]').type(email)
    cy.get('[data-testid="password-input"]').type(password)
    cy.get('[data-testid="login-button"]').click()
    cy.url().should('not.contain', '/login')
  })
})

// Command to check if element contains currency formatted text
Cypress.Commands.add('shouldHaveCurrency', { prevSubject: 'element' }, (subject, amount) => {
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount)
  
  return cy.wrap(subject).should('contain', formatted)
})

// Add TypeScript definitions for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      seedDatabase(): Chainable<void>
      resetDatabase(): Chainable<void>
      createTestUser(userData: any): Chainable<Response<any>>
      createTestCategory(categoryData: any): Chainable<Response<any>>
      createTestExpense(expenseData: any): Chainable<Response<any>>
      login(email: string, password: string): Chainable<void>
      shouldHaveCurrency(amount: number): Chainable<JQuery<HTMLElement>>
    }
  }
}