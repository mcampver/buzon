import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { createRateLimiter, getClientIp, sanitizeContent } from '@/lib/rate-limit'

// Rate limiter: 10 messages per minute per IP
const messageRateLimiter = createRateLimiter(20, 60 * 1000)

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') // 'public' | 'inbox' | 'admin'
  const sort = searchParams.get('sort') // 'recent' | 'popular'

  try {
    if (type === 'public' || type === 'wall') {
      const messages = await db.message.findMany({
        where: { isPublic: true },
        select: {
          id: true,
          content: true,
          toName: true,
          style: true,
          createdAt: true,
          isPublic: true,
          reactions: {
            select: {
              emoji: true,
              userId: true
            }
          }
        }
      })

      // Process reactions and calculate counts
      const messagesWithReactions = messages.map(msg => {
        const reactionCounts: { [emoji: string]: { count: number; userReacted: boolean } } = {}
        
        msg.reactions.forEach(r => {
          if (!reactionCounts[r.emoji]) {
            reactionCounts[r.emoji] = { count: 0, userReacted: false }
          }
          reactionCounts[r.emoji].count++
          if (r.userId === session.user.id) {
            reactionCounts[r.emoji].userReacted = true
          }
        })

        const totalReactions = msg.reactions.length

        return {
          id: msg.id,
          content: msg.content,
          toName: msg.toName,
          style: msg.style,
          createdAt: msg.createdAt,
          isPublic: msg.isPublic,
          reactions: Object.entries(reactionCounts).map(([emoji, data]) => ({
            emoji,
            count: data.count,
            userReacted: data.userReacted
          })),
          totalReactions
        }
      })

      // Sort messages
      if (sort === 'popular') {
        messagesWithReactions.sort((a, b) => b.totalReactions - a.totalReactions)
      } else {
        messagesWithReactions.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      }

      return NextResponse.json(messagesWithReactions)
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
        orderBy: { createdAt: 'desc' },
        // Select only necessary fields + fromId if needed for internal logic (but we'll strip it before sending)
      })

      return NextResponse.json(messages.map(m => {
        // Redaction Logic
        const isRedacted = !areRevealed && !isAdmin
        return {
          id: m.id,
          content: isRedacted ? '🔒 Mensaje secreto' : m.content,
          toName: m.toName,
          style: m.style,
          createdAt: m.createdAt,
          isPublic: m.isPublic,
          fromId: null // Always hide sender in inbox too, anonymity is key!
        }
      }))
    }

    if (type === 'admin') {
      if (!session.user.isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      const messages = await db.message.findMany({
        orderBy: { createdAt: 'desc' },
        include: { 
          toUser: true,
          fromUser: true // Include sender for admin
        }
      })
      return NextResponse.json(messages)
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching messages' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limiting check
  const clientIp = getClientIp(request)
  if (!messageRateLimiter.check(clientIp)) {
    return NextResponse.json({ 
      error: 'Demasiados mensajes. Espera un momento.' 
    }, { status: 429 })
  }

  const body = await request.json()
  let { content, toName, isPublic } = body // Removed 'style' from client input

  if (!content) return NextResponse.json({ error: 'Ah, vacío no vale!' }, { status: 400 })

  // Sanitize and validate content
  content = sanitizeContent(content)
  
  if (content.length === 0) {
    return NextResponse.json({ error: 'Contenido inválido' }, { status: 400 })
  }

  if (content.length > 500) {
    return NextResponse.json({ error: 'Mensaje muy largo (max 500 caracteres)' }, { status: 400 })
  }

  // Security validation: public messages cannot have a specific recipient
  if (isPublic && toName) {
    return NextResponse.json({ 
      error: 'Los mensajes públicos no pueden tener un destinatario específico' 
    }, { status: 400 })
  }

  // Private messages must have a recipient
  if (!isPublic && !toName) {
    return NextResponse.json({ 
      error: 'Los mensajes privados deben tener un destinatario' 
    }, { status: 400 })
  }

  try {
    // Try to find if 'toName' matches a registered user
    let toId = null
    if (toName && !isPublic) {
      const recipient = await db.user.findUnique({ where: { username: toName } })
      if (recipient) toId = recipient.id
    }

    // Generate random style server-side (prevent client manipulation)
    const colors = ['bg-yellow-200', 'bg-pink-200', 'bg-blue-200', 'bg-green-200', 'bg-purple-200', 'bg-red-200']
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    const randomRotation = Math.floor(Math.random() * 5) - 2 // -2 to +2 degrees
    const messageStyle = JSON.stringify({ color: randomColor, rotation: randomRotation })

    const message = await db.message.create({
      data: {
        content,
        fromId: session.user.id,
        toName: isPublic ? null : toName, // Force null for public messages
        toId,
        isPublic: isPublic || false,
        style: messageStyle, // Generated by server
      }
    })

    return NextResponse.json(message)
  } catch (error) {
    return NextResponse.json({ error: 'Error sending message' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
  }

  try {
    await db.message.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting message' }, { status: 500 })
  }
}
