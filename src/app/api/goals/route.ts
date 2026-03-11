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
    
    const res = NextResponse.json(goals.map((g: Goal) => ({
      id: g.id,
      name: g.name,
      icon: g.icon,
      current: g.current,
      target: g.target,
      category: g.category
    })))
    res.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=120')
    return res
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
    const { name, icon, target, category, current } = body
    
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (target !== undefined && (typeof target !== 'number' || target <= 0)) {
      return NextResponse.json({ error: 'target must be a positive number' }, { status: 400 })
    }
    if (current !== undefined && (typeof current !== 'number' || current < 0)) {
      return NextResponse.json({ error: 'current must be a non-negative number' }, { status: 400 })
    }
    
    const goal = await prisma.goal.create({
      data: {
        userId,
        name,
        icon: icon || '🎯',
        target: target || 100,
        current: current || 0,
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
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/goals error:', error)
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}
