import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

/**
 * Check if a Prisma error is a "record not found" error (P2025).
 */
export function isPrismaNotFound(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  )
}

/**
 * Check if a Prisma error is a unique constraint violation (P2002).
 */
export function isPrismaUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  )
}

/**
 * Standard 404 Not Found response.
 */
export function notFound(resource = 'Record') {
  return NextResponse.json({ error: `${resource} not found` }, { status: 404 })
}

/**
 * Standard 403 Forbidden response.
 */
export function forbidden() {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 })
}

/**
 * Standard 400 Bad Request response.
 */
export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

/**
 * Handle Prisma errors and map them to appropriate HTTP responses.
 * Returns null if the error is not a known Prisma error (caller should handle it).
 */
export function handlePrismaError(error: unknown): NextResponse | null {
  if (isPrismaNotFound(error)) {
    return notFound()
  }
  if (isPrismaUniqueViolation(error)) {
    return NextResponse.json({ error: 'Resource already exists' }, { status: 409 })
  }
  return null
}

/**
 * Validate that a date string is a valid date.
 */
export function isValidDate(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false
  const d = new Date(dateStr)
  return !isNaN(d.getTime())
}
