import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/deadlines/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const data: Record<string, unknown> = {}
    if (body.title !== undefined) data.title = body.title
    if (body.course !== undefined) data.course = body.course
    if (body.dueDate !== undefined) data.dueDate = new Date(body.dueDate)
    if (body.done !== undefined) data.done = body.done
    
    const deadline = await prisma.deadline.update({
      where: { id },
      data
    })
    
    return NextResponse.json({
      id: deadline.id,
      title: deadline.title,
      course: deadline.course,
      dueDate: deadline.dueDate.toISOString().split('T')[0],
      done: deadline.done
    })
  } catch (error) {
    console.error('PATCH /api/deadlines/[id] error:', error)
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
    
    await prisma.deadline.update({
      where: { id },
      data: { archived: true }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/deadlines/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete deadline' }, { status: 500 })
  }
}
