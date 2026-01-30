import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { createRateLimiter, getClientIp, sanitizeContent } from '@/lib/rate-limit'

// Rate limiter: 10 comments per minute
const commentRateLimiter = createRateLimiter(10, 60 * 1000)

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const messageId = searchParams.get('messageId')

  if (!messageId) {
    return NextResponse.json({ error: 'Missing messageId' }, { status: 400 })
  }

  try {
    const comments = await db.comment.findMany({
      where: { messageId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: { username: true, department: true }
        }
      }
    })

    const formattedComments = comments.map(c => {
      if (c.isAnonymous) {
        return {
          ...c,
          userId: 'anonymous', // Mask specific ID
          user: {
            username: 'Anónimo 👻',
            department: null
          }
        }
      }
      return c
    })

    return NextResponse.json(formattedComments)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching comments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientIp = getClientIp(request)
  if (!commentRateLimiter.check(clientIp)) {
    return NextResponse.json({ 
      error: 'Demasiados comentarios. Relájate un poco.' 
    }, { status: 429 })
  }

  try {
    const { messageId, content, isAnonymous } = await request.json()

    if (!messageId || !content) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    const cleanContent = sanitizeContent(content)
    
    if (cleanContent.length === 0 || cleanContent.length > 200) {
      return NextResponse.json({ error: 'El comentario debe tener entre 1 y 200 caracteres' }, { status: 400 })
    }

    const comment = await db.comment.create({
      data: {
        content: cleanContent,
        messageId,
        userId: session.user.id,
        isAnonymous: isAnonymous || false
      },
      include: {
        user: {
          select: { username: true } // Return user info immediately for UI update
        }
      }
    })

    // If anonymous, mask the returned user immediately so UI updates correctly
    if (comment.isAnonymous) {
      (comment as any).user = { username: 'Anónimo 👻', department: null };
      (comment as any).userId = 'anonymous';
    }

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Comment error:', error)
    return NextResponse.json({ error: 'Error posting comment' }, { status: 500 })
  }
}
