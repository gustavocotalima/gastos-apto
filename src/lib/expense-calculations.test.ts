import { describe, it, expect } from 'vitest'
import {
  calculateExpenseSplit,
  calculateMultipleExpensesSplits,
  validateCategorySplits,
  validateExpenseSplits,
  type User,
  type Category,
  type Expense,
} from './expense-calculations'

// Test data
const mockUsers: User[] = [
  { id: '1', name: 'user1', isActive: true },
  { id: '2', name: 'user2', isActive: true },
  { id: '3', name: 'user3', isActive: true },
]

const equalCategory: Category = {
  id: 'cat1',
  name: 'Rent',
  splitType: 'EQUAL',
}

const customCategory: Category = {
  id: 'cat2',
  name: 'Custom Split',
  splitType: 'CUSTOM',
  splits: [
    { userId: '1', percentage: 50, user: { name: 'user1' } },
    { userId: '2', percentage: 30, user: { name: 'user2' } },
    { userId: '3', percentage: 20, user: { name: 'user3' } },
  ],
}

describe('calculateExpenseSplit', () => {
  it('should split expenses equally among active users', () => {
    const expense: Expense = {
      id: '1',
      amount: 300,
      category: equalCategory,
    }

    const result = calculateExpenseSplit(expense, mockUsers)

    expect(result['1']).toBe(100) // user1: 300/3
    expect(result['2']).toBe(100) // user2: 300/3
    expect(result['3']).toBe(100) // user3: 300/3
  })

  it('should split expenses based on custom category percentages', () => {
    const expense: Expense = {
      id: '1',
      amount: 300,
      category: customCategory,
    }

    const result = calculateExpenseSplit(expense, mockUsers)

    expect(result['1']).toBe(150) // user1: 300 * 50%
    expect(result['2']).toBe(90)  // user2: 300 * 30%
    expect(result['3']).toBe(60)  // user3: 300 * 20%
  })

  it('should use custom expense splits when available', () => {
    const expense: Expense = {
      id: '1',
      amount: 300,
      category: equalCategory,
      customSplits: [
        { userId: '1', amount: 200, user: { name: 'user1' } },
        { userId: '2', amount: 70, user: { name: 'user2' } },
        { userId: '3', amount: 30, user: { name: 'user3' } },
      ],
    }

    const result = calculateExpenseSplit(expense, mockUsers)

    expect(result['1']).toBe(200)
    expect(result['2']).toBe(70)
    expect(result['3']).toBe(30)
  })

  it('should handle single user', () => {
    const singleUser = [mockUsers[0]]
    const expense: Expense = {
      id: '1',
      amount: 300,
      category: equalCategory,
    }

    const result = calculateExpenseSplit(expense, singleUser)

    expect(result['1']).toBe(300) // Single user pays everything
  })

  it('should handle zero amount expense', () => {
    const expense: Expense = {
      id: '1',
      amount: 0,
      category: equalCategory,
    }

    const result = calculateExpenseSplit(expense, mockUsers)

    expect(result['1']).toBe(0)
    expect(result['2']).toBe(0)
    expect(result['3']).toBe(0)
  })
})

describe('calculateMultipleExpensesSplits', () => {
  it('should calculate splits for multiple expenses correctly', () => {
    const expenses: Expense[] = [
      {
        id: '1',
        amount: 300,
        category: equalCategory,
      },
      {
        id: '2',
        amount: 150,
        category: customCategory,
      },
    ]

    const result = calculateMultipleExpensesSplits(expenses, mockUsers)

    // First expense: 300/3 = 100 each
    // Second expense: 150 * 50% = 75, 150 * 30% = 45, 150 * 20% = 30
    expect(result['1']).toBe(175) // user1: 100 + 75
    expect(result['2']).toBe(145) // user2: 100 + 45
    expect(result['3']).toBe(130) // user3: 100 + 30
  })

  it('should handle empty expenses array', () => {
    const result = calculateMultipleExpensesSplits([], mockUsers)

    expect(result['1']).toBe(0)
    expect(result['2']).toBe(0)
    expect(result['3']).toBe(0)
  })

  it('should handle mixed equal and custom split expenses', () => {
    const expenses: Expense[] = [
      {
        id: '1',
        amount: 600,
        category: equalCategory, // 200 each
      },
      {
        id: '2',
        amount: 300,
        category: customCategory, // 150, 90, 60
      },
    ]

    const result = calculateMultipleExpensesSplits(expenses, mockUsers)

    expect(result['1']).toBe(350) // 200 + 150
    expect(result['2']).toBe(290) // 200 + 90
    expect(result['3']).toBe(260) // 200 + 60
  })
})

