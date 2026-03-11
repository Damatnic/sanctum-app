import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateUser, DEFAULT_USER_ID } from '@/lib/user'

// GET /api/settings
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID
    const user = await getOrCreateUser(userId)

    return NextResponse.json({
      name: user.name || '',
      city: user.city || '',
    })
  } catch (error) {
    console.error('GET /api/settings error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// POST /api/settings
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || DEFAULT_USER_ID

    // FIX: Ensure user exists before updating (was missing, caused P2025 crash on first run)
    await getOrCreateUser(userId)

    const body = await request.json()
    const { name, city } = body

    // Type validation
    if (name !== undefined && typeof name !== 'string') {
      return NextResponse.json({ error: 'name must be a string' }, { status: 400 })
    }
    if (city !== undefined && typeof city !== 'string') {
      return NextResponse.json({ error: 'city must be a string' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name !== undefined ? (name.trim() || null) : undefined,
        city: city !== undefined ? (city.trim() || null) : undefined,
      },
    })

    return NextResponse.json({
      name: user.name || '',
      city: user.city || '',
    })
  } catch (error) {
    console.error('POST /api/settings error:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
