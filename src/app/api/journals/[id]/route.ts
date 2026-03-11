import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/journals/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const journal = await prisma.journalEntry.update({
      where: { id },
      data: {
        text: body.text,
        mood: body.mood
      }
    })
    
    return NextResponse.json({
      id: journal.id,
      text: journal.text,
      mood: journal.mood,
      createdAt: journal.createdAt.toISOString()
    })
  } catch (error) {
    console.error('PATCH /api/journals/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update journal' }, { status: 500 })
  }
}

// DELETE /api/journals/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await prisma.journalEntry.update({
      where: { id },
      data: { archived: true }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/journals/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete journal' }, { status: 500 })
  }
}
