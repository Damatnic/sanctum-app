import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser, DEFAULT_USER_ID } from '@/lib/user'
import type { Project } from '@prisma/client'

const VALID_STATUSES = ['active', 'planning', 'paused', 'complete'] as const

// GET /api/projects
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID
    await getOrCreateUser(userId)
    
    const projects = await prisma.project.findMany({
      where: { userId, archived: false },
      orderBy: { createdAt: 'desc' }
    })
    
    const res = NextResponse.json(projects.map((p: Project) => ({
      id: p.id,
      name: p.name,
      desc: p.desc,
      icon: p.icon,
      color: p.color,
      status: p.status
    })))
    res.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=120')
    return res
  } catch (error) {
    console.error('GET /api/projects error:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

// POST /api/projects
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID
    await getOrCreateUser(userId)
    
    const body = await request.json()
    const { name, desc, icon, color, status } = body
    
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const project = await prisma.project.create({
      data: {
        userId,
        name,
        desc,
        icon: icon || '📁',
        color: color || 'violet',
        status: status || 'active'
      }
    })
    
    return NextResponse.json({
      id: project.id,
      name: project.name,
      desc: project.desc,
      icon: project.icon,
      color: project.color,
      status: project.status
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/projects error:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
