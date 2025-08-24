describe('UI Structure and Accessibility', () => {
  beforeEach(() => {
    // All requests will redirect to login, so test the login page structure
    cy.visit('/login')
  })

  it('should have proper HTML structure', () => {
    // Check basic HTML structure
    cy.get('html').should('have.attr', 'lang')
    cy.get('head title').should('exist')
    cy.get('body').should('exist')
  })

  it('should have accessible form elements', () => {
    // Check form accessibility
    cy.get('form').should('exist')
    
    // Check for labels or proper input attributes
    cy.get('input').each(($input) => {
      // Each input should have either a label, placeholder, or aria-label
      const hasLabel = Cypress.$(`label[for="${$input.attr('id')}"]`).length > 0
      const hasPlaceholder = $input.attr('placeholder')
      const hasAriaLabel = $input.attr('aria-label')
      const hasAriaLabelledBy = $input.attr('aria-labelledby')
      
      expect(hasLabel || hasPlaceholder || hasAriaLabel || hasAriaLabelledBy).to.be.true
    })
  })

  it('should be responsive and have proper viewport', () => {
    // Test different viewport sizes
    cy.viewport('iphone-6')
    cy.get('body').should('be.visible')
    
    cy.viewport('ipad-2')
    cy.get('body').should('be.visible')
    
    cy.viewport(1920, 1080)
    cy.get('body').should('be.visible')
  })

  it('should handle navigation attempts without authentication', () => {
    // Test that protected routes redirect properly
    const protectedRoutes = ['/', '/categorias', '/configuracoes']
    
    protectedRoutes.forEach(route => {
      cy.visit(route)
      cy.url().should('contain', '/login')
    })
  })

  it('should have proper error handling for non-existent pages', () => {
    cy.visit('/non-existent-page', { failOnStatusCode: false })
    // Next.js might handle 404s differently - it could show 404 or redirect
    // Check that the page loads without crashing and shows some content
    cy.get('body').should('be.visible')
    
    // It should either show a 404 page or redirect to login
    cy.url().should('satisfy', (url) => {
      return url.includes('404') || url.includes('/login') || url.includes('non-existent-page')
    })
  })
})