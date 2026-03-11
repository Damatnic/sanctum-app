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
    
    // Get all habit completions for the month
    const habitCompletions = await prisma.habitCompletion.findMany({
      where: {
        habit: { userId },
        date: { gte: monthAgo }
      },
      include: { habit: true }
    })
    
    // Get focus sessions for the month
    const focusSessions = await prisma.focusSession.findMany({
      where: {
        userId,
        createdAt: { gte: monthAgo }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Get mood logs for the month
    const moodLogs = await prisma.moodLog.findMany({
      where: {
        userId,
        date: { gte: monthAgo }
      },
      orderBy: { date: 'desc' }
    })
    
    // Calculate daily stats for the last 30 days
    const dailyStats: { date: string; habits: number; focusMinutes: number; mood: string | null }[] = []
    for (let i = 0; i < 30; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayCompletions = habitCompletions.filter((c: HabitCompletion) => 
        c.date.toISOString().split('T')[0] === dateStr
      ).length
      
      const dayFocus = focusSessions
        .filter((s: FocusSession) => s.createdAt.toISOString().split('T')[0] === dateStr)
        .reduce((sum: number, s: FocusSession) => sum + s.minutes, 0)
      
      const dayMood = moodLogs.find((m: MoodLog) => 
        m.date.toISOString().split('T')[0] === dateStr
      )?.mood || null
      
      dailyStats.push({ date: dateStr, habits: dayCompletions, focusMinutes: dayFocus, mood: dayMood })
    }
    
    // Weekly summary
    const weekCompletions = habitCompletions.filter((c: HabitCompletion) => c.date >= weekAgo).length
    const weekFocus = focusSessions
      .filter((s: FocusSession) => s.createdAt >= weekAgo)
      .reduce((sum: number, s: FocusSession) => sum + s.minutes, 0)
    const weekSessions = focusSessions.filter((s: FocusSession) => s.createdAt >= weekAgo).length
    
    // Monthly summary
    const monthCompletions = habitCompletions.length
    const monthFocus = focusSessions.reduce((sum: number, s: FocusSession) => sum + s.minutes, 0)
    const monthSessions = focusSessions.length
    
    // Focus session history (last 20)
    const recentFocus = focusSessions.slice(0, 20).map((s: FocusSession) => ({
      id: s.id,
      minutes: s.minutes,
      completed: s.completed,
      date: s.createdAt.toISOString()
    }))
    
    return NextResponse.json({
      daily: dailyStats.reverse(),
      week: {
        habitCompletions: weekCompletions,
        focusMinutes: weekFocus,
        focusSessions: weekSessions,
      },
      month: {
        habitCompletions: monthCompletions,
        focusMinutes: monthFocus,
        focusSessions: monthSessions,
      },
      recentFocus,
      moodHistory: moodLogs.slice(0, 30).map((m: MoodLog) => ({
        date: m.date.toISOString().split('T')[0],
        mood: m.mood
      }))
    })
  } catch (error) {
    console.error('GET /api/stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
