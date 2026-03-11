import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DEFAULT_USER_ID } from '@/lib/user'
import { handlePrismaError, notFound, forbidden } from '@/lib/api-errors'

const VALID_STATUSES = ['active', 'planning', 'paused', 'complete'] as const

// PATCH /api/projects/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID

    // Ownership check
    const existing = await prisma.project.findUnique({ where: { id } })
    if (!existing) return notFound('Project')
    if (existing.userId !== userId) return forbidden()

    const body = await request.json()

    // Validate status if provided
    if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // Only update fields that are explicitly provided
    const data: Record<string, unknown> = {}
    if (body.name !== undefined) {
      const trimmed = String(body.name).trim()
      if (!trimmed) {
        return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
      }
      data.name = trimmed
    }
    if (body.desc !== undefined) data.desc = body.desc || null
    if (body.icon !== undefined) data.icon = String(body.icon)
    if (body.color !== undefined) data.color = String(body.color)
    if (body.status !== undefined) data.status = body.status

    const project = await prisma.project.update({
      where: { id },
      data,
    })

    return NextResponse.json({
      id: project.id,
      name: project.name,
      desc: project.desc,
      icon: project.icon,
      color: project.color,
      status: project.status,
    })
  } catch (error) {
    console.error('PATCH /api/projects/[id] error:', error)
    const prismaErr = handlePrismaError(error)
    if (prismaErr) return prismaErr
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

// DELETE /api/projects/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID

    // Ownership check
    const existing = await prisma.project.findUnique({ where: { id } })
    if (!existing) return notFound('Project')
    if (existing.userId !== userId) return forbidden()

    await prisma.project.update({
      where: { id },
      data: { archived: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/projects/[id] error:', error)
    const prismaErr = handlePrismaError(error)
    if (prismaErr) return prismaErr
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}
