import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from './route'

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    category: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    categorySplit: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

describe('/api/categories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/categories', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Mock unauthenticated user
      const { auth } = await import('@/lib/auth')
      vi.mocked(auth).mockResolvedValue(null)

      const response = await GET()

      const data = await response.json()
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return categories when user is authenticated', async () => {
      // Mock authenticated user
      const { auth } = await import('@/lib/auth')
      vi.mocked(auth).mockResolvedValue({ user: { id: '1', name: 'Test User' } })

      // Mock categories data
      const mockCategories = [
        {
          id: '1',
          name: 'Rent',
          splitType: 'EQUAL',
          splits: [],
        },
        {
          id: '2',
          name: 'Groceries',
          splitType: 'CUSTOM',
          splits: [
            {
              userId: '1',
              percentage: 50,
              user: { id: '1', name: 'user1' },
            },
          ],
        },
      ]

      const { prisma } = await import('@/lib/prisma')
      vi.mocked(prisma.category.findMany).mockResolvedValue(mockCategories)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockCategories)
      expect(prisma.category.findMany).toHaveBeenCalledWith({
        include: {
          splits: {
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      })
    })

    it('should handle database errors gracefully', async () => {
      const { auth } = await import('@/lib/auth')
      vi.mocked(auth).mockResolvedValue({ user: { id: '1', name: 'Test User' } })

      const { prisma } = await import('@/lib/prisma')
      vi.mocked(prisma.category.findMany).mockRejectedValue(new Error('Database error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('POST /api/categories', () => {
    it('should return 401 when user is not authenticated', async () => {
      const { auth } = await import('@/lib/auth')
      vi.mocked(auth).mockResolvedValue(null)

      const mockRequest = {
        json: () => Promise.resolve({
          name: 'Test Category',
          splitType: 'EQUAL',
        }),
      }

      const response = await POST(mockRequest as unknown as Request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should create a category with EQUAL split type', async () => {
      const { auth } = await import('@/lib/auth')
      vi.mocked(auth).mockResolvedValue({ user: { id: '1', name: 'Test User' } })

      const mockCreatedCategory = {
        id: '1',
        name: 'Test Category',
        splitType: 'EQUAL',
        createdAt: new Date().toISOString(),
      }

      const { prisma } = await import('@/lib/prisma')
      vi.mocked(prisma.$transaction).mockResolvedValue(mockCreatedCategory)

      const requestBody = {
        name: 'Test Category',
        splitType: 'EQUAL',
      }

      // Mock the request.json() method
      const mockRequest = {
        json: () => Promise.resolve(requestBody),
      }

      const response = await POST(mockRequest as unknown as Request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toMatchObject({
        id: mockCreatedCategory.id,
        name: mockCreatedCategory.name,
        splitType: mockCreatedCategory.splitType
      })
      expect(data.createdAt).toBeDefined()
    })

    it('should create a category with CUSTOM split type and validate percentages', async () => {
      const { auth } = await import('@/lib/auth')
      vi.mocked(auth).mockResolvedValue({ user: { id: '1', name: 'Test User' } })

      const mockCreatedCategory = {
        id: '1',
        name: 'Custom Category',
        splitType: 'CUSTOM',
        createdAt: new Date().toISOString(),
      }

      const { prisma } = await import('@/lib/prisma')
      vi.mocked(prisma.$transaction).mockResolvedValue(mockCreatedCategory)

      const requestBody = {
        name: 'Custom Category',
        splitType: 'CUSTOM',
        splits: [
          { userId: '1', percentage: 50 },
          { userId: '2', percentage: 30 },
          { userId: '3', percentage: 20 },
        ],
      }

      const mockRequest = {
        json: () => Promise.resolve(requestBody),
      }

      const response = await POST(mockRequest as unknown as Request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toMatchObject({
        id: mockCreatedCategory.id,
        name: mockCreatedCategory.name,
        splitType: mockCreatedCategory.splitType
      })
      expect(data.createdAt).toBeDefined()
    })

    it('should return 400 for invalid percentage totals', async () => {
      const { auth } = await import('@/lib/auth')
      vi.mocked(auth).mockResolvedValue({ user: { id: '1', name: 'Test User' } })

      const requestBody = {
        name: 'Invalid Category',
        splitType: 'CUSTOM',
        splits: [
          { userId: '1', percentage: 50 },
          { userId: '2', percentage: 30 },
          { userId: '3', percentage: 30 }, // Total = 110%
        ],
      }

      const mockRequest = {
        json: () => Promise.resolve(requestBody),
      }

      const response = await POST(mockRequest as unknown as Request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Os percentuais devem somar 100%')
    })

    it('should return 400 for invalid input data', async () => {
      const { auth } = await import('@/lib/auth')
      vi.mocked(auth).mockResolvedValue({ user: { id: '1', name: 'Test User' } })

      const requestBody = {
        name: '', // Invalid: empty name
        splitType: 'EQUAL',
      }

      const mockRequest = {
        json: () => Promise.resolve(requestBody),
      }

      const response = await POST(mockRequest as unknown as Request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined() // Should contain validation error
    })

    it('should handle database errors gracefully', async () => {
      const { auth } = await import('@/lib/auth')
      vi.mocked(auth).mockResolvedValue({ user: { id: '1', name: 'Test User' } })

      const { prisma } = await import('@/lib/prisma')
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('Database error'))

      const requestBody = {
        name: 'Test Category',
        splitType: 'EQUAL',
      }

      const mockRequest = {
        json: () => Promise.resolve(requestBody),
      }

      const response = await POST(mockRequest as unknown as Request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})