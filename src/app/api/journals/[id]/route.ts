import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DEFAULT_USER_ID } from '@/lib/user'
import { handlePrismaError, notFound, forbidden } from '@/lib/api-errors'

// PATCH /api/journals/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID

    // Ownership check
    const existing = await prisma.journalEntry.findUnique({ where: { id } })
    if (!existing) return notFound('Journal entry')
    if (existing.userId !== userId) return forbidden()

    const body = await request.json()

    // Only update fields that are explicitly provided
    const data: Record<string, unknown> = {}
    if (body.text !== undefined) {
      const trimmed = String(body.text).trim()
      if (!trimmed) {
        return NextResponse.json({ error: 'Text cannot be empty' }, { status: 400 })
      }
      data.text = trimmed
    }
    if (body.mood !== undefined) data.mood = body.mood || null

    const journal = await prisma.journalEntry.update({
      where: { id },
      data,
    })

    return NextResponse.json({
      id: journal.id,
      text: journal.text,
      mood: journal.mood,
      createdAt: journal.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('PATCH /api/journals/[id] error:', error)
    const prismaErr = handlePrismaError(error)
    if (prismaErr) return prismaErr
    return NextResponse.json({ error: 'Failed to update journal' }, { status: 500 })
  }
}

// DELETE /api/journals/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID

    // Ownership check
    const existing = await prisma.journalEntry.findUnique({ where: { id } })
    if (!existing) return notFound('Journal entry')
    if (existing.userId !== userId) return forbidden()

    await prisma.journalEntry.update({
      where: { id },
      data: { archived: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/journals/[id] error:', error)
    const prismaErr = handlePrismaError(error)
    if (prismaErr) return prismaErr
    return NextResponse.json({ error: 'Failed to delete journal' }, { status: 500 })
  }
}
