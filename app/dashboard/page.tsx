'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, LogOut, Send, X, Users, Lock, ChevronDown, Eye, EyeOff, Trash2, Sparkles, Trophy, User, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Reaction {
  emoji: string
  count: number
  userReacted: boolean
}

interface Message {
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
}



interface User {
  id: string
  username: string
  department: string | null
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'wall' | 'inbox' | 'admin' | 'profile' | 'fame'>('wall')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [areMessagesRevealed, setAreMessagesRevealed] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent')
  const [stats, setStats] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  
  
  // Pagination State
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  
  // Use a ref for page to ensure immediate updates during rapid scrolls and avoid closure staleness
  const pageRef = useRef(0) 

  const router = useRouter()

  const [showTour, setShowTour] = useState(false)

  // Fetch Config (Reveal Status & Admin Check)
  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config')
      if (res.ok) {
        const data = await res.json()
        console.log('Config Data:', data) // Debug
        setAreMessagesRevealed(data.areMessagesRevealed)
        setIsAdmin(data.isAdmin)
        // Show tour if user hasn't seen it
        if (data.hasSeenOnboarding === false) {
          console.log('Showing tour...') // Debug
          setShowTour(true)
        }
      }
    } catch (error) {
       console.error(error)
    }
  }

  const handleTourComplete = async () => {
    setShowTour(false)
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasSeenOnboarding: true })
      })
    } catch (err) {
      console.error('Failed to update onboarding status', err)
    }
  }

  const isFetchingRef = useRef(false) // Lock to prevent duplicate requests

  // Fetch Messages
  const fetchMessages = useCallback(async (isLoadMore = false) => {
    if (isFetchingRef.current) return
    
    // Safety check: if loading more but no more data, stop
    if (isLoadMore && !hasMore) return

    isFetchingRef.current = true

    try {
      if (isLoadMore) {
        setIsLoadingMore(true)
      } else {
        setLoading(true)
        // Reset page on full refresh
        pageRef.current = 0
      }
      
      let url = `/api/messages?type=${activeTab}&sort=${sortBy}`
      
      // Pagination for wall
      if (activeTab === 'wall') {
        const limit = 20
        const skip = pageRef.current * limit
        url += `&skip=${skip}&limit=${limit}`
      }

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        
        if (activeTab === 'wall') {
           // Handle paginated response
           if (isLoadMore) {
             setMessages(prev => {
               // Deduplicate messages by ID
               const existingIds = new Set(prev.map(m => m.id))
               const newUniqueMessages = data.items.filter((m: any) => !existingIds.has(m.id))
               
               // Only increment page if we successfully fetched details, 
               // but honestly we should increment regardless to advance the cursor on the DB side
               return [...prev, ...newUniqueMessages]
             })
             pageRef.current += 1
           } else {
             setMessages(data.items)
             pageRef.current = 1 // Next page will be 1
           }
           setHasMore(data.hasMore)
        } else {
          // Standard array response for other tabs
          setMessages(data)
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
      setIsLoadingMore(false)
      // Small timeout to prevent immediate re-triggering if observer is still intersecting
      setTimeout(() => {
        isFetchingRef.current = false
      }, 500)
    }
  }, [activeTab, sortBy, hasMore])

  // Toggle Reveal (Admin Only)
  const toggleReveal = async () => {
    const newState = !areMessagesRevealed
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reveal: newState })
      })
      setAreMessagesRevealed(newState)
    } catch (error) {
      console.error(error)
    }
  }

  // Handle Reaction
  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, emoji })
      })
      fetchMessages() // Refresh to get updated reactions
    } catch (error) {
      console.error(error)
    }
  }

  // Delete Message (Admin Only)
  const deleteMessage = async (id: string) => {
    if (!confirm('¿Seguro que quieres borrar este mensaje?')) return
    try {
      const res = await fetch(`/api/messages?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchMessages() // Refresh list
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Fetch Stats (Admin Only)
  const fetchStats = async () => {
    if (!isAdmin) return
    try {
      const res = await fetch('/api/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Infinite Scroll Observer
  useEffect(() => {
    // Don't observe if no more items, not on wall, or currently initial loading
    if (!hasMore || activeTab !== 'wall' || loading) return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchMessages(true)
      }
    }, { rootMargin: '100px' })

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, activeTab, loading, fetchMessages]) 

  // Fetch Profile
  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    const init = async () => {
      await fetchConfig()
      
      if (activeTab === 'admin') {
        fetchStats()
        fetchMessages()
      } else if (activeTab === 'profile') {
        fetchProfile()
      } else if (activeTab === 'fame' || activeTab === 'wall' || activeTab === 'inbox') {
        fetchMessages()
      }
    }
    init()
    
    // Poll messages only for inbox (Wall uses infinite scroll now, so no auto-poll or it jumps)
    let interval: NodeJS.Timeout | null = null
    if (activeTab === 'inbox') {
      interval = setInterval(() => {
        fetchMessages()
      }, 5000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeTab, sortBy])

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans text-gray-900">
      {/* App Bar */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-stone-200 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💘</span>
          <h1 className="font-bold text-gray-800 hidden sm:block font-handwriting text-xl">Buzón del Amor (v3.0)</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-full items-center overflow-x-auto max-w-[200px] sm:max-w-none scrollbar-hide">
            <button 
              onClick={() => setActiveTab('wall')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'wall' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Users size={16} /> <span className="hidden sm:inline">Muro</span>
            </button>
            <button 
              onClick={() => setActiveTab('fame')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'fame' ? 'bg-white shadow-sm text-orange-500' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Trophy size={16} /> <span className="hidden sm:inline">Fama</span>
            </button>
            <button 
              onClick={() => setActiveTab('inbox')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'inbox' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Lock size={16} /> <span className="hidden sm:inline">Buzón</span>
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'profile' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <User size={16} /> <span className="hidden sm:inline">Perfil</span>
            </button>
            {isAdmin && (
              <button 
                onClick={() => setActiveTab('admin')}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'admin' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Eye size={16} /> <span className="hidden sm:inline">Admin</span>
              </button>
            )}
          </div>
          
          {activeTab === 'wall' && (
            <div className="flex bg-gray-100 p-1 rounded-full items-center">
              <button 
                onClick={() => setSortBy('recent')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${sortBy === 'recent' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}
              >
                Recientes
              </button>
              <button 
                onClick={() => setSortBy('popular')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${sortBy === 'popular' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}
              >
                🔥 Populares
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button 
              onClick={toggleReveal}
              className={`p-2 rounded-full transition-colors hidden sm:block ${areMessagesRevealed ? 'text-green-600 bg-green-50' : 'text-orange-500 bg-orange-50'}`}
              title={areMessagesRevealed ? "Ocultar cartas" : "Liberar cartas"}
            >
              {areMessagesRevealed ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          )}

          <button 
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' })
              router.push('/login')
              router.refresh()
            }}
            className="p-2 text-gray-500 hover:text-red-500 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 relative">
        <AnimatePresence mode="wait">
          {activeTab === 'wall' ? (
            <motion.div 
              key="wall"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
            >
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`aspect-square p-4 shadow-md rounded-sm flex flex-col items-center justify-center text-center transition-transform hover:scale-105 relative group ${msg.style ? JSON.parse(msg.style).color : 'bg-yellow-200'}`}
                  style={{ transform: msg.style ? `rotate(${JSON.parse(msg.style).rotation}deg)` : 'rotate(0deg)' }}
                >
               

                  {isAdmin && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id); }}
                      className="absolute top-2 right-2 p-1.5 bg-white/50 hover:bg-red-500 hover:text-white rounded-full text-gray-500 opacity-0 group-hover:opacity-100 transition-all custom-delete-btn z-10"
                      title="Borrar mensaje"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  
                  <div 
                    onClick={() => setSelectedMessage(msg)}
                    className="flex-1 flex flex-col items-center justify-center cursor-pointer w-full"
                  >
                    <p className="font-handwriting text-lg leading-tight mb-2 text-gray-900 line-clamp-6 overflow-hidden text-ellipsis">{msg.content}</p>
                    <div className="mt-auto flex w-full justify-between items-end text-xs opacity-70 text-gray-800">
                      <div>Para: {msg.toName || 'Todos'}</div>
                      {msg.commentsCount !== undefined && msg.commentsCount > 0 && (
                        <div className="flex items-center gap-1 font-bold">
                          <span>💬</span> {msg.commentsCount}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reaction Section */}
                  <div className="w-full mt-2 pt-2 border-t border-black/10">
                    {/* Show existing reactions */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-center mb-1">
                        {msg.reactions.map((reaction, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, reaction.emoji); }}
                            className={`text-xs px-1.5 py-0.5 rounded-full transition-all ${
                              reaction.userReacted 
                                ? 'bg-pink-200 ring-2 ring-pink-400 scale-110' 
                                : 'bg-white/50 hover:bg-white/80'
                            }`}
                          >
                            {reaction.emoji} {reaction.count}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Emoji picker on hover */}
                    <div className="flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {['❤️', '😂', '👏', '🔥', '😍', '🎉'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, emoji); }}
                          className="text-sm hover:scale-125 transition-transform bg-white/70 rounded-full w-6 h-6 flex items-center justify-center hover:bg-white"
                          title={`Reaccionar con ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {messages.length === 0 && !loading && (
                <div className="col-span-full text-center text-gray-400 py-10">
                  ¡El muro está vacío! Sé el primero en publicar algo.
                </div>
              )}
               {/* Load More Trigger */}
               {/* Auto-Load Sentinel */}
               {/* Auto-Load Sentinel */}
               {activeTab === 'wall' && hasMore && (
                 <div 
                   ref={sentinelRef}
                   className="col-span-full flex flex-col items-center justify-center py-8 gap-2"
                 >
                   {isLoadingMore ? (
                      <div className="flex items-center gap-2 text-gray-400 bg-white px-4 py-2 rounded-full shadow-sm">
                        <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium">Cargando amor...</span>
                      </div>
                   ) : (
                     <button 
                       onClick={() => fetchMessages(true)}
                       className="px-6 py-2 bg-white text-pink-500 font-bold rounded-full shadow-sm border border-pink-100 hover:bg-pink-50 hover:shadow-md transition-all text-sm flex items-center gap-2"
                     >
                       <span>💞</span> Ver más cartas
                     </button>
                   )}
                 </div>
               )}
            </motion.div>
          ) : activeTab === 'inbox' ? (
             <motion.div 
              key="inbox"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto space-y-4"
            >
               {!areMessagesRevealed && !isAdmin && (
                <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-lg text-center mb-4">
                  ⏳ <strong>¡Shhh!</strong> Las cartas están encriptadas hasta el gran momento.
                </div>
              )}

              <h2 className="text-xl font-semibold text-gray-700 mb-4 font-handwriting">Tus Mensajes Privados</h2>
              {messages.map((msg) => (
                 <div key={msg.id} className="bg-white p-6 rounded-xl shadow-sm border border-pink-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 text-pink-200">
                      <Lock size={16}/>
                    </div>
                    
                    {/* Content Logic */}
                    {areMessagesRevealed || isAdmin ? (
                       <p className="text-gray-800 text-lg">{msg.content}</p>
                    ) : (
                       <div className="relative">
                          {/* Blurred text mask */}
                          <p className="text-gray-800 text-lg blur-md select-none opacity-50">
                            {msg.content === '🔒 Mensaje secreto' ? 'Este es un mensaje secreto muy largo para hacer bulto' : msg.content} 
                          </p>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-white/80 px-3 py-1 rounded-full text-xs font-bold text-gray-500 shadow-sm border">
                              SECRETO
                            </span>
                          </div>
                      </div>
                    )}
                 </div>
              ))}
               {messages.length === 0 && !loading && (
                <div className="text-center text-gray-500 py-10 bg-white rounded-lg border border-dashed border-gray-300">
                  No tienes mensajes secretos... todavía. 🤫
                </div>
              )}
            </motion.div>
          ) : activeTab === 'profile' ? (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ProfileView profile={profile} />
            </motion.div>
          ) : activeTab === 'fame' ? (
            <motion.div 
              key="fame"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <HallOfFameView messages={messages} />
            </motion.div>
          ) : activeTab === 'admin' ? (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
               <AdminStatsView stats={stats} messages={messages} />
            </motion.div>
          ) : null
          }
        </AnimatePresence>
      </main>

      {/* Floating Action Button */}
      {activeTab !== 'admin' && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsComposeOpen(true)}
          aria-label="Escribir carta"
          className="fixed bottom-8 right-8 bg-pink-600 text-white p-4 rounded-full shadow-lg hover:bg-pink-700 transition-colors z-40"
        >
          <Plus size={24} />
        </motion.button>
      )}

          {/* View Modal */}
          {selectedMessage && (
            <ViewMessageModal 
              message={selectedMessage} 
              onClose={() => setSelectedMessage(null)} 
            />
          )}

      {/* Compose Modal */}
        {isComposeOpen && (
          <ComposeModal 
            onClose={() => setIsComposeOpen(false)} 
            onSent={() => { fetchMessages(); setIsComposeOpen(false); }} 
          />
        )}
      
      {showTour && <TourGuide onComplete={handleTourComplete} />}
    </div>
  )
}

