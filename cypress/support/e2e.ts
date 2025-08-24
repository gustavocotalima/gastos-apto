// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add custom commands or global configuration here
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing the test on certain uncaught exceptions
  // that might occur during development
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  
  // Let other exceptions fail the test
  return true
})

// Set default command timeout
Cypress.config('defaultCommandTimeout', 10000)

// Add global before hook for setup if needed
beforeEach(() => {
  // Global setup before each test
  // For example, you might want to seed the database or set up auth
})