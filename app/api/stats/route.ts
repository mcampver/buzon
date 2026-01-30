import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    // Overview metrics
    const totalMessages = await db.message.count()
    const publicMessages = await db.message.count({ where: { isPublic: true } })
    const privateMessages = totalMessages - publicMessages
    const totalUsers = await db.user.count()
    const totalReactions = await db.reaction.count()
    const avgMessagesPerUser = totalUsers > 0 ? (totalMessages / totalUsers).toFixed(1) : 0

    // Top senders (users with most messages)
    const messagesByUser = await db.message.groupBy({
      by: ['fromId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    })

    const topSenders = await Promise.all(
      messagesByUser.map(async (item) => {
        if (!item.fromId) return null
        const user = await db.user.findUnique({ 
          where: { id: item.fromId },
          select: { username: true }
        })
        return {
          username: user?.username || 'Anónimo',
          count: item._count.id
        }
      })
    ).then(results => results.filter(Boolean))

    // Top messages (with most reactions)
    const allMessages = await db.message.findMany({
      where: { isPublic: true },
      select: {
        id: true,
        content: true,
        reactions: true
      }
    })

    const topMessages = allMessages
      .map(msg => ({
        id: msg.id,
        content: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
        reactions: msg.reactions.length
      }))
      .sort((a, b) => b.reactions - a.reactions)
      .slice(0, 5)

    // Most sociable (user who received most private messages)
    const privateMessagesByRecipient = await db.message.groupBy({
      by: ['toId'],
      where: { 
        isPublic: false,
        toId: { not: null }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 1
    })

    let mostSociable = null
    if (privateMessagesByRecipient.length > 0 && privateMessagesByRecipient[0].toId) {
      const user = await db.user.findUnique({
        where: { id: privateMessagesByRecipient[0].toId },
        select: { username: true }
      })
      mostSociable = {
        username: user?.username || 'Anónimo',
        receivedCount: privateMessagesByRecipient[0]._count.id
      }
    }

    // Fun stats: Favorite emoji
    const reactionsByEmoji = await db.reaction.groupBy({
      by: ['emoji'],
      _count: { emoji: true },
      orderBy: { _count: { emoji: 'desc' } },
      take: 1
    })
    const favoriteEmoji = reactionsByEmoji[0]?.emoji || '❤️'

    // Longest and shortest messages
    const allMessagesContent = await db.message.findMany({
      select: {
        content: true,
        fromId: true
      }
    })

    let longestMessage = { user: 'Anónimo', length: 0 }
    let shortestMessage = { user: 'Anónimo', length: Infinity }

    for (const msg of allMessagesContent) {
      const len = msg.content.length
      if (len > longestMessage.length) {
        const user = msg.fromId ? await db.user.findUnique({ 
          where: { id: msg.fromId },
          select: { username: true }
        }) : null
        longestMessage = { user: user?.username || 'Anónimo', length: len }
      }
      if (len < shortestMessage.length && len > 10) {
        const user = msg.fromId ? await db.user.findUnique({ 
          where: { id: msg.fromId },
          select: { username: true }
        }) : null
        shortestMessage = { user: user?.username || 'Anónimo', length: len }
      }
    }

    // Favorite color (most common style color)
    const messagesWithStyle = await db.message.findMany({
      where: { style: { not: null } },
      select: { style: true }
    })

    const colorCounts: Record<string, number> = {}
    messagesWithStyle.forEach(msg => {
      if (msg.style) {
        try {
          const parsed = JSON.parse(msg.style)
          const color = parsed.color
          colorCounts[color] = (colorCounts[color] || 0) + 1
        } catch (e) {
          // ignore parse errors
        }
      }
    })

    const favoriteColor = Object.entries(colorCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'bg-yellow-200'

    // Achievements
    const achievements = [
      {
        id: 'first_reaction',
        title: 'Primera Reacción',
        description: 'Alguien reaccionó a un mensaje',
        unlocked: totalReactions > 0,
        icon: '🎉'
      },
      {
        id: 'centenario',
        title: 'Centenario',
        description: '100+ mensajes en el sistema',
        unlocked: totalMessages >= 100,
        icon: '💯'
      },
      {
        id: 'viral',
        title: 'Viral',
        description: 'Un mensaje con 10+ reacciones',
        unlocked: topMessages.length > 0 && topMessages[0].reactions >= 10,
        icon: '🔥'
      },
      {
        id: 'estrella',
        title: 'Estrella del Amor',
        description: 'Un usuario con 20+ mensajes',
        unlocked: topSenders.length > 0 && (topSenders[0]?.count ?? 0) >= 20,
        icon: '🌟'
      }
    ]

    return NextResponse.json({
      overview: {
        totalMessages,
        publicMessages,
        privateMessages,
        totalUsers,
        totalReactions,
        avgMessagesPerUser: parseFloat(avgMessagesPerUser as string)
      },
      rankings: {
        topSenders,
        topMessages,
        mostSociable
      },
      funStats: {
        favoriteEmoji,
        longestMessage,
        shortestMessage: shortestMessage.length === Infinity ? { user: 'N/A', length: 0 } : shortestMessage,
        favoriteColor
      },
      achievements
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Error fetching stats' }, { status: 500 })
  }
}
