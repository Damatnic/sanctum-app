import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser, DEFAULT_USER_ID } from '@/lib/user'

// GET /api/export - export all user data as JSON
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID
    const user = await getOrCreateUser(userId)
    
    const [habits, goals, deadlines, projects, journals, focusSessions, moods] = await Promise.all([
      prisma.habit.findMany({
        where: { userId },
        include: { completions: true }
      }),
      prisma.goal.findMany({ where: { userId } }),
      prisma.deadline.findMany({ where: { userId } }),
      prisma.project.findMany({ where: { userId } }),
      prisma.journalEntry.findMany({ where: { userId } }),
      prisma.focusSession.findMany({ where: { userId } }),
      prisma.moodLog.findMany({ where: { userId } }),
    ])
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      user: {
        name: user.name,
        city: user.city,
      },
      habits: habits.map(h => ({
        name: h.name,
        icon: h.icon,
        streak: h.streak,
        longestStreak: h.longestStreak,
        completions: h.completions.map(c => c.date.toISOString().split('T')[0])
      })),
      goals: goals.map(g => ({
        name: g.name,
        icon: g.icon,
        current: g.current,
        target: g.target,
        category: g.category,
      })),
      deadlines: deadlines.map(d => ({
        title: d.title,
        course: d.course,
        dueDate: d.dueDate.toISOString().split('T')[0],
        done: d.done,
      })),
      projects: projects.map(p => ({
        name: p.name,
        desc: p.desc,
        icon: p.icon,
        color: p.color,
        status: p.status,
      })),
      journals: journals.map(j => ({
        text: j.text,
        mood: j.mood,
        createdAt: j.createdAt.toISOString(),
      })),
      focusSessions: focusSessions.map(f => ({
        minutes: f.minutes,
        completed: f.completed,
        createdAt: f.createdAt.toISOString(),
      })),
      moods: moods.map(m => ({
        mood: m.mood,
        date: m.date.toISOString().split('T')[0],
      })),
    }
    
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="sanctum-backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('GET /api/export error:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
