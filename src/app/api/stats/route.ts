import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser, DEFAULT_USER_ID } from '@/lib/user'
import type { HabitCompletion, FocusSession, MoodLog } from '@prisma/client'

// GET /api/stats - get weekly/monthly statistics
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID
    await getOrCreateUser(userId)
    
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    // Fetch all data for the month in parallel
    const [habitCompletions, focusSessions, moodLogs] = await Promise.all([
      // FIX: Removed `include: { habit: true }` — the habit relation was never
      // used in this route but caused an unnecessary JOIN on every stats request.
      prisma.habitCompletion.findMany({
        where: {
          habit: { userId },
          date: { gte: monthAgo }
        }
      }),
      prisma.focusSession.findMany({
        where: {
          userId,
          createdAt: { gte: monthAgo }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.moodLog.findMany({
        where: {
          userId,
          date: { gte: monthAgo }
        },
        orderBy: { date: 'desc' }
      })
    ])
    
    // Build Maps for O(1) per-day lookups instead of O(n) filters per day
    const habitCompletionsByDate = new Map<string, number>()
    for (const c of habitCompletions as HabitCompletion[]) {
      const dateStr = c.date.toISOString().split('T')[0]
      habitCompletionsByDate.set(dateStr, (habitCompletionsByDate.get(dateStr) ?? 0) + 1)
    }

    const focusByDate = new Map<string, number>()
    for (const s of focusSessions as FocusSession[]) {
      const dateStr = s.createdAt.toISOString().split('T')[0]
      focusByDate.set(dateStr, (focusByDate.get(dateStr) ?? 0) + s.minutes)
    }

    // Most recent mood per day (already ordered desc)
    const moodByDate = new Map<string, string>()
    for (const m of moodLogs as MoodLog[]) {
      const dateStr = m.date.toISOString().split('T')[0]
      if (!moodByDate.has(dateStr)) {
        moodByDate.set(dateStr, m.mood)
      }
    }

    // Build daily stats — O(30) with O(1) Map lookups instead of O(30×n)
    const dailyStats: { date: string; habits: number; focusMinutes: number; mood: string | null }[] = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dailyStats.push({
        date: dateStr,
        habits: habitCompletionsByDate.get(dateStr) ?? 0,
        focusMinutes: focusByDate.get(dateStr) ?? 0,
        mood: moodByDate.get(dateStr) ?? null,
      })
    }

    // Weekly / monthly summaries — single pass each
    let weekCompletions = 0, weekFocusMinutes = 0, weekFocusSessions = 0
    let monthCompletions = 0, monthFocusMinutes = 0

    for (const c of habitCompletions as HabitCompletion[]) {
      monthCompletions++
      if (c.date >= weekAgo) weekCompletions++
    }

    for (const s of focusSessions as FocusSession[]) {
      monthFocusMinutes += s.minutes
      if (s.createdAt >= weekAgo) {
        weekFocusMinutes += s.minutes
        weekFocusSessions++
      }
    }

    // Focus session history (last 20)
    const recentFocus = (focusSessions as FocusSession[]).slice(0, 20).map(s => ({
      id: s.id,
      minutes: s.minutes,
      completed: s.completed,
      date: s.createdAt.toISOString()
    }))

    const response = NextResponse.json({
      daily: dailyStats,
      week: {
        habitCompletions: weekCompletions,
        focusMinutes: weekFocusMinutes,
        focusSessions: weekFocusSessions,
      },
      month: {
        habitCompletions: monthCompletions,
        focusMinutes: monthFocusMinutes,
        focusSessions: focusSessions.length,
      },
      recentFocus,
      moodHistory: (moodLogs as MoodLog[]).slice(0, 30).map(m => ({
        date: m.date.toISOString().split('T')[0],
        mood: m.mood
      }))
    })

    // Allow clients to cache stats for 60 seconds (stale-while-revalidate for 5 min)
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=300')
    return response
  } catch (error) {
    console.error('GET /api/stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
