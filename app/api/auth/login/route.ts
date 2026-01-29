import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db' // Ensure this exists
import { encrypt } from '@/lib/auth'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { username, password } = body

  if (!username || !password) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  try {
    // 1. Check if user exists
    let user = await db.user.findUnique({
      where: { username }
    })

    if (!user) {
      // Create new user (Ad-hoc registration as discussed)
      const hashedPassword = await bcrypt.hash(password, 10)
      user = await db.user.create({
        data: {
          username,
          password: hashedPassword,
        }
      })
    } else {
      // Verify password
      const isValid = await bcrypt.compare(password, user.password)
      if (!isValid) {
        return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
      }
    }

    // 2. Create Session
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const session = await encrypt({ user: { id: user.id, username: user.username, isAdmin: user.isAdmin }, expires })

    // 3. Set Cookie
    const cookieStore = await cookies()
    cookieStore.set('session', session, { expires, httpOnly: true })

    return NextResponse.json({ success: true, user: { id: user.id, username: user.username } })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
