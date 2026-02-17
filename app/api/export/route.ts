import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // Verify admin authentication
    const cookieStore = cookies()
    const token = cookieStore.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const payload = await verifyAuth(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Solo admins pueden exportar' }, { status: 403 })
    }

    // Fetch all messages with full details
    const messages = await prisma.message.findMany({
      include: {
        from: {
          select: { username: true }
        },
        reactions: {
          include: {
            user: {
              select: { username: true }
            }
          }
        },
        comments: {
          include: {
            user: {
              select: { username: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Process reactions to group by emoji
    const processedMessages = messages.map(msg => {
      const reactionMap = new Map<string, { emoji: string; count: number; users: string[] }>()
      
      msg.reactions.forEach(r => {
        const existing = reactionMap.get(r.emoji)
        if (existing) {
          existing.count++
          existing.users.push(r.user.username)
        } else {
          reactionMap.set(r.emoji, {
            emoji: r.emoji,
            count: 1,
            users: [r.user.username]
          })
        }
      })

      const reactions = Array.from(reactionMap.values())

      // Parse style to get theme
      let theme = 'pastel'
      try {
        if (msg.style) {
          const styleObj = JSON.parse(msg.style)
          theme = styleObj.theme || 'pastel'
        }
      } catch (e) {}

      return {
        id: msg.id,
        content: msg.content,
        fromName: msg.from?.username || null,
        toName: msg.toName,
        isPublic: msg.isPublic,
        createdAt: msg.createdAt,
        spotifyUrl: msg.spotifyUrl,
        gifUrl: msg.gifUrl,
        theme,
        reactions,
        comments: msg.comments.map(c => ({
          username: c.user.username,
          content: c.content,
          createdAt: c.createdAt
        }))
      }
    })

    // Calculate statistics
    const totalMessages = messages.length
    const publicMessages = messages.filter(m => m.isPublic).length
    const privateMessages = messages.filter(m => !m.isPublic).length
    const totalReactions = messages.reduce((sum, m) => sum + m.reactions.length, 0)
    const totalComments = messages.reduce((sum, m) => sum + m.comments.length, 0)

    return NextResponse.json({
      totalMessages,
      publicMessages,
      privateMessages,
      totalReactions,
      totalComments,
      messages: processedMessages
    })
  } catch (error) {
    console.error('Error in export API:', error)
    return NextResponse.json({ error: 'Error al generar exportación' }, { status: 500 })
  }
}
