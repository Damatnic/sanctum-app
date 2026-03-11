import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser, DEFAULT_USER_ID } from '@/lib/user'
import type { Habit, HabitCompletion } from '@prisma/client'

type HabitWithCompletions = Habit & { completions: HabitCompletion[] }

// GET /api/habits - list all habits for user
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID
    await getOrCreateUser(userId)
    
    const habits = await prisma.habit.findMany({
      where: { userId, archived: false },
      include: {
        completions: {
          orderBy: { date: 'desc' },
          take: 30 // Last 30 days
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Transform to include todayCompleted
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const transformed = habits.map((habit: HabitWithCompletions) => ({
      id: habit.id,
      name: habit.name,
      icon: habit.icon,
      streak: habit.streak,
      longestStreak: habit.longestStreak,
      todayCompleted: habit.completions.some((c: HabitCompletion) => 
        new Date(c.date).toDateString() === today.toDateString()
      ),
      completions: habit.completions.map((c: HabitCompletion) => c.date.toISOString().split('T')[0])
    }))
    
    return NextResponse.json(transformed)
  } catch (error) {
    console.error('GET /api/habits error:', error)
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 })
  }
}

// POST /api/habits - create new habit
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID
    await getOrCreateUser(userId)
    
    const body = await request.json()
    const { name, icon } = body
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    
    const habit = await prisma.habit.create({
      data: {
        userId,
        name,
        icon: icon || '✓'
      }
    })
    
    return NextResponse.json({
      id: habit.id,
      name: habit.name,
      icon: habit.icon,
      streak: 0,
      longestStreak: 0,
      todayCompleted: false,
      completions: []
    })
  } catch (error) {
    console.error('POST /api/habits error:', error)
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 })
  }
}
