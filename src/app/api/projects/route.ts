import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser, DEFAULT_USER_ID } from '@/lib/user'

// GET /api/projects
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID
    await getOrCreateUser(userId)
    
    const projects = await prisma.project.findMany({
      where: { userId, archived: false },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(projects.map(p => ({
      id: p.id,
      name: p.name,
      desc: p.desc,
      icon: p.icon,
      color: p.color,
      status: p.status
    })))
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
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
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
    })
  } catch (error) {
    console.error('POST /api/projects error:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
