import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/goals/[id]/increment - add/subtract from current
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { delta } = body // positive or negative number
    
    const goal = await prisma.goal.findUnique({ where: { id } })
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }
    
    const newCurrent = Math.max(0, Math.min(goal.target, goal.current + (delta || 0)))
    
    const updated = await prisma.goal.update({
      where: { id },
      data: { current: newCurrent }
    })
    
    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      icon: updated.icon,
      current: updated.current,
      target: updated.target,
      category: updated.category
    })
  } catch (error) {
    console.error('POST /api/goals/[id]/increment error:', error)
    return NextResponse.json({ error: 'Failed to increment goal' }, { status: 500 })
  }
}
