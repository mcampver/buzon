import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, X, ChevronDown, Send } from 'lucide-react'
import { User } from '../types'

interface ComposeModalProps {
  onClose: () => void
  onSent: () => void
}

export default function ComposeModal({ onClose, onSent }: ComposeModalProps) {
  const [content, setContent] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [toName, setToName] = useState('')
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  
  // New Fields
  const [spotifyUrl, setSpotifyUrl] = useState('')
  const [gifUrl, setGifUrl] = useState('')
  const [theme, setTheme] = useState<'pastel' | 'cyberpunk' | 'retro' | 'vintage' | 'notebook' | 'polaroid' | 'newspaper' | 'blueprint' | 'galaxy'>('pastel')

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
          isPublic,
          spotifyUrl: spotifyUrl || null,
          gifUrl: gifUrl || null,
          theme
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
        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl h-[90vh] flex flex-col"
      >
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 flex justify-between items-center text-white shrink-0">
          <h3 className="font-bold flex items-center gap-2"><Sparkles size={18} /> Nueva Carta</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Theme Selector */}
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Estilo de Carta</label>
             <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'pastel', label: 'Pastel', color: 'bg-pink-100 border-pink-200 text-pink-800' },
                  { id: 'cyberpunk', label: 'Cyber', color: 'bg-slate-900 border-pink-500 text-green-400' },
                  { id: 'retro', label: 'Retro', color: 'bg-gray-100 border-gray-800 text-gray-900' },
                  { id: 'vintage', label: 'Vintage', color: 'bg-amber-100 border-amber-300 text-amber-900' },
                  { id: 'notebook', label: 'Notas', color: 'bg-white border-blue-200 text-gray-800' },
                  { id: 'polaroid', label: 'Polaroid', color: 'bg-white border-gray-200 text-gray-800' },
                  { id: 'newspaper', label: 'Diario', color: 'bg-gray-200 border-gray-400 text-gray-900' },
                  { id: 'blueprint', label: 'Plano', color: 'bg-blue-900 border-blue-700 text-blue-100' },
                  { id: 'galaxy', label: 'Galaxia', color: 'bg-indigo-900 border-purple-500 text-purple-100' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id as any)}
                    className={`p-2 rounded-lg text-xs font-bold border-2 transition-all flex flex-col items-center gap-1 ${theme === t.id ? 'ring-2 ring-blue-500 scale-105' : 'opacity-70 hover:opacity-100'} ${t.color}`}
                  >
                    <div className="w-full h-4 rounded bg-current opacity-20"></div>
                    {t.label}
                  </button>
                ))}
             </div>
          </div>

          {/* Theme Selector - Visual Preview Logic */}
          {(() => {
             let previewClasses = "w-full p-6 min-h-[160px] rounded-xl transition-all relative overflow-hidden flex flex-col items-center justify-center text-center "
             let placeholderColor = "placeholder-gray-400"
             
             if (theme === 'pastel') {
               previewClasses += "bg-pink-100 border-2 border-pink-200 text-gray-800 font-handwriting"
               placeholderColor = "placeholder-pink-300"
             } else if (theme === 'cyberpunk') {
               previewClasses += "bg-slate-900 border-2 border-pink-500 text-cyan-400 font-mono tracking-wide shadow-[0_0_15px_rgba(236,72,153,0.3)]"
               placeholderColor = "placeholder-gray-600"
             } else if (theme === 'retro') {
               previewClasses += "bg-gray-200 border-t-2 border-l-2 border-white border-b-2 border-r-2 border-gray-800 font-mono text-gray-900"
               placeholderColor = "placeholder-gray-500"
             } else if (theme === 'vintage') {
               previewClasses += "bg-[#f4e4bc] border border-[#d4c49c] font-serif text-[#5c4b37] shadow-inner"
               placeholderColor = "placeholder-[#d4c49c]"
             } else if (theme === 'notebook') {
               previewClasses += "bg-white border-2 border-blue-100 font-handwriting text-gray-800 shadow-sm"
               placeholderColor = "placeholder-gray-300"
             } else if (theme === 'polaroid') {
               previewClasses += "bg-white border text-gray-800 shadow-md pb-12 rotate-1 transform"
             } else if (theme === 'newspaper') {
                previewClasses += "bg-[#f4f4f4] border-gray-300 text-gray-900 font-serif border-y-2 border-double"
                placeholderColor = "placeholder-gray-500"
             } else if (theme === 'blueprint') {
                previewClasses += "bg-[#1e3a8a] text-blue-100 font-mono border-2 border-blue-400 border-dashed"
                placeholderColor = "placeholder-blue-300/50"
             } else if (theme === 'galaxy') {
                previewClasses += "bg-gradient-to-br from-indigo-950 via-purple-900 to-black text-white border border-purple-500/30"
                placeholderColor = "placeholder-purple-300/50"
             }

             return (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vista Previa & Mensaje</label>
                <div className={`${previewClasses} group`}>
                   {/* Theme Backgrounds */}
                   {theme === 'cyberpunk' && (
                     <div className="absolute inset-0 z-0 opacity-20 bg-[linear-gradient(0deg,transparent_24%,rgba(255,0,255,.3)_25%,rgba(255,0,255,.3)_26%,transparent_27%,transparent_74%,rgba(255,0,255,.3)_75%,rgba(255,0,255,.3)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(255,0,255,.3)_25%,rgba(255,0,255,.3)_26%,transparent_27%,transparent_74%,rgba(255,0,255,.3)_75%,rgba(255,0,255,.3)_76%,transparent_77%,transparent)] bg-[length:30px_30px] pointer-events-none"></div>
                   )}
                   {theme === 'notebook' && (
                     <div className="absolute inset-0 z-0 opacity-20 bg-[linear-gradient(#0099cc_1px,transparent_1px)] bg-[length:100%_24px] mt-6 pointer-events-none"></div>
                   )}
                   {theme === 'vintage' && (
                     <div className="absolute top-2 right-2 opacity-80 text-red-800 z-10 pointer-events-none">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="#a83f39" opacity="0.9"/><path d="M12 6C12 6 7 9 7 13C7 16 9 18 12 18C15 18 17 16 17 13C17 9 12 6 12 6Z" fill="#7a2e2a"/></svg>
                     </div>
                   )}
                   {theme === 'retro' && (
                     <div className="absolute top-0 left-0 right-0 h-6 bg-blue-800 flex items-center px-1 z-20 pointer-events-none">
                        <span className="text-white text-[10px] uppercase font-bold tracking-wider">Message.exe</span>
                     </div>
                   )}

                   <div className={`relative z-10 w-full ${theme === 'retro' ? 'mt-4' : ''}`}>
                    <textarea 
                      required
                      maxLength={500}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className={`w-full bg-transparent border-none focus:ring-0 text-center resize-none p-0 ${placeholderColor} ${theme === 'notebook' ? 'leading-[24px]' : ''}`}
                      placeholder="Escribe tu mensaje aquí..."
                      rows={4}
                    />
                   </div>
                </div>
                <div className="text-right text-xs text-gray-400 mt-1">{content.length}/500</div>
              </div>
             )
          })()}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1"> Música (Spotify)</label>
              <input 
                type="text"
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
                className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 pl-8"
                placeholder="Pegar link de canción..."
              />
              {/* Fake Icon */}
              <div className="relative -top-7 left-2 pointer-events-none text-green-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1"> GIF o Imagen</label>
              <input 
                type="url"
                value={gifUrl}
                onChange={(e) => setGifUrl(e.target.value)}
                className="w-full p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="https://media.giphy.com/..."
              />
            </div>
          </div>

          <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
             <div className="flex-1">
               <label className="block text-sm font-medium text-gray-700">Destinatario</label>
               <div className="flex gap-2 mt-1">
                 <button 
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-sm transition-all ${isPublic ? 'bg-pink-100 text-pink-700 font-bold border border-pink-200' : 'bg-white border text-gray-500'}`}
                 >
                   Muro Público
                 </button>
                 <button 
                  type="button"
                  onClick={() => setIsPublic(false)}
                   className={`flex-1 py-1.5 px-3 rounded-lg text-sm transition-all ${!isPublic ? 'bg-pink-100 text-pink-700 font-bold border border-pink-200' : 'bg-white border text-gray-500'}`}
                 >
                   Privado
                 </button>
               </div>
             </div>
             
             {!isPublic && (
               <div className="flex-1 animate-in fade-in slide-in-from-right duration-300">
                  <label className="block text-sm font-medium text-gray-700">Para:</label>
                  <div className="relative mt-1">
                    <select 
                      value={toName}
                      onChange={(e) => setToName(e.target.value)}
                      className="w-full p-2 text-sm border border-pink-200 rounded-lg appearance-none bg-white text-gray-900 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                      required={!isPublic}
                    >
                      <option value="">Seleccionar...</option>
                      {users.map(u => (
                        <option key={u.id} value={u.username}>{u.username}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" size={16} />
                  </div>
               </div>
             )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-pink-500/25 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Enviando amor...' : <><Send size={18} /> Enviar Carta</>}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
