'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, LogOut, Lock, Eye, EyeOff, Trash2, Trophy, User, HeartOff, AlertTriangle, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Message } from './types'
import ComposeModal from './components/ComposeModal'
import ViewMessageModal from './components/ViewMessageModal'
import AdminStatsView from './components/AdminStatsView'
import ProfileView from './components/ProfileView'
import HallOfFameView from './components/HallOfFameView'
import TourGuide from './components/TourGuide'
import MessageCard from './components/MessageCard'

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'wall' | 'inbox' | 'admin' | 'profile' | 'fame'>('wall')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [areMessagesRevealed, setAreMessagesRevealed] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent')
  const [playingTrack, setPlayingTrack] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  // Pagination State
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Use a ref for page to ensure immediate updates during rapid scrolls
  const pageRef = useRef(0)

  const router = useRouter()

  const [showTour, setShowTour] = useState(false)
  const [isGrinchMode, setIsGrinchMode] = useState(false)

  // Fetch Config (Reveal Status & Admin Check)
  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config')
      if (res.ok) {
        const data = await res.json()
        setAreMessagesRevealed(data.areMessagesRevealed)
        setIsAdmin(data.isAdmin)
        // Show tour if user hasn't seen it
        if (data.hasSeenOnboarding === false) {
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

  const isFetchingRef = useRef(false)

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
              return [...prev, ...newUniqueMessages]
            })
            pageRef.current += 1
          } else {
            setMessages(data.items)
            pageRef.current = 1
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
        fetchMessages()
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

    let interval: NodeJS.Timeout | null = null
    if (activeTab === 'inbox') {
      interval = setInterval(() => {
        fetchMessages()
      }, 5000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeTab, sortBy])

  // Grinch Mode Auto-Revert Timer (1 minute)
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isGrinchMode) {
      timer = setTimeout(() => setIsGrinchMode(false), 60000)
    }
    return () => clearTimeout(timer)
  }, [isGrinchMode])

  return (
    <div className="min-h-screen transition-colors duration-700 relative overflow-hidden" style={{ background: isGrinchMode ? '#0f172a' : 'linear-gradient(to bottom right, #fce7f3, #fef2f2, #fbcfe8)' }}>
      
      {isGrinchMode && (
        <div className="fixed inset-0 pointer-events-none z-0 opacity-20 flex flex-wrap content-center justify-center gap-12 select-none overflow-hidden">
           {Array.from({ length: 40 }).map((_, i) => (
             <span key={i} className="text-6xl animate-pulse grayscale" style={{ animationDelay: `${Math.random()}s`, opacity: Math.random() }}>{Math.random() > 0.5 ? '💀' : '🔥'}</span>
           ))}
        </div>
      )}

      {/* Navbar */}
      <nav className={`sticky top-0 z-40 backdrop-blur-md shadow-sm transition-colors duration-500 ${isGrinchMode ? 'bg-slate-900/90 border-b border-green-900' : 'bg-white/80 border-b border-pink-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-auto min-h-16 py-2 gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xl sm:text-2xl animate-bounce">{isGrinchMode ? '🤮' : '💘'}</span>
              <h1 className={`text-lg sm:text-2xl font-black tracking-tighter whitespace-nowrap ${isGrinchMode ? 'text-green-500 font-mono uppercase' : 'text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-red-500 font-handwriting'}`}>
                {isGrinchMode ? 'NO-AMOR' : 'Buzón'}
                <span className="hidden xs:inline">{isGrinchMode ? '.EXE' : ' del Amor'}</span>
              </h1>
            </div>

            <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
              {/* Grinch Toggle */}
              <button
                onClick={() => setIsGrinchMode(!isGrinchMode)}
                className={`p-2 rounded-full transition-all hover:scale-110 shrink-0 ${isGrinchMode ? 'bg-green-900/30 text-green-400' : 'bg-pink-100/50 text-pink-600'}`}
                title={isGrinchMode ? "Restaurar Amor" : "Modo Grinch"}
              >
                {isGrinchMode ? <HeartOff size={18} /> : <AlertTriangle size={18} className="text-gray-400 hover:text-red-500" />}
              </button>

              <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide mask-linear-fade">
                <button
                  onClick={() => setActiveTab('wall')}
                  className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'wall' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  🏠 <span className="hidden sm:inline">Muro</span>
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

              {/* Admin & Logout Controls */}
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
                title="Cerrar sesión"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {activeTab === 'wall' && (
            <div className="flex bg-gray-100 p-1 rounded-full items-center mb-2 w-fit">
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
      </nav>

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
                <MessageCard 
                  key={msg.id} 
                  msg={msg} 
                  isAdmin={isAdmin}
                  onDelete={deleteMessage}
                  onReaction={handleReaction}
                  onView={setSelectedMessage}
                  onPlay={setPlayingTrack}
                />
              ))}
              {messages.length === 0 && !loading && (
                <div className="col-span-full text-center text-gray-400 py-10">
                  ¡El muro está vacío! Sé el primero en publicar algo.
                </div>
              )}
              {/* Load More Trigger */}
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
                    <Lock size={16} />
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

      {/* Music Player Modal - Centered Dialog */}
      {playingTrack && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setPlayingTrack(null)}
        >
          <div 
            className="w-full max-w-sm bg-transparent relative animate-in zoom-in-50 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setPlayingTrack(null)}
              className="absolute -top-12 right-0 text-white hover:text-pink-500 transition-colors bg-white/10 p-2 rounded-full"
            >
              <X size={24} />
            </button>
            <div className="rounded-xl overflow-hidden shadow-2xl shadow-green-500/20 ring-1 ring-white/10">
              <iframe 
                src={(function(url){
                  try {
                    const match = url?.match(/\/track\/([a-zA-Z0-9]+)/)
                    if (match && match[1]) return `https://open.spotify.com/embed/track/${match[1]}?utm_source=generator&theme=0&autoplay=1`
                    return url || ''
                  } catch (e) { return url || '' }
                })(playingTrack)} 
                width="100%" 
                height="352" 
                frameBorder="0" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                className="bg-zinc-900"
              ></iframe>
            </div>
            <p className="text-center text-white/50 text-sm mt-4 font-handwriting">
              Toca fuera para cerrar
            </p>
          </div>
        </div>
      )}

      {showTour && <TourGuide onComplete={handleTourComplete} />}
    </div>
  )
}