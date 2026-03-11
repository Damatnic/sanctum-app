import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DEFAULT_USER_ID } from '@/lib/user'
import { handlePrismaError, notFound, forbidden } from '@/lib/api-errors'
import type { HabitCompletion } from '@prisma/client'

// Calculate streak based on completions
function calculateStreak(completions: Date[]): number {
  if (completions.length === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Sort completions descending
  const sorted = completions
    .map(d => {
      const date = new Date(d)
      date.setHours(0, 0, 0, 0)
      return date
    })
    .sort((a, b) => b.getTime() - a.getTime())

  // Check if most recent is today or yesterday
  const mostRecent = sorted[0]
  if (
    mostRecent.getTime() !== today.getTime() &&
    mostRecent.getTime() !== yesterday.getTime()
  ) {
    return 0
  }

  // Count consecutive days (Math.round handles DST transitions where diff is 23 or 25 hours)
  let streak = 1
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round((sorted[i - 1].getTime() - sorted[i].getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 1) {
      streak++
    } else {
      break
    }
  }

  return streak
}

// POST /api/habits/[id]/toggle - toggle today's completion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID

    // Ownership check
    const habit = await prisma.habit.findUnique({ where: { id } })
    if (!habit) return notFound('Habit')
    if (habit.userId !== userId) return forbidden()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Use findUnique with compound key (habitId + date are @@unique in schema)
    const existing = await prisma.habitCompletion.findUnique({
      where: {
        habitId_date: {
          habitId: id,
          date: today,
        },
      },
    })

    let todayCompleted: boolean

    if (existing) {
      // Remove completion
      await prisma.habitCompletion.delete({ where: { id: existing.id } })
      todayCompleted = false
    } else {
      // Add completion
      await prisma.habitCompletion.create({
        data: {
          habitId: id,
          date: today,
        },
      })
      todayCompleted = true
    }

    // Recalculate streak from all completions
    const completions = await prisma.habitCompletion.findMany({
      where: { habitId: id },
      orderBy: { date: 'desc' },
    })

    const streak = calculateStreak(completions.map((c: HabitCompletion) => c.date))

    // FIX: Single update with correct longestStreak using Math.max to never regress it.
    // The previous code had a bug: it first set longestStreak = streak (overwriting the old
    // longest), then compared streak > habit.longestStreak which was now always false.
    const newLongestStreak = Math.max(streak, habit.longestStreak)

    const updated = await prisma.habit.update({
      where: { id },
      data: {
        streak,
        longestStreak: newLongestStreak,
      },
    })

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      icon: updated.icon,
      streak: updated.streak,
      longestStreak: updated.longestStreak,
      todayCompleted,
      completions: completions.map((c: HabitCompletion) => c.date.toISOString().split('T')[0]),
    })
  } catch (error) {
    console.error('POST /api/habits/[id]/toggle error:', error)
    const prismaErr = handlePrismaError(error)
    if (prismaErr) return prismaErr
    return NextResponse.json({ error: 'Failed to toggle habit' }, { status: 500 })
  }
}
