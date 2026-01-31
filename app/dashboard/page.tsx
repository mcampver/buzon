'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, LogOut, Lock, Eye, EyeOff, Trash2, Trophy, User, HeartOff, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Message } from './types'
import ComposeModal from './components/ComposeModal'
import ViewMessageModal from './components/ViewMessageModal'
import AdminStatsView from './components/AdminStatsView'
import ProfileView from './components/ProfileView'
import HallOfFameView from './components/HallOfFameView'
import TourGuide from './components/TourGuide'

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
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-bounce">{isGrinchMode ? '🤮' : '💘'}</span>
              <h1 className={`text-xl sm:text-2xl font-black tracking-tighter ${isGrinchMode ? 'text-green-500 font-mono uppercase' : 'text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-red-500 font-handwriting'}`}>
                {isGrinchMode ? 'NO-AMOR.EXE' : 'Buzón del Amor'}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Grinch Toggle */}
              <button
                onClick={() => setIsGrinchMode(!isGrinchMode)}
                className={`p-2 rounded-full transition-all hover:scale-110 ${isGrinchMode ? 'bg-green-900/30 text-green-400' : 'bg-pink-100/50 text-pink-600'}`}
                title={isGrinchMode ? "Restaurar Amor" : "Modo Grinch"}
              >
                {isGrinchMode ? <HeartOff size={20} /> : <AlertTriangle size={20} className="text-gray-400 hover:text-red-500" />}
              </button>

              <div className="hidden md:flex items-center gap-2 mr-2">
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
              {messages.map((msg) => {
                let style = { color: 'bg-yellow-200', rotation: 0, theme: 'pastel' }
                try {
                  if (msg.style) style = { ...style, ...JSON.parse(msg.style) }
                } catch (e) { }

                // Theme mappings
                let cardClasses = `aspect-square p-4 shadow-md rounded-sm flex flex-col items-center text-center transition-transform hover:scale-105 relative group overflow-hidden text-gray-800 font-handwriting ${style.color}`

                if (style.theme === 'cyberpunk') {
                  cardClasses = "aspect-square p-4 shadow-[0_0_15px_rgba(236,72,153,0.5)] rounded-xl flex flex-col items-center text-center transition-transform hover:scale-105 relative group overflow-hidden bg-slate-900 border-2 border-pink-500 text-cyan-400 font-mono tracking-wide"
                } else if (style.theme === 'retro') {
                  cardClasses = "aspect-square p-4 shadow-none rounded-none flex flex-col items-center text-center transition-transform hover:scale-105 relative group overflow-hidden bg-gray-200 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-gray-800 font-mono text-gray-900"
                } else if (style.theme === 'vintage') {
                  cardClasses = "aspect-square p-8 shadow-inner rounded-sm flex flex-col items-center text-center transition-transform hover:scale-105 relative group overflow-hidden bg-[#f4e4bc] border border-[#d4c49c] font-serif text-[#5c4b37]"
                } else if (style.theme === 'notebook') {
                  cardClasses = "aspect-square p-6 shadow-md flex flex-col items-center text-center transition-transform hover:scale-105 relative group overflow-hidden bg-white text-gray-800 font-handwriting"
                } else if (style.theme === 'polaroid') {
                  cardClasses = "aspect-[3.5/4.2] p-3 pb-12 shadow-md bg-white flex flex-col items-center text-center transition-transform hover:scale-105 relative group overflow-hidden text-gray-800 transform rotate-1"
                } else if (style.theme === 'newspaper') {
                   cardClasses = "aspect-square p-6 shadow-md rounded-sm flex flex-col items-center text-center transition-transform hover:scale-105 relative group overflow-hidden bg-[#f4f4f4] text-gray-900 font-serif border-double border-4 border-gray-400"
                } else if (style.theme === 'blueprint') {
                   cardClasses = "aspect-square p-6 shadow-lg rounded-sm flex flex-col items-center text-center transition-transform hover:scale-105 relative group overflow-hidden bg-[#1e3a8a] text-blue-100 font-mono border-2 border-dashed border-blue-300"
                } else if (style.theme === 'galaxy') {
                   cardClasses = "aspect-square p-6 shadow-lg rounded-xl flex flex-col items-center text-center transition-transform hover:scale-105 relative group overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-black text-white border border-purple-500/50"
                }

                const hasGif = !!msg.gifUrl
                const hasSpotify = !!msg.spotifyUrl

                let lineClampClass = 'line-clamp-4'
                if (hasGif && hasSpotify) {
                  lineClampClass = 'line-clamp-1'
                } else if (hasGif || hasSpotify) {
                  lineClampClass = 'line-clamp-2'
                }

                const paddingClass = (hasGif && hasSpotify) ? 'p-2' : 'p-4'

                return (
                  <div
                    key={msg.id}
                    className={`${cardClasses} ${paddingClass}`}
                    style={{ transform: `rotate(${style.rotation}deg)` }}
                  >
                    {/* Theme Decorations & Backgrounds */}
                    {style.theme === 'cyberpunk' && (
                      <div className="absolute inset-0 z-0 opacity-20 bg-[linear-gradient(0deg,transparent_24%,rgba(255,0,255,.3)_25%,rgba(255,0,255,.3)_26%,transparent_27%,transparent_74%,rgba(255,0,255,.3)_75%,rgba(255,0,255,.3)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(255,0,255,.3)_25%,rgba(255,0,255,.3)_26%,transparent_27%,transparent_74%,rgba(255,0,255,.3)_75%,rgba(255,0,255,.3)_76%,transparent_77%,transparent)] bg-[length:30px_30px]"></div>
                    )}
                    {style.theme === 'notebook' && (
                      <div className="absolute inset-0 z-0 opacity-20 bg-[linear-gradient(#0099cc_1px,transparent_1px)] bg-[length:100%_24px] mt-6"></div>
                    )}
                    {style.theme === 'vintage' && (
                      <div className="absolute top-2 right-2 opacity-80 text-red-800 z-10">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="#a83f39" opacity="0.9" /><path d="M12 6C12 6 7 9 7 13C7 16 9 18 12 18C15 18 17 16 17 13C17 9 12 6 12 6Z" fill="#7a2e2a" /></svg>
                      </div>
                    )}
                    {style.theme === 'retro' && (
                      <div className="absolute top-0 left-0 right-0 h-6 bg-blue-800 flex items-center px-1 z-20">
                        <span className="text-white text-[10px] uppercase font-bold tracking-wider">Message.exe</span>
                      </div>
                    )}
                    {style.theme === 'newspaper' && (
                      <div className="absolute top-0 w-full border-b border-gray-800 mb-2 py-1 bg-gray-200 z-10">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] block w-full">Extra! Extra!</span>
                      </div>
                    )}
                    {style.theme === 'blueprint' && (
                       <div className="absolute inset-0 z-0 opacity-20 bg-[linear-gradient(#60a5fa_1px,transparent_1px),linear-gradient(90deg,#60a5fa_1px,transparent_1px)] bg-[length:20px_20px]"></div>
                    )}
                    {style.theme === 'galaxy' && (
                       <div className="absolute inset-0 z-0 opacity-50 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent"></div>
                    )}

                    {isAdmin && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id); }}
                        className="absolute top-2 right-2 p-1.5 bg-white/50 hover:bg-red-500 hover:text-white rounded-full text-gray-500 opacity-0 group-hover:opacity-100 transition-all custom-delete-btn z-50"
                        title="Borrar mensaje"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}

                    <div
                      onClick={() => setSelectedMessage(msg)}
                      className={`flex-1 flex flex-col items-center cursor-pointer w-full h-full relative z-10 ${style.theme === 'retro' ? 'pt-6' : ''}`}
                    >
                      {/* Media Content - GIF */}
                      {hasGif && (
                        <div className="w-full h-24 shrink-0 rounded-md overflow-hidden bg-black/10 mb-1">
                          <img src={msg.gifUrl!} alt="GIF" className="w-full h-full object-cover" />
                        </div>
                      )}

                      {/* Content - Responsive Line Clamp */}
                      <div className={`flex-1 w-full text-sm sm:text-base leading-snug break-words flex items-center justify-center min-h-0 ${style.theme === 'polaroid' ? 'bg-black/5 p-2 rounded' : ''}`}>
                        <p className={`${lineClampClass} ${style.theme === 'notebook' ? 'leading-[24px]' : ''}`}>
                          {msg.content}
                        </p>
                      </div>

                      {/* Media Content - Spotify Indicator */}
                      {hasSpotify && (
                        <div className="w-full mt-2 h-8 flex items-center justify-center gap-2 bg-black/5 rounded-full text-xs font-bold text-gray-600 group-hover:bg-green-100 group-hover:text-green-700 transition-colors">
                          <span className="animate-pulse">🎵</span>
                          <span>Tiene Música</span>
                        </div>
                      )}

                      <div className={`mt-1 w-full flex justify-between items-end text-xs opacity-70 ${style.theme === 'cyberpunk' ? 'text-green-400' : 'text-gray-800'} shrink-0`}>
                      <div className="truncate max-w-[70%]"></div>
                        {msg.commentsCount !== undefined && msg.commentsCount > 0 && (
                          <div className="flex items-center gap-1 font-bold">
                            <span>💬</span> {msg.commentsCount}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reaction Section */}
                    <div className={`w-full mt-1 pt-1 border-t shrink-0 ${style.theme === 'cyberpunk' ? 'border-pink-500/30' : 'border-black/5'}`}>
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-center mb-1">
                          {msg.reactions.map((reaction, idx) => (
                            <button
                              key={idx}
                              onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, reaction.emoji); }}
                              className={`text-[10px] px-1.5 py-0.5 rounded-full transition-all ${reaction.userReacted
                                ? 'bg-pink-500 text-white scale-110'
                                : 'bg-white/30 hover:bg-white/60'
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
                )
              })}
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

      {showTour && <TourGuide onComplete={handleTourComplete} />}
    </div>
  )
}