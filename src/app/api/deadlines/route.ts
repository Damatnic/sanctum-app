import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser, DEFAULT_USER_ID } from '@/lib/user'
import { isValidDate } from '@/lib/api-errors'
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
    
    const res = NextResponse.json(deadlines.map((d: Deadline) => ({
      id: d.id,
      title: d.title,
      course: d.course,
      dueDate: d.dueDate.toISOString().split('T')[0],
      done: d.done
    })))
    res.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=120')
    return res
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
    
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!dueDate) {
      return NextResponse.json({ error: 'dueDate is required' }, { status: 400 })
    }
    if (!isValidDate(dueDate)) {
      return NextResponse.json({ error: 'dueDate must be a valid date string (YYYY-MM-DD)' }, { status: 400 })
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
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/deadlines error:', error)
    return NextResponse.json({ error: 'Failed to create deadline' }, { status: 500 })
  }
}
