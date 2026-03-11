import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser, DEFAULT_USER_ID } from '@/lib/user'
import type { FocusSession } from '@prisma/client'

// GET /api/focus - get focus session stats
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID
    await getOrCreateUser(userId)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // FIX: Use DB aggregation instead of loading all sessions into JS.
    // Get aggregate totals directly from Prisma.
    const [totalAgg, todayAgg, recentSessions] = await Promise.all([
      prisma.focusSession.aggregate({
        where: { userId },
        _sum: { minutes: true },
        _count: { id: true },
      }),
      prisma.focusSession.aggregate({
        where: { userId, createdAt: { gte: today } },
        _sum: { minutes: true },
        _count: { id: true },
      }),
      prisma.focusSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

    return NextResponse.json({
      totalMinutes: totalAgg._sum.minutes ?? 0,
      totalSessions: totalAgg._count.id,
      todayMinutes: todayAgg._sum.minutes ?? 0,
      todaySessions: todayAgg._count.id,
      recentSessions: recentSessions.map((s: FocusSession) => ({
        id: s.id,
        minutes: s.minutes,
        completed: s.completed,
        createdAt: s.createdAt.toISOString(),
      })),
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

    // FIX: Validate minutes is a positive integer
    if (minutes === undefined || minutes === null) {
      return NextResponse.json({ error: 'minutes is required' }, { status: 400 })
    }
    if (typeof minutes !== 'number' || !Number.isInteger(minutes) || minutes <= 0) {
      return NextResponse.json({ error: 'minutes must be a positive integer' }, { status: 400 })
    }
    if (minutes > 1440) {
      return NextResponse.json({ error: 'minutes cannot exceed 1440 (24 hours)' }, { status: 400 })
    }

    const session = await prisma.focusSession.create({
      data: {
        userId,
        minutes,
        completed: completed !== false,
      },
    })

    return NextResponse.json({
      id: session.id,
      minutes: session.minutes,
      completed: session.completed,
      createdAt: session.createdAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/focus error:', error)
    return NextResponse.json({ error: 'Failed to log focus session' }, { status: 500 })
  }
}
