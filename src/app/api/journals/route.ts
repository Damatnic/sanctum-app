import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser, DEFAULT_USER_ID } from '@/lib/user'
import type { JournalEntry } from '@prisma/client'

// GET /api/journals
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID
    await getOrCreateUser(userId)
    
    const journals = await prisma.journalEntry.findMany({
      where: { userId, archived: false },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    
    return NextResponse.json(journals.map((j: JournalEntry) => ({
      id: j.id,
      text: j.text,
      mood: j.mood,
      createdAt: j.createdAt.toISOString()
    })))
  } catch (error) {
    console.error('GET /api/journals error:', error)
    return NextResponse.json({ error: 'Failed to fetch journals' }, { status: 500 })
  }
}

// POST /api/journals
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID
    await getOrCreateUser(userId)
    
    const body = await request.json()
    const { text, mood } = body
    
    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }
    
    const journal = await prisma.journalEntry.create({
      data: {
        userId,
        text,
        mood
      }
    })
    
    return NextResponse.json({
      id: journal.id,
      text: journal.text,
      mood: journal.mood,
      createdAt: journal.createdAt.toISOString()
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/journals error:', error)
    return NextResponse.json({ error: 'Failed to create journal' }, { status: 500 })
  }
}
