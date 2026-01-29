'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, LogOut, Send, X, Users, Lock, ChevronDown, Eye, EyeOff, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Message {
  id: string
  content: string
  toName: string | null
  fromId: string | null
  style: string | null
  isPublic: boolean
  createdAt: string
}

interface User {
  id: string
  username: string
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'wall' | 'inbox'>('wall')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [areMessagesRevealed, setAreMessagesRevealed] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  
  const router = useRouter()

  // Fetch Config (Reveal Status & Admin Check)
  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config')
      if (res.ok) {
        const data = await res.json()
        setAreMessagesRevealed(data.areMessagesRevealed)
        setIsAdmin(data.isAdmin)
      }
    } catch (error) {
       console.error(error)
    }
  }

  // Fetch messsages
  const fetchMessages = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/messages?type=${activeTab}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

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

  useEffect(() => {
    fetchConfig()
    fetchMessages()
    
    const interval = setInterval(() => {
      fetchMessages()
      fetchConfig() // Check if admin revealed them remotely
    }, 5000)
    
    return () => clearInterval(interval)
  }, [activeTab])

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans text-gray-900">
      {/* App Bar */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-stone-200 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💘</span>
          <h1 className="font-bold text-gray-800 hidden sm:block font-handwriting text-xl">Buzón del Amor (v3.0)</h1>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-full items-center">
          <button 
            onClick={() => setActiveTab('wall')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'wall' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-500'}`}
          >
            <Users size={16} /> Muro
          </button>
          <button 
            onClick={() => setActiveTab('inbox')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'inbox' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-500'}`}
          >
            <Lock size={16} /> Buzón
          </button>
          {isAdmin && (
            <button 
              onClick={() => setActiveTab('admin' as any)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'admin' as any ? 'bg-white shadow-sm text-pink-600' : 'text-gray-500'}`}
            >
              <Eye size={16} /> Admin
            </button>
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
      <main className="flex-1 p-4 overflow-y-auto relative">
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
                      className="absolute top-2 right-2 p-1.5 bg-white/50 hover:bg-red-500 hover:text-white rounded-full text-gray-500 opacity-0 group-hover:opacity-100 transition-all custom-delete-btn"
                      title="Borrar mensaje"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <p className="font-handwriting text-lg leading-tight mb-2 text-gray-900 line-clamp-6 overflow-hidden text-ellipsis">{msg.content}</p>
                  <div className="mt-auto text-xs opacity-70 text-gray-800">
                    Para: {msg.toName || 'Todos'}
                  </div>
                </div>
              ))}
              {messages.length === 0 && !loading && (
                <div className="col-span-full text-center text-gray-400 py-10">
                  ¡El muro está vacío! Sé el primero en publicar algo.
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
          ) : (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-4"
            >
               <h2 className="text-xl font-semibold text-gray-700 mb-4 font-handwriting">Panel Global de Mensajes (Admin)</h2>
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-gray-50 text-gray-700 font-medium">
                     <tr>
                       <th className="p-3">Mensaje</th>
                       <th className="p-3">Para</th>
                       <th className="p-3">Tipo</th>
                       <th className="p-3 text-right">Fecha</th>
                       <th className="p-3 text-right">Acción</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {messages.map(msg => (
                       <tr key={msg.id} className="hover:bg-gray-50">
                         <td className="p-3 max-w-[200px] truncate" title={msg.content}>{msg.content}</td>
                         <td className="p-3">{msg.toName || (msg.isPublic ? 'Todos (Muro)' : 'Privado')}</td>
                         <td className="p-3">
                           <span className={`px-2 py-0.5 rounded-full text-xs ${msg.isPublic ? 'bg-pink-100 text-pink-700' : 'bg-purple-100 text-purple-700'}`}>
                             {msg.isPublic ? 'Muro' : 'Buzón'}
                           </span>
                         </td>
                         <td className="p-3 text-right text-gray-500 text-xs">
                           {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </td>
                         <td className="p-3 text-right">
                            <button 
                              onClick={() => deleteMessage(msg.id)}
                              className="text-gray-400 hover:text-red-600 transition-colors p-1"
                              title="Eliminar mensaje"
                            >
                              <Trash2 size={16} />
                            </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 {messages.length === 0 && (
                   <div className="p-8 text-center text-gray-400">No hay mensajes en la base de datos.</div>
                 )}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsComposeOpen(true)}
        className="fixed bottom-6 right-6 bg-pink-600 text-white p-4 rounded-full shadow-lg hover:bg-pink-700 transition-transform hover:scale-110 active:scale-95 z-40"
      >
        <Plus size={24} />
      </button>

      {/* Compose Modal */}
      <AnimatePresence>
        {isComposeOpen && (
          <ComposeModal 
            onClose={() => setIsComposeOpen(false)} 
            onSent={() => { fetchMessages(); setIsComposeOpen(false); }} 
          />
        )}
      </AnimatePresence>
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

    // Randomize style
    const colors = ['bg-yellow-200', 'bg-pink-200', 'bg-blue-200', 'bg-green-200', 'bg-purple-200', 'bg-orange-200']
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    const randomRotation = Math.floor(Math.random() * 10) - 5 // -5 to 5 deg

    const style = { color: randomColor, rotation: randomRotation }

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          toName: isPublic ? null : toName,
          isPublic,
          style
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
                    <option key={u.id} value={u.username}>{u.username}</option>
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
