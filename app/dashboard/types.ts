export interface Reaction {
  emoji: string
  count: number
  userReacted: boolean
}

export interface Message {
  id: string
  content: string
  toName: string | null
  fromId: string | null
  fromUser?: { username: string }
  style: string | null
  isPublic: boolean
  createdAt: string
  reactions?: Reaction[]
  totalReactions?: number
  commentsCount?: number
  spotifyUrl?: string | null
  gifUrl?: string | null
}

export interface User {
  id: string
  username: string
  department: string | null
}
