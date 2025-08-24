import { NextResponse } from "next/server"
import { z } from "zod"

export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400)
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401)
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(message, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409)
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error("API Error:", error)

  if (error instanceof AppError) {
    return NextResponse.json(
      { 
        error: error.message,
        type: error.constructor.name
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof z.ZodError) {
    const messages = error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message
    }))
    
    return NextResponse.json(
      { 
        error: "Validation failed",
        type: "ValidationError",
        details: messages
      },
      { status: 400 }
    )
  }

  if (error instanceof Error) {
    // Handle Prisma errors
    if (error.message.includes("Unique constraint failed")) {
      return NextResponse.json(
        { 
          error: "Resource already exists",
          type: "ConflictError"
        },
        { status: 409 }
      )
    }

    if (error.message.includes("Foreign key constraint failed")) {
      return NextResponse.json(
        { 
          error: "Referenced resource not found",
          type: "NotFoundError"
        },
        { status: 404 }
      )
    }
  }

  // Fallback for unknown errors
  return NextResponse.json(
    { 
      error: "Internal server error",
      type: "InternalServerError"
    },
    { status: 500 }
  )
}

export function withErrorHandler<T extends unknown[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T) => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}