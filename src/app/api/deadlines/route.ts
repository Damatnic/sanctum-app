import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser, DEFAULT_USER_ID } from '@/lib/user'
import type { Deadline } from '@prisma/client'

// GET /api/deadlines
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID
    await getOrCreateUser(userId)
    
    const deadlines = await prisma.deadline.findMany({
      where: { userId, archived: false },
      orderBy: { dueDate: 'asc' }
    })
    
    return NextResponse.json(deadlines.map((d: Deadline) => ({
      id: d.id,
      title: d.title,
      course: d.course,
      dueDate: d.dueDate.toISOString().split('T')[0],
      done: d.done
    })))
  } catch (error) {
    console.error('GET /api/deadlines error:', error)
    return NextResponse.json({ error: 'Failed to fetch deadlines' }, { status: 500 })
  }
}

// POST /api/deadlines
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID
    await getOrCreateUser(userId)
    
    const body = await request.json()
    const { title, course, dueDate } = body
    
    if (!title || !dueDate) {
      return NextResponse.json({ error: 'Title and dueDate are required' }, { status: 400 })
    }
    
    const deadline = await prisma.deadline.create({
      data: {
        userId,
        title,
        course,
        dueDate: new Date(dueDate)
      }
    })
    
    return NextResponse.json({
      id: deadline.id,
      title: deadline.title,
      course: deadline.course,
      dueDate: deadline.dueDate.toISOString().split('T')[0],
      done: deadline.done
    })
  } catch (error) {
    console.error('POST /api/deadlines error:', error)
    return NextResponse.json({ error: 'Failed to create deadline' }, { status: 500 })
  }
}
