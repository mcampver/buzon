import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { createRateLimiter, getClientIp } from '@/lib/rate-limit'

// Rate limiter: 30 reactions per minute per IP
const reactionRateLimiter = createRateLimiter(30, 60 * 1000)

// POST - Toggle reaction (add if doesn't exist, remove if exists)
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limiting check
  const clientIp = getClientIp(request)
  if (!reactionRateLimiter.check(clientIp)) {
    return NextResponse.json({ 
      error: 'Demasiadas reacciones. Espera un momento.' 
    }, { status: 429 })
  }

  try {
    const { messageId, emoji } = await request.json()
    
    if (!messageId || !emoji) {
      return NextResponse.json({ error: 'Missing messageId or emoji' }, { status: 400 })
    }

    // Security: Validate emoji length to prevent spam/injection
    if (typeof emoji !== 'string' || emoji.length > 8) { // 8 chars covers complex emojis
      return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 })
    }

    // Check if reaction already exists
    const existingReaction = await db.reaction.findUnique({
      where: {
        userId_messageId_emoji: {
          userId: session.user.id,
          messageId,
          emoji
        }
      }
    })

    if (existingReaction) {
      // Remove reaction (toggle off)
      await db.reaction.delete({
        where: { id: existingReaction.id }
      })
    } else {
      // Add reaction (toggle on)
      await db.reaction.create({
        data: {
          emoji,
          userId: session.user.id,
          messageId
        }
      })
    }

    // Return updated reaction stats for this message
    const reactions = await db.reaction.groupBy({
      by: ['emoji'],
      where: { messageId },
      _count: { emoji: true }
    })

    const userReactions = await db.reaction.findMany({
      where: {
        messageId,
        userId: session.user.id
      },
      select: { emoji: true }
    })

    const userReactedEmojis = userReactions.map(r => r.emoji)

    const reactionStats = reactions.map(r => ({
      emoji: r.emoji,
      count: r._count.emoji,
      userReacted: userReactedEmojis.includes(r.emoji)
    }))

    return NextResponse.json({ reactions: reactionStats })
  } catch (error) {
    console.error('Reaction error:', error)
    return NextResponse.json({ error: 'Error processing reaction' }, { status: 500 })
  }
}

// GET - Get reactions for a message
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const messageId = searchParams.get('messageId')

  if (!messageId) {
    return NextResponse.json({ error: 'Missing messageId' }, { status: 400 })
  }

  try {
    const reactions = await db.reaction.groupBy({
      by: ['emoji'],
      where: { messageId },
      _count: { emoji: true }
    })

    const userReactions = await db.reaction.findMany({
      where: {
        messageId,
        userId: session.user.id
      },
      select: { emoji: true }
    })

    const userReactedEmojis = userReactions.map(r => r.emoji)

    const reactionStats = reactions.map(r => ({
      emoji: r.emoji,
      count: r._count.emoji,
      userReacted: userReactedEmojis.includes(r.emoji)
    }))

    return NextResponse.json({ reactions: reactionStats })
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching reactions' }, { status: 500 })
  }
}
