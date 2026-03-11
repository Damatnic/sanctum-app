import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/habits/[id] - update habit
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const habit = await prisma.habit.update({
      where: { id },
      data: {
        name: body.name,
        icon: body.icon,
      }
    })
    
    return NextResponse.json(habit)
  } catch (error) {
    console.error('PATCH /api/habits/[id] error:', error)
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
    
    await prisma.habit.update({
      where: { id },
      data: { archived: true }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/habits/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 })
  }
}
