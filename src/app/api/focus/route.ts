import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser, DEFAULT_USER_ID } from '@/lib/user'
import type { FocusSession } from '@prisma/client'

// GET /api/focus - get focus session stats
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID
    await getOrCreateUser(userId)
    
    const sessions = await prisma.focusSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
    
    const totalMinutes = sessions.reduce((sum: number, s: FocusSession) => sum + s.minutes, 0)
    const totalSessions = sessions.length
    
    // Today's sessions
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todaySessions = sessions.filter((s: FocusSession) => new Date(s.createdAt) >= today)
    const todayMinutes = todaySessions.reduce((sum: number, s: FocusSession) => sum + s.minutes, 0)
    
    return NextResponse.json({
      totalMinutes,
      totalSessions,
      todayMinutes,
      todaySessions: todaySessions.length,
      recentSessions: sessions.slice(0, 10).map((s: FocusSession) => ({
        id: s.id,
        minutes: s.minutes,
        completed: s.completed,
        createdAt: s.createdAt.toISOString()
      }))
    })
  } catch (error) {
    console.error('GET /api/focus error:', error)
    return NextResponse.json({ error: 'Failed to fetch focus stats' }, { status: 500 })
  }
}

// POST /api/focus - log a focus session
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID
    await getOrCreateUser(userId)
    
    const body = await request.json()
    const { minutes, completed } = body
    
    if (!minutes || minutes <= 0) {
      return NextResponse.json({ error: 'Minutes must be positive' }, { status: 400 })
    }
    
    const session = await prisma.focusSession.create({
      data: {
        userId,
        minutes,
        completed: completed !== false
      }
    })
    
    return NextResponse.json({
      id: session.id,
      minutes: session.minutes,
      completed: session.completed,
      createdAt: session.createdAt.toISOString()
    })
  } catch (error) {
    console.error('POST /api/focus error:', error)
    return NextResponse.json({ error: 'Failed to log focus session' }, { status: 500 })
  }
}
