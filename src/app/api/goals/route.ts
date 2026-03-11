import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser, DEFAULT_USER_ID } from '@/lib/user'
import type { Goal } from '@prisma/client'

// GET /api/goals
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID
    await getOrCreateUser(userId)
    
    const goals = await prisma.goal.findMany({
      where: { userId, archived: false },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(goals.map((g: Goal) => ({
      id: g.id,
      name: g.name,
      icon: g.icon,
      current: g.current,
      target: g.target,
      category: g.category
    })))
  } catch (error) {
    console.error('GET /api/goals error:', error)
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }
}

// POST /api/goals
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID
    await getOrCreateUser(userId)
    
    const body = await request.json()
    const { name, icon, target, category } = body
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    
    const goal = await prisma.goal.create({
      data: {
        userId,
        name,
        icon: icon || '🎯',
        target: target || 100,
        category
      }
    })
    
    return NextResponse.json({
      id: goal.id,
      name: goal.name,
      icon: goal.icon,
      current: goal.current,
      target: goal.target,
      category: goal.category
    })
  } catch (error) {
    console.error('POST /api/goals error:', error)
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}
