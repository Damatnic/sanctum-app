import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DEFAULT_USER_ID } from '@/lib/user'
import { handlePrismaError, notFound, forbidden, badRequest } from '@/lib/api-errors'

// PATCH /api/goals/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID

    // Ownership check
    const existing = await prisma.goal.findUnique({ where: { id } })
    if (!existing) return notFound('Goal')
    if (existing.userId !== userId) return forbidden()

    const body = await request.json()

    // Validate target/current are positive numbers if provided
    if (body.target !== undefined) {
      if (typeof body.target !== 'number' || body.target <= 0) {
        return badRequest('target must be a positive number')
      }
    }
    if (body.current !== undefined) {
      if (typeof body.current !== 'number' || body.current < 0) {
        return badRequest('current must be a non-negative number')
      }
    }

    // Only update fields that are explicitly provided
    const data: Record<string, unknown> = {}
    if (body.name !== undefined) data.name = String(body.name).trim() || existing.name
    if (body.icon !== undefined) data.icon = String(body.icon)
    if (body.target !== undefined) data.target = body.target
    if (body.current !== undefined) data.current = body.current
    if (body.category !== undefined) data.category = body.category || null

    const goal = await prisma.goal.update({
      where: { id },
      data,
    })

    return NextResponse.json({
      id: goal.id,
      name: goal.name,
      icon: goal.icon,
      current: goal.current,
      target: goal.target,
      category: goal.category,
    })
  } catch (error) {
    console.error('PATCH /api/goals/[id] error:', error)
    const prismaErr = handlePrismaError(error)
    if (prismaErr) return prismaErr
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
  }
}

// DELETE /api/goals/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID

    // Ownership check
    const existing = await prisma.goal.findUnique({ where: { id } })
    if (!existing) return notFound('Goal')
    if (existing.userId !== userId) return forbidden()

    await prisma.goal.update({
      where: { id },
      data: { archived: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/goals/[id] error:', error)
    const prismaErr = handlePrismaError(error)
    if (prismaErr) return prismaErr
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
  }
}
