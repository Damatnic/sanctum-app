import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DEFAULT_USER_ID } from '@/lib/user'
import { handlePrismaError, notFound, forbidden, badRequest } from '@/lib/api-errors'

// POST /api/goals/[id]/increment - add/subtract from current
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID

    const body = await request.json()
    const { delta } = body

    // Validate delta
    if (delta === undefined || delta === null) {
      return badRequest('delta is required')
    }
    if (typeof delta !== 'number' || !isFinite(delta)) {
      return badRequest('delta must be a finite number')
    }

    // Ownership check
    const goal = await prisma.goal.findUnique({ where: { id } })
    if (!goal) return notFound('Goal')
    if (goal.userId !== userId) return forbidden()

    const newCurrent = Math.max(0, Math.min(goal.target, goal.current + delta))

    const updated = await prisma.goal.update({
      where: { id },
      data: { current: newCurrent },
    })

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      icon: updated.icon,
      current: updated.current,
      target: updated.target,
      category: updated.category,
    })
  } catch (error) {
    console.error('POST /api/goals/[id]/increment error:', error)
    const prismaErr = handlePrismaError(error)
    if (prismaErr) return prismaErr
    return NextResponse.json({ error: 'Failed to increment goal' }, { status: 500 })
  }
}
