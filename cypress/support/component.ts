// Import commands.js using ES2015 syntax:
import './commands'

// Import global styles if needed for component testing
import '../../src/app/globals.css'

// Mount command for component testing
import { mount } from 'cypress/react18'

Cypress.Commands.add('mount', mount)

// Add TypeScript definitions
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount
    }
  }
}

// Set default command timeout for component tests
Cypress.config('defaultCommandTimeout', 5000)