import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser, DEFAULT_USER_ID } from '@/lib/user'

// GET /api/moods - get mood history
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID
    await getOrCreateUser(userId)
    
    const moods = await prisma.moodLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 30
    })
    
    return NextResponse.json(moods.map(m => ({
      id: m.id,
      mood: m.mood,
      date: m.date.toISOString().split('T')[0]
    })))
  } catch (error) {
    console.error('GET /api/moods error:', error)
    return NextResponse.json({ error: 'Failed to fetch moods' }, { status: 500 })
  }
}

// POST /api/moods - log today's mood (upsert)
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID
    await getOrCreateUser(userId)
    
    const body = await request.json()
    const { mood } = body
    
    if (!mood) {
      return NextResponse.json({ error: 'Mood is required' }, { status: 400 })
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const moodLog = await prisma.moodLog.upsert({
      where: {
        userId_date: {
          userId,
          date: today
        }
      },
      update: { mood },
      create: {
        userId,
        mood,
        date: today
      }
    })
    
    return NextResponse.json({
      id: moodLog.id,
      mood: moodLog.mood,
      date: moodLog.date.toISOString().split('T')[0]
    })
  } catch (error) {
    console.error('POST /api/moods error:', error)
    return NextResponse.json({ error: 'Failed to log mood' }, { status: 500 })
  }
}