describe('validateCategorySplits', () => {
  it('should return true for valid splits that sum to 100%', () => {
    const splits = [
      { percentage: 50 },
      { percentage: 30 },
      { percentage: 20 },
    ]

    expect(validateCategorySplits(splits)).toBe(true)
  })

  it('should return false for invalid splits that do not sum to 100%', () => {
    const splits = [
      { percentage: 50 },
      { percentage: 30 },
      { percentage: 30 }, // Total = 110%
    ]

    expect(validateCategorySplits(splits)).toBe(false)
  })

  it('should handle decimal percentages within tolerance', () => {
    const splits = [
      { percentage: 33.33 },
      { percentage: 33.33 },
      { percentage: 33.34 }, // Total = 100%
    ]

    expect(validateCategorySplits(splits)).toBe(true)
  })

  it('should return true for empty splits array', () => {
    expect(validateCategorySplits([])).toBe(true)
  })
})

describe('validateExpenseSplits', () => {
  it('should return true for valid splits that sum to expense amount', () => {
    const splits = [
      { amount: 150 },
      { amount: 90 },
      { amount: 60 },
    ]

    expect(validateExpenseSplits(splits, 300)).toBe(true)
  })

  it('should return false for invalid splits that do not sum to expense amount', () => {
    const splits = [
      { amount: 150 },
      { amount: 90 },
      { amount: 90 }, // Total = 330, but expense is 300
    ]

    expect(validateExpenseSplits(splits, 300)).toBe(false)
  })

  it('should handle decimal amounts within tolerance', () => {
    const splits = [
      { amount: 100.00 },
      { amount: 100.00 },
      { amount: 100.01 }, // Total = 300.01
    ]

    expect(validateExpenseSplits(splits, 300)).toBe(true)
  })

  it('should return true for empty splits array with zero expense', () => {
    expect(validateExpenseSplits([], 0)).toBe(true)
  })
})

describe('AC-generated expense with custom splits', () => {
  it('should produce correct per-user totals for electricity bill with AC', () => {
    const acExtraCost = 184.58
    const totalBill = 444.06
    const nonAcPortion = totalBill - acExtraCost
    const perUserShare = nonAcPortion / mockUsers.length

    const electricityExpense: Expense = {
      id: 'elec-1',
      amount: totalBill,
      category: equalCategory,
      customSplits: [
        { userId: '1', amount: perUserShare + acExtraCost, user: { name: 'user1' } },
        { userId: '2', amount: perUserShare, user: { name: 'user2' } },
        { userId: '3', amount: perUserShare, user: { name: 'user3' } },
      ],
    }

    const result = calculateExpenseSplit(electricityExpense, mockUsers)

    expect(result['1']).toBeCloseTo(271.07, 0)
    expect(result['2']).toBeCloseTo(86.49, 0)
    expect(result['3']).toBeCloseTo(86.49, 0)

    const total = result['1'] + result['2'] + result['3']
    expect(total).toBeCloseTo(totalBill, 1)
  })
})

describe('Edge Cases', () => {
  it('should handle category with no splits defined for CUSTOM type', () => {
    const categoryWithoutSplits: Category = {
      id: 'cat3',
      name: 'Broken Custom',
      splitType: 'CUSTOM',
      // No splits defined
    }

    const expense: Expense = {
      id: '1',
      amount: 300,
      category: categoryWithoutSplits,
    }

    const result = calculateExpenseSplit(expense, mockUsers)

    // Should fallback to equal split
    expect(result['1']).toBe(100)
    expect(result['2']).toBe(100)
    expect(result['3']).toBe(100)
  })

  it('should handle very small amounts', () => {
    const expense: Expense = {
      id: '1',
      amount: 0.01,
      category: equalCategory,
    }

    const result = calculateExpenseSplit(expense, mockUsers)

    const expectedAmount = 0.01 / 3
    expect(Math.abs(result['1'] - expectedAmount)).toBeLessThan(0.001)
    expect(Math.abs(result['2'] - expectedAmount)).toBeLessThan(0.001)
    expect(Math.abs(result['3'] - expectedAmount)).toBeLessThan(0.001)
  })

  it('should handle large amounts', () => {
    const expense: Expense = {
      id: '1',
      amount: 999999.99,
      category: equalCategory,
    }

    const result = calculateExpenseSplit(expense, mockUsers)

    const expectedAmount = 999999.99 / 3
    expect(result['1']).toBeCloseTo(expectedAmount, 2)
    expect(result['2']).toBeCloseTo(expectedAmount, 2)
    expect(result['3']).toBeCloseTo(expectedAmount, 2)
  })
})