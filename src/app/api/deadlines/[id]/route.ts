import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DEFAULT_USER_ID } from '@/lib/user'
import { handlePrismaError, notFound, forbidden, isValidDate } from '@/lib/api-errors'

// PATCH /api/deadlines/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID

    // Ownership check
    const existing = await prisma.deadline.findUnique({ where: { id } })
    if (!existing) return notFound('Deadline')
    if (existing.userId !== userId) return forbidden()

    const body = await request.json()

    // Validate dueDate if provided
    if (body.dueDate !== undefined && !isValidDate(body.dueDate)) {
      return NextResponse.json(
        { error: 'dueDate must be a valid date string (YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    const data: Record<string, unknown> = {}
    if (body.title !== undefined) {
      const trimmed = String(body.title).trim()
      if (!trimmed) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 })
      }
      data.title = trimmed
    }
    if (body.course !== undefined) data.course = body.course || null
    if (body.dueDate !== undefined) data.dueDate = new Date(body.dueDate)
    if (body.done !== undefined) data.done = Boolean(body.done)

    const deadline = await prisma.deadline.update({
      where: { id },
      data,
    })

    return NextResponse.json({
      id: deadline.id,
      title: deadline.title,
      course: deadline.course,
      dueDate: deadline.dueDate.toISOString().split('T')[0],
      done: deadline.done,
    })
  } catch (error) {
    console.error('PATCH /api/deadlines/[id] error:', error)
    const prismaErr = handlePrismaError(error)
    if (prismaErr) return prismaErr
    return NextResponse.json({ error: 'Failed to update deadline' }, { status: 500 })
  }
}

// DELETE /api/deadlines/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID

    // Ownership check
    const existing = await prisma.deadline.findUnique({ where: { id } })
    if (!existing) return notFound('Deadline')
    if (existing.userId !== userId) return forbidden()

    await prisma.deadline.update({
      where: { id },
      data: { archived: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/deadlines/[id] error:', error)
    const prismaErr = handlePrismaError(error)
    if (prismaErr) return prismaErr
    return NextResponse.json({ error: 'Failed to delete deadline' }, { status: 500 })
  }
}
