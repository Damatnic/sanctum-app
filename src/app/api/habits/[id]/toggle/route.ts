import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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
    .map(d => { const date = new Date(d); date.setHours(0, 0, 0, 0); return date })
    .sort((a, b) => b.getTime() - a.getTime())
  
  // Check if most recent is today or yesterday
  const mostRecent = sorted[0]
  if (mostRecent.getTime() !== today.getTime() && mostRecent.getTime() !== yesterday.getTime()) {
    return 0
  }
  
  // Count consecutive days
  let streak = 1
  for (let i = 1; i < sorted.length; i++) {
    const diff = (sorted[i-1].getTime() - sorted[i].getTime()) / (1000 * 60 * 60 * 24)
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
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Check if already completed today
    const existing = await prisma.habitCompletion.findFirst({
      where: {
        habitId: id,
        date: today
      }
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
          date: today
        }
      })
      todayCompleted = true
    }
    
    // Recalculate streak
    const completions = await prisma.habitCompletion.findMany({
      where: { habitId: id },
      orderBy: { date: 'desc' }
    })
    
    const streak = calculateStreak(completions.map((c: HabitCompletion) => c.date))
    
    // Update habit with new streak
    const habit = await prisma.habit.update({
      where: { id },
      data: {
        streak,
        longestStreak: {
          set: streak // Will be max'd in a moment
        }
      }
    })
    
    // Update longest streak if needed
    if (streak > habit.longestStreak) {
      await prisma.habit.update({
        where: { id },
        data: { longestStreak: streak }
      })
    }
    
    return NextResponse.json({
      id: habit.id,
      name: habit.name,
      icon: habit.icon,
      streak,
      longestStreak: Math.max(streak, habit.longestStreak),
      todayCompleted,
      completions: completions.map((c: HabitCompletion) => c.date.toISOString().split('T')[0])
    })
  } catch (error) {
    console.error('POST /api/habits/[id]/toggle error:', error)
    return NextResponse.json({ error: 'Failed to toggle habit' }, { status: 500 })
  }
}