function ComposeModal({ onClose, onSent }: { onClose: () => void, onSent: () => void }) {
  const [content, setContent] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [toName, setToName] = useState('')
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])

  // Fetch users when opening modal
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users')
        if (res.ok) {
          setUsers(await res.json())
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchUsers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          toName: isPublic ? null : toName,
          isPublic
          // Style is now generated server-side
        })
      })

      if (res.ok) {
        onSent()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="bg-pink-600 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold">Nueva Nota</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
            <textarea 
              required
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-pink-500 focus:border-transparent min-h-[100px] text-gray-900 placeholder:text-gray-400"
              placeholder="Escribe algo bonito..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="flex gap-4">
            <label className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${isPublic ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-200'}`}>
              <Users className={isPublic ? 'text-pink-600' : 'text-gray-400'} />
              <span className={`text-sm font-medium ${isPublic ? 'text-pink-700' : 'text-gray-500'}`}>Público (Muro)</span>
              <input type="radio" className="hidden" checked={isPublic} onChange={() => setIsPublic(true)} />
            </label>

            <label className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${!isPublic ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-200'}`}>
              <Lock className={!isPublic ? 'text-pink-600' : 'text-gray-400'} />
              <span className={`text-sm font-medium ${!isPublic ? 'text-pink-700' : 'text-gray-500'}`}>Privado</span>
              <input type="radio" className="hidden" checked={!isPublic} onChange={() => setIsPublic(false)} />
            </label>
          </div>

          {!isPublic && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
              <label className="block text-sm font-medium text-gray-700 mb-1">¿Para quién?</label>
              <div className="relative">
                <select 
                  required={!isPublic}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-pink-500 appearance-none text-gray-900 bg-white"
                  value={toName}
                  onChange={(e) => setToName(e.target.value)}
                >
                  <option value="">Selecciona un compañero...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.username}>
                      {u.username}{u.department ? ` (${u.department})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={16} />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                * Si no está en la lista, dile que se registre primero 😉
              </p>
            </motion.div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-pink-600 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-pink-700 transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send size={18} />
            {loading ? 'Enviando...' : 'Pegar Nota'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

function ViewMessageModal({ message, onClose }: { message: Message, onClose: () => void }) {
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/comments?messageId=${message.id}`)
        if (res.ok) {
           setComments(await res.json())
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchComments()
  }, [message.id])

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSending(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messageId: message.id, 
          content: newComment,
          isAnonymous
        })
      })
      
      if (res.ok) {
        const savedComment = await res.json()
        setComments([...comments, savedComment])
        setNewComment('')
        setIsAnonymous(false) // Reset
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] bg-white`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Message Content */}
        <div className={`p-8 relative ${message.style ? JSON.parse(message.style).color : 'bg-gray-100'} min-h-[200px] flex flex-col justify-center text-center`}>
           <button onClick={onClose} className="absolute top-4 right-4 bg-black/10 hover:bg-black/20 p-2 rounded-full transition-colors z-10">
            <X size={20} className="text-gray-800" />
          </button>
          
          <p className="font-handwriting text-3xl leading-snug text-gray-900 mb-4 break-words whitespace-pre-wrap">
            {message.content}
          </p>

          <div className="mt-auto pt-4 border-t border-black/10 w-full flex justify-between items-end text-sm text-gray-800 font-medium opacity-80">
            <div className="text-left">
              <span className="block text-xs uppercase tracking-wider opacity-60">Para</span>
              {message.toName || 'Todos (Muro)'}
            </div>
            <div className="text-right">
               <span className="block text-xs uppercase tracking-wider opacity-60">Enviado</span>
               {new Date(message.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col">
           <div className="p-4 space-y-4">
             <h4 className="font-bold text-gray-700 flex items-center gap-2">
               💬 Comentarios ({comments.length})
             </h4>

             {loading ? (
               <div className="text-center py-8 text-gray-400">Cargando chismes...</div>
             ) : comments.length === 0 ? (
               <div className="text-center py-8 text-gray-400 italic">Nadie ha dicho nada aún. ¡Sé el primero!</div>
             ) : (
               <div className="space-y-3">
                 {comments.map((comment) => (
                   <div key={comment.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                     <div className="flex justify-between items-start mb-1">
                       <span className="font-bold text-sm text-pink-600">
                         {comment.user.username} 
                         {comment.user.department && <span className="text-gray-400 font-normal text-xs ml-1">({comment.user.department})</span>}
                       </span>
                       <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                     </div>
                     <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.content}</p>
                   </div>
                 ))}
               </div>
             )}
           </div>
        </div>

        {/* Add Comment Input */}
        <form onSubmit={handleSendComment} className="p-4 bg-white border-t border-gray-200">
           <div className="flex items-center gap-2 mb-2">
             <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer hover:text-pink-600 transition-colors">
               <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${isAnonymous ? 'bg-pink-500 border-pink-500 text-white' : 'border-gray-300 bg-white'}`}>
                 {isAnonymous && <Check size={10} strokeWidth={4} />}
               </div>
               <input 
                  type="checkbox" 
                  checked={isAnonymous} 
                  onChange={(e) => setIsAnonymous(e.target.checked)} 
                  className="hidden" 
                />
               <span>Comentar como Anónimo 👻</span>
             </label>
           </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={isAnonymous ? "Escribe un comentario anónimo..." : "Escribe un comentario..."}
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none text-sm"
              disabled={sending}
            />
            <button 
              type="submit" 
              disabled={sending || !newComment.trim()}
              className="bg-pink-600 text-white p-2 rounded-full hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

