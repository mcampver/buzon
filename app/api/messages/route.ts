import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') // 'public' | 'inbox'

  try {
    if (type === 'public' || type === 'wall') {
      const messages = await db.message.findMany({
        where: { isPublic: true },
        orderBy: { createdAt: 'desc' },
        include: { toUser: true } // to show who it was for if applicable
      })
      return NextResponse.json(messages)
    } 
    
    if (type === 'inbox') {
      // Check if revealed
      const config = await db.systemConfig.findUnique({ where: { id: 'default' } })
      const areRevealed = config?.areMessagesRevealed ?? false
      const isAdmin = session.user.isAdmin

      const messages = await db.message.findMany({
        where: { 
          OR: [
            { toId: session.user.id },
            { toName: session.user.username } // Match by name as fallback
          ]
        },
        orderBy: { createdAt: 'desc' }
      })

      // Redact if not revealed and not admin
      if (!areRevealed && !isAdmin) {
        return NextResponse.json(messages.map(m => ({
          ...m,
          content: '🔒 Mensaje secreto' // Redacted content
        })))
      }

      return NextResponse.json(messages)
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching messages' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  // Allow anonymous? maybe not for spam, let's require login
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { content, toName, isPublic, style } = body

  if (!content) return NextResponse.json({ error: 'Ah, vacío no vale!' }, { status: 400 })

  try {
    // Try to find if 'toName' matches a registered user
    let toId = null
    if (toName) {
      const recipient = await db.user.findUnique({ where: { username: toName } })
      if (recipient) toId = recipient.id
    }

    const message = await db.message.create({
      data: {
        content,
        fromId: session.user.id,
        toName: toName || 'Todos',
        toId,
        isPublic: isPublic || false,
        style: JSON.stringify(style),
      }
    })

    return NextResponse.json(message)
  } catch (error) {
    return NextResponse.json({ error: 'Error sending message' }, { status: 500 })
  }
}
