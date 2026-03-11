import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DEFAULT_USER_ID } from '@/lib/user'
import { handlePrismaError, notFound, forbidden } from '@/lib/api-errors'

// PATCH /api/habits/[id] - update habit
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID

    // Ownership check
    const existing = await prisma.habit.findUnique({ where: { id } })
    if (!existing) return notFound('Habit')
    if (existing.userId !== userId) return forbidden()

    const body = await request.json()

    // Only update fields that are explicitly provided
    const data: Record<string, unknown> = {}
    if (body.name !== undefined) {
      const trimmed = String(body.name).trim()
      if (!trimmed) {
        return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
      }
      data.name = trimmed
    }
    if (body.icon !== undefined) data.icon = String(body.icon)

    const habit = await prisma.habit.update({
      where: { id },
      data,
    })

    return NextResponse.json({
      id: habit.id,
      name: habit.name,
      icon: habit.icon,
      streak: habit.streak,
      longestStreak: habit.longestStreak,
    })
  } catch (error) {
    console.error('PATCH /api/habits/[id] error:', error)
    const prismaErr = handlePrismaError(error)
    if (prismaErr) return prismaErr
    return NextResponse.json({ error: 'Failed to update habit' }, { status: 500 })
  }
}

// DELETE /api/habits/[id] - archive habit
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID

    // Ownership check
    const existing = await prisma.habit.findUnique({ where: { id } })
    if (!existing) return notFound('Habit')
    if (existing.userId !== userId) return forbidden()

    await prisma.habit.update({
      where: { id },
      data: { archived: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/habits/[id] error:', error)
    const prismaErr = handlePrismaError(error)
    if (prismaErr) return prismaErr
    return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 })
  }
}
