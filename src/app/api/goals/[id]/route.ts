import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/goals/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const goal = await prisma.goal.update({
      where: { id },
      data: {
        name: body.name,
        icon: body.icon,
        target: body.target,
        category: body.category,
        current: body.current
      }
    })
    
    return NextResponse.json(goal)
  } catch (error) {
    console.error('PATCH /api/goals/[id] error:', error)
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
    
    await prisma.goal.update({
      where: { id },
      data: { archived: true }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/goals/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
  }
}
