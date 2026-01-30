import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = session.user.id

    // Personal stats
    const messagesSent = await db.message.count({
      where: { fromId: userId }
    })

    const messagesReceived = await db.message.count({
      where: { 
        OR: [
          { toId: userId },
          { toName: session.user.username }
        ]
      }
    })

    // Reactions received on user's messages
    const userMessages = await db.message.findMany({
      where: { fromId: userId },
      select: {
        id: true,
        content: true,
        reactions: true
      }
    })

    const reactionsReceived = userMessages.reduce((sum, msg) => sum + msg.reactions.length, 0)

    // Most popular message
    const mostPopular = userMessages
      .map(msg => ({
        id: msg.id,
        content: msg.content,
        reactions: msg.reactions.length
      }))
      .sort((a, b) => b.reactions - a.reactions)[0] || null

    // Level calculation
    const getLevelInfo = (count: number) => {
      if (count === 0) return { title: 'Nuevo', icon: '🌱', progress: 0 }
      if (count <= 5) return { title: 'Tímido', icon: '😊', progress: (count / 5) * 100 }
      if (count <= 15) return { title: 'Cariñoso', icon: '💕', progress: ((count - 5) / 10) * 100 }
      if (count <= 30) return { title: 'Romántico', icon: '💖', progress: ((count - 15) / 15) * 100 }
      return { title: 'Cupido', icon: '💘', progress: 100 }
    }

    const level = getLevelInfo(messagesSent)

    // Badges
    const badges = [
      {
        id: 'first_carta',
        title: 'Primera Carta',
        icon: '🎉',
        unlocked: messagesSent >= 1
      },
      {
        id: 'prolifico',
        title: 'Prolífico',
        icon: '💯',
        unlocked: messagesSent >= 10
      },
      {
        id: 'estrella',
        title: 'Estrella',
        icon: '⭐',
        unlocked: reactionsReceived >= 20
      },
      {
        id: 'viral',
        title: 'Viral',
        icon: '🔥',
        unlocked: mostPopular ? mostPopular.reactions >= 5 : false
      },
      {
        id: 'conversador',
        title: 'Conversador',
        icon: '💬',
        unlocked: messagesReceived >= 5
      }
    ]

    // Streak (simplified - would need a separate table to track properly)
    // For now, just return 0
    const streak = 0

    return NextResponse.json({
      personalStats: {
        messagesSent,
        messagesReceived,
        reactionsReceived,
        mostPopularMessage: mostPopular
      },
      level,
      badges,
      streak
    })
  } catch (error) {
    console.error('Profile error:', error)
    return NextResponse.json({ error: 'Error fetching profile' }, { status: 500 })
  }
}