function AdminStatsView({ stats, messages }: { stats: any, messages: any[] }) {
  if (!stats) return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando estadísticas...</div>

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8 animate-in fade-in duration-500">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-2xl shadow-sm border border-pink-100">
          <div className="text-3xl mb-2">📬</div>
          <div className="text-3xl font-bold text-pink-600">{stats.overview.totalMessages}</div>
          <div className="text-sm text-gray-600">Total Mensajes</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl shadow-sm border border-blue-100">
          <div className="text-3xl mb-2">👥</div>
          <div className="text-3xl font-bold text-blue-600">{stats.overview.totalUsers}</div>
          <div className="text-sm text-gray-600">Usuarios Activos</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl shadow-sm border border-red-100">
          <div className="text-3xl mb-2">❤️</div>
          <div className="text-3xl font-bold text-red-600">{stats.overview.totalReactions}</div>
          <div className="text-sm text-gray-600">Total Reacciones</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl shadow-sm border border-purple-100">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-3xl font-bold text-purple-600">{stats.overview.avgMessagesPerUser}</div>
          <div className="text-sm text-gray-600">Promedio/Usuario</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Romantics */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            🏆 Top 5 Románticos
          </h3>
          <div className="space-y-3">
            {stats.rankings.topSenders.map((user: any, i: number) => (
              <div key={user.username} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-600'}`}>
                    {i + 1}
                  </div>
                  <span className="font-medium text-gray-700">{user.username}</span>
                </div>
                <div className="flex items-center gap-1 text-pink-500 font-bold">
                  {user.count} 💌
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fun Stats Grid */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            😄 Curiosidades
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-orange-50 rounded-xl text-center">
              <div className="text-sm text-gray-500 mb-1">Emoji Favorito</div>
              <div className="text-4xl">{stats.funStats.favoriteEmoji}</div>
            </div>
            <div className={`p-4 rounded-xl text-center shadow-sm ${stats.funStats.favoriteColor}`}>
              <div className="text-sm text-gray-800/60 mb-1">Color Favorito</div>
              <div className="text-xl font-bold text-gray-800/80">Este!</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl col-span-2">
              <div className="text-sm text-gray-500 mb-2">✍️ El Más Expresivo</div>
              <div className="font-bold text-purple-700">{stats.funStats.longestMessage.user}</div>
              <div className="text-xs text-gray-400">{stats.funStats.longestMessage.length} caracteres</div>
            </div>
          </div>
        </div>
      </div>

       {/* Achievements */}
       <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          🎖️ Logros del Sistema
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {stats.achievements.map((badge: any) => (
            <div key={badge.id} className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${badge.unlocked ? 'bg-gradient-to-b from-yellow-50 to-white border-yellow-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 grayscale'}`}>
              <div className="text-4xl mb-2 filter drop-shadow-sm">{badge.icon}</div>
              <div className="font-bold text-gray-800 text-sm mb-1">{badge.title}</div>
              <div className="text-xs text-gray-500">{badge.description}</div>
              {badge.unlocked && <div className="mt-2 text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">DESBLOQUEADO</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Message Log - Inserted */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          📜 Registro de Mensajes
        </h3>
        <div className="overflow-x-auto">
           <table className="w-full text-sm text-left">
             <thead className="bg-gray-50 text-gray-500 uppercase font-medium">
               <tr>
                 <th className="p-3 rounded-tl-lg">Fecha</th>
                 <th className="p-3">De</th>
                 <th className="p-3">Para</th>
                 <th className="p-3">Mensaje</th>
                 <th className="p-3 rounded-tr-lg">Tipo</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {messages.map((msg: any) => (
                 <tr key={msg.id} className="hover:bg-gray-50 transition-colors">
                   <td className="p-3 text-gray-400 whitespace-nowrap">
                     {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </td>
                   <td className="p-3 font-medium text-purple-600">
                     {msg.fromUser ? msg.fromUser.username : <span className="text-gray-400 italic">Anónimo</span>}
                   </td>
                   <td className="p-3 font-medium text-pink-600">
                     {msg.toName || <span className="text-gray-400">Todos</span>}
                   </td>
                   <td className="p-3 text-gray-700 max-w-xs truncate" title={msg.content}>
                     {msg.content}
                   </td>
                   <td className="p-3">
                     {msg.isPublic ? (
                       <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">Público</span>
                     ) : (
                       <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-bold">Privado</span>
                     )}
                   </td>
                 </tr>
               ))}
               {messages.length === 0 && (
                 <tr>
                   <td colSpan={5} className="p-8 text-center text-gray-400">
                     No hay mensajes registrados.
                   </td>
                 </tr>
               )}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  )
}

function ProfileView({ profile }: { profile: any }) {
  if (!profile) return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando perfil...</div>

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
        <div className="w-24 h-24 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full flex items-center justify-center text-5xl shadow-inner animate-bounce">
          {profile.level.icon}
        </div>
        <div className="flex-1 space-y-2 w-full">
          <h2 className="text-2xl font-bold text-gray-800">Tu Nivel: <span className="text-pink-600">{profile.level.title}</span></h2>
          <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-gradient-to-r from-pink-400 to-purple-500 absolute top-0 left-0 transition-all duration-1000 ease-out"
              style={{ width: `${profile.level.progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">
            {profile.personalStats.messagesSent} mensajes enviados • Sigue enviando para subir de nivel!
          </p>
        </div>
        <div className="text-center bg-orange-50 p-3 rounded-xl border border-orange-100">
           <div className="text-2xl font-bold text-orange-600">{profile.streak} 🔥</div>
           <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Racha Días</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200 text-center hover:scale-105 transition-transform">
          <div className="text-2xl mb-1">📨</div>
          <div className="font-bold text-2xl text-gray-800">{profile.personalStats.messagesSent}</div>
          <div className="text-xs text-gray-500">Enviados</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200 text-center hover:scale-105 transition-transform">
          <div className="text-2xl mb-1">💌</div>
          <div className="font-bold text-2xl text-gray-800">{profile.personalStats.messagesReceived}</div>
          <div className="text-xs text-gray-500">Recibidos</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200 text-center hover:scale-105 transition-transform">
          <div className="text-2xl mb-1">❤️</div>
          <div className="font-bold text-2xl text-gray-800">{profile.personalStats.reactionsReceived}</div>
          <div className="text-xs text-gray-500">Reacciones</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-200 text-center hover:scale-105 transition-transform">
          <div className="text-2xl mb-1">🏆</div>
          <div className="font-bold text-2xl text-gray-800">{profile.personalStats.mostPopularMessage?.reactions || 0}</div>
          <div className="text-xs text-gray-500">Max Reacciones</div>
        </div>
      </div>

      {/* Badges */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          🏅 Tus Medallas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {profile.badges.map((badge: any) => (
             <div key={badge.id} className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${badge.unlocked ? 'bg-gradient-to-b from-yellow-50 to-white border-yellow-200 shadow-sm transform hover:scale-105' : 'bg-gray-50 border-gray-200 opacity-50 grayscale'}`}>
              <div className="text-4xl mb-2 drop-shadow-sm">{badge.icon}</div>
              <div className="font-bold text-gray-800 text-sm">{badge.title}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HallOfFameView({ messages }: { messages: Message[] }) {
  // Messages are already sorted by popularity from API call
  const topMessages = messages
    .filter(m => m.totalReactions && m.totalReactions > 0)
    .slice(0, 10)

  if (topMessages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 animate-in zoom-in duration-500">
        <div className="text-6xl animate-bounce">🏆</div>
        <h3 className="text-xl font-bold text-gray-800">El Salón de la Fama está vacío</h3>
        <p className="text-gray-500 max-w-md">
          Sé el primero en obtener reacciones y aparecer aquí. ¡Envía mensajes creativos y divertidos!
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 animate-in fade-in duration-500">
      <div className="text-center mb-10 space-y-2">
        <h2 className="text-3xl font-bold text-gray-800 font-handwriting transform -rotate-1">🌟 Salón de la Fama 🌟</h2>
        <p className="text-gray-600">Los mensajes más legendarios de todos los tiempos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topMessages.map((msg, index) => (
          <div key={msg.id} className="relative group">
            <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg z-10 border-4 border-white ${index === 0 ? 'bg-yellow-400 scale-110' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-pink-400'}`}>
              #{index + 1}
            </div>
            {index === 0 && <div className="absolute -top-8 left-0 right-0 text-center text-2xl animate-bounce">👑</div>}
            
            <div 
              className={`aspect-video md:aspect-square p-6 shadow-lg rounded-2xl flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02] relative ${msg.style ? JSON.parse(msg.style).color : 'bg-yellow-200'}`}
              style={{ transform: msg.style ? `rotate(${JSON.parse(msg.style).rotation}deg)` : 'rotate(0deg)' }}
            >
               <div className="font-handwriting text-2xl text-gray-800 mb-4 line-clamp-6">
                "{msg.content}"
              </div>
              <div className="mt-auto flex items-center gap-2 bg-white/40 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-sm">
                <span>🔥</span>
                <span className="font-bold text-gray-800">{msg.totalReactions} reacciones</span>
              </div>
              {msg.toName && (
                <div className="absolute bottom-2 right-2 text-xs opacity-60 font-medium">
                  Para: {msg.toName}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}



function TourGuide({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  
  const steps = [
    {
      title: "¡Bienvenido al Buzón del Amor! 💘",
      content: "Aquí podrás compartir mensajes anónimos (o no) con tus compañeros de clase. ¡Prepárate para el 14 de Febrero!",
      target: "body", 
    },
    {
      title: "El Muro 🧱",
      content: "Aquí verás los mensajes públicos. Puedes explorarlos y ver qué dice la gente.",
      target: "button[data-tab='wall']", 
    },
    {
      title: "Reacciona y Responde ❤️",
      content: "¡No seas tímido! Dale amor a las cartas con emojis y haz clic en ellas para dejar un comentario (anónimo si quieres 👻).",
      target: "body", // General focus
    },
    {
      title: "Tu Buzón 💌",
      content: "Los mensajes privados que recibas aparecerán aquí. ¡Solo sus ojos pueden verlos!",
      target: "button[data-tab='inbox']", 
    },
    {
      title: "¡Exprésate! ✍️",
      content: "Usa este botón para escribir una carta nueva. Elige el estilo, destinatario y si quieres mantener el secreto.",
      target: "button[aria-label='Escribir carta']", 
    },
    {
      title: "Tu Perfil 👤",
      content: "Mira tus estadísticas, medallas y sube de nivel. ¿Serás el próximo Cupido?",
      target: "button[data-tab='profile']", 
    }
  ]

  const currentStep = steps[step]

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      onComplete()
    }
  }

  // Floating emojis for background effect
  const floatingEmojis = ['❤️', '💘', '💌', '✨', '🌹', '🍫']

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-hidden">
      {/* Background Anime Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingEmojis.map((emoji, i) => (
          <motion.div
            key={i}
            initial={{ y: '100vh', x: Math.random() * 100 + 'vw', opacity: 0 }}
            animate={{ 
              y: '-100vh', 
              opacity: [0, 1, 0],
              rotate: [0, 360],
              scale: [0.5, 1.5, 0.5]
            }}
            transition={{ 
              duration: 10 + Math.random() * 10, 
              repeat: Infinity, 
              delay: Math.random() * 5,
              ease: "linear"
            }}
            className="absolute text-4xl opacity-20"
          >
            {emoji}
          </motion.div>
        ))}
      </div>

      <motion.div 
        key={step}
        initial={{ opacity: 0, scale: 0.8, y: 50, rotate: -5 }}
        animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -50, rotate: 5 }}
        transition={{ type: "spring", damping: 15, stiffness: 100 }}
        className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 relative overflow-hidden text-center border-4 border-pink-200"
      >
        {/* Decorative Circles */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>

        <div className="relative z-10">
          <div className="mb-6">
             <motion.div 
               initial={{ scale: 0 }}
               animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
               transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
               className="text-6xl mb-4 inline-block drop-shadow-md"
             >
               {currentStep.title.split(' ').pop()}
             </motion.div>
             <h3 className="text-2xl font-black text-gray-800 mb-3 leading-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600">
               {currentStep.title}
             </h3>
             <p className="text-gray-600 font-medium leading-relaxed">
               {currentStep.content}
             </p>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6 overflow-hidden">
            <motion.div 
              className="bg-gradient-to-r from-pink-500 to-purple-600 h-2.5 rounded-full"
              initial={{ width: `${(step / steps.length) * 100}%` }}
              animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="flex justify-between items-center">
            <button 
               onClick={onComplete}
               className="text-gray-400 hover:text-gray-600 text-sm font-semibold underline decoration-dotted"
            >
               Saltar
            </button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-pink-500/30 transition-all flex items-center gap-2 group"
            >
              {step === steps.length - 1 ? '¡Vamos! 🚀' : <span>Siguiente <span className="inline-block transition-transform group-hover:translate-x-1">→</span></span>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
