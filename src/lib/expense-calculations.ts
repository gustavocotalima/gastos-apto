// Utility functions for expense splitting calculations

export interface User {
  id: string
  name: string
  isActive: boolean
}

export interface CategorySplit {
  userId: string
  percentage: number
  user: {
    name: string
  }
}

export interface Category {
  id: string
  name: string
  splitType: 'EQUAL' | 'CUSTOM'
  splits?: CategorySplit[]
}

export interface ExpenseSplit {
  userId: string
  amount: number
  user: {
    name: string
  }
}

export interface Expense {
  id: string
  amount: number
  category: Category
  customSplits?: ExpenseSplit[]
}

/**
 * Calculate how an expense should be split among users
 */
export function calculateExpenseSplit(
  expense: Expense,
  activeUsers: User[]
): Record<string, number> {
  const userTotals: Record<string, number> = {}
  
  // Initialize all users with 0
  activeUsers.forEach(user => {
    userTotals[user.id] = 0
  })

  // Check if expense has custom splits
  if (expense.customSplits && expense.customSplits.length > 0) {
    expense.customSplits.forEach(split => {
      userTotals[split.userId] = split.amount
    })
  } else if (expense.category.splitType === 'EQUAL') {
    // Equal split among all active users
    const equalShare = expense.amount / activeUsers.length
    activeUsers.forEach(user => {
      userTotals[user.id] = equalShare
    })
  } else if (expense.category.splitType === 'CUSTOM' && expense.category.splits) {
    // Custom percentages from category
    expense.category.splits.forEach(split => {
      const userShare = expense.amount * (split.percentage / 100)
      userTotals[split.userId] = userShare
    })
  } else {
    // Fallback to equal split if no configuration
    const equalShare = expense.amount / activeUsers.length
    activeUsers.forEach(user => {
      userTotals[user.id] = equalShare
    })
  }

  return userTotals
}

/**
 * Calculate splits for multiple expenses
 */
export function calculateMultipleExpensesSplits(
  expenses: Expense[],
  activeUsers: User[]
): Record<string, number> {
  const userTotals: Record<string, number> = {}
  
  // Initialize all users with 0
  activeUsers.forEach(user => {
    userTotals[user.id] = 0
  })

  expenses.forEach(expense => {
    const expenseSplit = calculateExpenseSplit(expense, activeUsers)
    Object.entries(expenseSplit).forEach(([userId, amount]) => {
      userTotals[userId] = (userTotals[userId] || 0) + amount
    })
  })

  return userTotals
}

/**
 * Calculate balances (who owes what)
 */
export function calculateBalances(
  expenses: Expense[],
  activeUsers: User[]
): Array<{
  userId: string
  userName: string
  paid: number
  owes: number
  balance: number
}> {
  const userTotals = calculateMultipleExpensesSplits(expenses, activeUsers)

  const paidByUser: Record<string, number> = {}
  expenses.forEach(expense => {
    const paidBy = expense.category.id
    paidByUser[paidBy] = (paidByUser[paidBy] || 0) + expense.amount
  })

  return activeUsers.map(user => {
    const paid = paidByUser[user.id] || 0
    const owes = userTotals[user.id] || 0

    return {
      userId: user.id,
      userName: user.name,
      paid,
      owes,
      balance: paid - owes, // positive = is owed money, negative = owes money
    }
  })
}

/**
 * Validate category splits sum to 100%
 */
export function validateCategorySplits(splits: { percentage: number }[]): boolean {
  if (splits.length === 0) return true
  const total = splits.reduce((sum, split) => sum + split.percentage, 0)
  return Math.abs(total - 100) <= 0.01
}

/**
 * Validate custom expense splits sum to expense amount
 */
export function validateExpenseSplits(splits: { amount: number }[], expenseAmount: number): boolean {
  const total = splits.reduce((sum, split) => sum + split.amount, 0)
  return Math.abs(total - expenseAmount) <= 0.01
}