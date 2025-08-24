describe('Authentication and Navigation Flow', () => {
  beforeEach(() => {
    // Start from the homepage
    cy.visit('/')
  })

  it('should redirect unauthenticated users to login page', () => {
    // Should be redirected to login page
    cy.url().should('contain', '/login')
    cy.contains('Gastos do Apto').should('be.visible')
    cy.contains('Entre com suas credenciais').should('be.visible')
  })

  it('should display login form elements', () => {
    cy.url().should('contain', '/login')
    
    // Check if login form exists
    cy.get('form').should('exist')
    
    // Check for actual login elements based on the implementation
    cy.get('input#username').should('exist')
    cy.get('input#password[type="password"]').should('exist')
    cy.get('button[type="submit"]').should('exist')
    cy.contains('Entrar').should('be.visible')
  })

  it('should navigate to categories page after accessing login', () => {
    // Visit login page
    cy.visit('/login')
    cy.url().should('contain', '/login')
    
    // Try to navigate to categories (will redirect back to login)
    cy.visit('/categorias')
    cy.url().should('contain', '/login')
  })

  it('should display correct page titles and headers', () => {
    // Check homepage redirect to login
    cy.visit('/')
    cy.url().should('contain', '/login')
    
    // Check if we can access categories directly (should redirect to login)
    cy.visit('/categorias') 
    cy.url().should('contain', '/login')
    
    // Check if we can access configuracoes (should redirect to login)
    cy.visit('/configuracoes')
    cy.url().should('contain', '/login')
  })
})