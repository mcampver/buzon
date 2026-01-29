import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Attempt a simple query
    const userCount = await db.user.count()
    return NextResponse.json({ 
      status: 'ok', 
      db: 'connected', 
      userCount 
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json({ 
      status: 'error', 
      db: 'disconnected', 
      details: (error as any).message 
    }, { status: 500 })
  }
}
