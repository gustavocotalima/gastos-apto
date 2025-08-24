describe('Expenses Page (Homepage) Structure', () => {
  beforeEach(() => {
    // Visit homepage (will redirect to login)
    cy.visit('/')
  })

  it('should redirect homepage to login when not authenticated', () => {
    cy.url().should('contain', '/login')
  })

  it('should have login form elements', () => {
    cy.get('form').should('exist')
    cy.get('input').should('have.length.at.least', 2)
    cy.get('button[type="submit"]').should('exist')
  })

  it('should handle direct navigation to root', () => {
    // Test that the app properly handles root path navigation
    cy.visit('/')
    cy.url().should('contain', '/login')
  })
})

describe('Application Navigation Flow', () => {
  it('should handle navigation between protected routes', () => {
    const routes = ['/', '/categorias', '/configuracoes']
    
    routes.forEach(route => {
      cy.visit(route)
      // All should redirect to login
      cy.url().should('contain', '/login')
      // Should have consistent login form
      cy.get('form').should('exist')
    })
  })

  it('should preserve navigation context', () => {
    // Test that the app maintains proper state during redirects
    cy.visit('/configuracoes')
    cy.url().should('contain', '/login')
    
    // Check that the page loads completely
    cy.get('body').should('be.visible')
    cy.get('form').should('be.visible')
  })
})

// Note: Real expense functionality tests would require authentication
describe('Expense Management (When Authenticated)', () => {
  it.skip('should display expense dashboard when authenticated', () => {
    // This would work with proper auth setup:
    // cy.login('test@example.com', 'password')
    // cy.visit('/')
    // cy.contains('Dashboard').should('be.visible')
    // cy.get('[data-testid="expense-list"]').should('exist')
  })

  it.skip('should show month navigation', () => {
    // cy.login('test@example.com', 'password')
    // cy.visit('/')
    // cy.get('[data-testid="month-navigation"]').should('be.visible')
    // cy.get('[data-testid="previous-month"]').should('be.visible')
    // cy.get('[data-testid="next-month"]').should('be.visible')
  })
})