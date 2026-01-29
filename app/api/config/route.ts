import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  let isAdmin = false
  if (session) {
    isAdmin = session.user.isAdmin
  }

  // Get or create default config
  let config = await db.systemConfig.findUnique({ where: { id: 'default' } })
  if (!config) {
    config = await db.systemConfig.create({
      data: { id: 'default', areMessagesRevealed: false }
    })
  }

  return NextResponse.json({ 
    areMessagesRevealed: config.areMessagesRevealed,
    isAdmin
  })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { reveal } = body

  const config = await db.systemConfig.upsert({
    where: { id: 'default' },
    update: { areMessagesRevealed: reveal },
    create: { id: 'default', areMessagesRevealed: reveal }
  })

  return NextResponse.json(config)
}
